"use client";

import { trackEvent } from "@/lib/client-track";

/**
 * An <a> that records a "download" analytics event when clicked. Used for
 * download controls rendered from server components (blog pills, the gallery
 * ZIP button) so the click is still tracked without shipping analytics state
 * to the server.
 */
export default function TrackDownload({
  href,
  download,
  kind,
  slug,
  className,
  title,
  children,
  event = "download"
}: {
  href: string;
  download?: string;
  kind: "project" | "post";
  slug: string;
  className?: string;
  title?: string;
  children: React.ReactNode;
  /** Which analytics event to fire on click. */
  event?: "download" | "download_request";
}) {
  return (
    <a
      href={href}
      download={download}
      className={className}
      title={title}
      onClick={() => {
        try {
          trackEvent(event, { kind, slug });
        } catch {}
      }}
    >
      {children}
    </a>
  );
}
