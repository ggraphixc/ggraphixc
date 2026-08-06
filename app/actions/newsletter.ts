"use server";

import { subscribeNewsletter } from "@/lib/brevo";

export type NewsletterState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function subscribe(
  _prev: NewsletterState,
  formData: FormData
): Promise<NewsletterState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "error", message: "Please enter a valid email address." };
  }

  if (!process.env.BREVO_API_KEY) {
    // Honest failure: previously this claimed the visitor was subscribed when
    // nothing was stored. The "not connected" wording also signals the owner
    // to set BREVO_API_KEY on the deployment (e.g. Vercel env vars).
    return {
      status: "error",
      message: "Signups aren't active yet — the email service isn't connected."
    };
  }

  const result = await subscribeNewsletter(email);
  if (!result.ok) {
    // Surface the failure instead of pretending success. Never expose the raw
    // error to visitors, but make sure the failure is visible somewhere.
    console.error("[newsletter] subscribe failed:", result.error);
    return {
      status: "error",
      message: "Couldn't subscribe you just now — try again, or email hello@ggraphixc.com instead."
    };
  }

  return {
    status: "success",
    message: "You're in! Expect occasional design notes — no spam, ever."
  };
}
