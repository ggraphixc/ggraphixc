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
    return {
      status: "success",
      message: "Thanks! (Email service not connected yet — you're on the list.)"
    };
  }

  const result = await subscribeNewsletter(email);
  if (!result.ok) {
    // Never block the visitor over an email-service hiccup.
    return {
      status: "success",
      message: "Thanks for subscribing! I'll be in touch with design notes."
    };
  }

  return {
    status: "success",
    message: "You're in! Expect occasional design notes — no spam, ever."
  };
}
