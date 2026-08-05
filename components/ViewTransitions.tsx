"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

/**
 * 2026 platform layer: wraps same-origin internal navigations in the native
 * View Transitions API (document.startViewTransition).
 *
 * Implemented as a capture-phase click interceptor on <a> links — this never
 * mutates the router object, so it stays compatible with the React Compiler.
 * Unsupported browsers fall back to regular navigation (pure enhancement).
 */
export default function ViewTransitions({ children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (typeof document === "undefined" || !document.startViewTransition) return;

    const onClick = (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.("a");
      if (!anchor) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/")) return;

      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return;

      // Same-origin internal link: run navigation inside a view transition.
      e.preventDefault();
      document.startViewTransition(async () => {
        await router.push(href);
      });
    };

    // Capture phase: run BEFORE Next's <Link> handler (which calls preventDefault
    // itself in the bubble phase at the React root container).
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  return children;
}
