import { NextResponse } from "next/server";
import { drainBroadcastJobs } from "@/lib/broadcast-queue";

// One batch of ~80 sequential sends can take ~40s on the slow side.
export const maxDuration = 60;

// Vercel Cron sends `Authorization: Bearer $CRON_SECRET` when the env var is
// set. Locally (non-production) the endpoint is open for testing; in
// production a missing/mismatched secret rejects the request so no one can
// trigger sends except the platform.
function authorized(request: Request): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function handler(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Drain up to 3 jobs (or until the ~35s budget is nearly spent). This runs
  // once a day on Hobby plans as a safety net; the admin's “Continue sending”
  // button is the primary way large broadcasts finish quickly.
  const result = await drainBroadcastJobs(3, 35_000);
  return NextResponse.json(result);
}

export const GET = handler;
export const POST = handler;
