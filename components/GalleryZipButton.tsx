"use client";

import { useEffect, useState } from "react";
import TrackDownload from "@/components/TrackDownload";

// Reads a ?access= download token from the URL and renders either the
// "Download all (N)" ZIP link (token appended) or a tracked "Request gallery"
// link. The download route verifies the token server-side, so a forged token
// simply fails there.
const TOKEN_RE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

export default function GalleryZipButton({
  slug,
  title,
  count,
  allowed
}: {
  slug: string;
  title: string;
  count: number;
  allowed: boolean;
}) {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    try {
      const t = new URLSearchParams(window.location.search).get("access");
      setToken(t && TOKEN_RE.test(t) ? t : null);
    } catch {}
  }, []);

  if (allowed || token) {
    return (
      <a
        href={`/api/projects/${slug}/download-all${token ? `?t=${token}` : ""}`}
        className="btn btn-ghost btn-sm"
        title="Download the full gallery as a ZIP"
      >
        <i className="fa-solid fa-file-zipper" aria-hidden="true" />
        Download all ({count})
      </a>
    );
  }
  return (
    <TrackDownload
      href={`/contact?about=${encodeURIComponent(`Request access to the full gallery of ${title}`)}`}
      kind="project"
      slug={slug}
      event="download_request"
      className="btn btn-ghost btn-sm"
      title="Downloads are restricted — request access"
    >
      <i className="fa-solid fa-lock" aria-hidden="true" />
      Request gallery
    </TrackDownload>
  );
}
