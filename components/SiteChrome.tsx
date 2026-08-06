"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import ViewTransitions from "@/components/ViewTransitions";

/**
 * Wraps site content in the homepage Header/Footer chrome. The admin portal
 * (/admin/*) has its own chrome (AdminNav) and must NOT show the public
 * header/footer, so we skip them on those routes.
 *
 * Header/Footer are passed in as props from the server layout (NOT imported
 * here): Footer is an async Server Component, and importing it inside this
 * client component would turn it into an async client component — a React
 * error that breaks hydration and kills every click handler on the page.
 * Elements passed as props stay server-rendered (RSC escape hatch).
 */
export default function SiteChrome({
  header,
  footer,
  children
}: {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <ViewTransitions>
      {header}
      <main>{children}</main>
      {footer}
    </ViewTransitions>
  );
}
