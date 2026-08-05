import { v2 as cloudinary } from "cloudinary";

// Server-only Cloudinary client. Configured from the single CLOUDINARY_URL
// env var (cloudinary://API_KEY:API_SECRET@CLOUD_NAME). Keep it server-side:
// it contains the API secret and must never reach the browser.
export function getCloudinary() {
  const url = process.env.CLOUDINARY_URL;
  if (!url) {
    throw new Error("Missing CLOUDINARY_URL (add it to .env.local)");
  }
  // cloudinary://API_KEY:API_SECRET@CLOUD_NAME — the v2 SDK does not accept
  // `config({ url })` directly, so parse the credentials out of the URL.
  const parsed = new URL(url);
  cloudinary.config({
    cloud_name: parsed.hostname,
    api_key: decodeURIComponent(parsed.username),
    api_secret: decodeURIComponent(parsed.password)
  });
  return cloudinary;
}
