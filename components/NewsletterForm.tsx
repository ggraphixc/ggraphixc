"use client";

import { useActionState } from "react";
import { subscribe, type NewsletterState } from "@/app/actions/newsletter";

const initial: NewsletterState = { status: "idle", message: "" };

export default function NewsletterForm() {
  const [state, formAction, pending] = useActionState(subscribe, initial);

  return (
    <div>
      <h4>Design Notes</h4>
      <p style={{ color: "var(--muted)", fontSize: 13, margin: "10px 0 12px", lineHeight: 1.6 }}>
        One short email a month — brand systems, design craft, and what&apos;s working.
      </p>
      <form action={formAction} style={{ display: "flex", gap: 8 }}>
        <input
          type="email"
          name="email"
          required
          placeholder="you@brand.com"
          aria-label="Email for design notes"
          style={{
            flex: 1,
            minWidth: 0,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-pill)",
            padding: "12px 16px",
            color: "var(--text)",
            fontSize: 14,
            outline: "none",
            minHeight: 44
          }}
        />
        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary"
          style={{ minHeight: 44, padding: "0 20px" }}
          aria-label="Subscribe to design notes"
        >
          {pending ? "..." : <i className="fa-solid fa-arrow-right" />}
        </button>
      </form>
      {state.message && (
        <p
          role="status"
          style={{
            marginTop: 10,
            fontSize: 12.5,
            color: state.status === "error" ? "#ff8080" : "var(--accent)"
          }}
        >
          {state.message}
        </p>
      )}
    </div>
  );
}
