import { NextResponse } from "next/server";

// Browsers probe /favicon.ico by default even when the page advertises
// metadata icons. Point it at the dynamic /icon route (which serves the
// uploaded favicon_image or the default brand mark). Redirect is relative to
// the incoming request so it always stays on the right host.
export async function GET(req: Request) {
  return NextResponse.redirect(new URL("/icon", req.url), 302);
}
