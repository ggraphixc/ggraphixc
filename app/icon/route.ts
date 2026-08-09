import { getSettings } from "@/lib/data";

export const revalidate = 300;

// Default brand mark (matches the old app/icon.svg) — used when the owner
// hasn't uploaded a favicon in Admin → Settings yet.
const DEFAULT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#00d2ff"/>
      <stop offset="1" stop-color="#005bea"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="#0a0a0c"/>
  <circle cx="32" cy="32" r="15" fill="url(#g)"/>
  <circle cx="32" cy="32" r="24" fill="none" stroke="#00d2ff" stroke-opacity="0.35" stroke-width="2"/>
</svg>`;

export async function GET() {
  const s = await getSettings();
  const favicon = s.favicon_image?.trim();
  if (favicon) {
    // Serve the owner's uploaded icon (Cloudinary URL) with a browser-safe
    // redirect. Redirects work for favicons everywhere (browsers follow them).
    return Response.redirect(favicon, 302);
  }
  return new Response(DEFAULT_SVG, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=300, s-maxage=300"
    }
  });
}
