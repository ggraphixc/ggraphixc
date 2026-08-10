// Server-only: stream a single image as an attachment download. The file is
// fetched (watermarked) and re-served with Content-Disposition: attachment —
// the browser never sees a direct fl_attachment Cloudinary URL, so the whole
// download path is controlled by the routes that call this helper.
import { NextResponse } from "next/server";
import { cloudinaryWatermarkUrl, type WatermarkOptions } from "@/lib/images";

export async function streamImageDownload(
  url: string,
  filename: string,
  watermark?: WatermarkOptions
): Promise<NextResponse> {
  const target = cloudinaryWatermarkUrl(url, watermark);
  const res = await fetch(target, { signal: AbortSignal.timeout(45_000) });
  if (!res.ok) {
    return NextResponse.json({ error: "Could not fetch the image" }, { status: 502 });
  }
  const buf = Buffer.from(await res.arrayBuffer());
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}
