"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/client-track";

/**
 * Records a page_view event for content analytics (popular projects/posts).
 * Renders nothing. Fires once per page load — the /api/track endpoint rate
 * limits per IP and only accepts the whitelisted event name.
 */
export default function PageViewTracker({
  kind,
  slug
}: {
  kind: "project" | "post";
  slug: string;
}) {
  useEffect(() => {
    try {
      trackEvent("page_view", { kind, slug });
    } catch {}
  }, [kind, slug]);
  return null;
}
