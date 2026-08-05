"use server";

import { getServiceSupabase } from "@/lib/supabase/server";

export type ContactState = {
  status: "idle" | "success" | "error";
  message: string;
  demo?: boolean;
};

export async function submitInquiry(
  _prev: ContactState,
  formData: FormData
): Promise<ContactState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const investment_range = String(formData.get("investment_range") ?? "").trim() || null;
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !message) {
    return { status: "error", message: "Name, email and message are required." };
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) {
    return { status: "error", message: "Please provide a valid email." };
  }

  let sb: ReturnType<typeof getServiceSupabase> | null = null;
  try {
    sb = getServiceSupabase();
  } catch {
    sb = null;
  }

  // Demo mode: Supabase not configured yet. Acknowledge without persisting.
  if (!sb) {
    return {
      status: "success",
      demo: true,
      message: "Thanks! (Demo mode — connect Supabase to store inquiries.)"
    };
  }

  const { error } = await sb.from("inquiries").insert({
    name,
    email,
    phone,
    investment_range,
    message
  });

  if (error) {
    return { status: "error", message: "Could not save your message. Please try again." };
  }

  return { status: "success", message: "Thanks! Your message is on its way." };
}
