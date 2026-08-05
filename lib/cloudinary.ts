import { v2 as cloudinary } from "cloudinary";

// Server-only Cloudinary client. Configured from the single CLOUDINARY_URL
// env var (cloudinary://API_KEY:API_SECRET@CLOUD_NAME). Keep it server-side:
// it contains the API secret and must never reach the browser.
export function getCloudinary() {
  if (!process.env.CLOUDINARY_URL) {
    throw new Error("Missing CLOUDINARY_URL (add it to .env.local)");
  }
  cloudinary.config({ url: process.env.CLOUDINARY_URL });
  return cloudinary;
}
