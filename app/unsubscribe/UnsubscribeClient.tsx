"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function UnsubscribeClient({
  brand,
  contactEmail
}: {
  brand: string;
  contactEmail: string;
}) {
  const params = useSearchParams();
  const email = (params.get("e") ?? "").trim().toLowerCase();
  const valid = EMAIL_RE.test(email);

  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && j.ok) {
        setDone(true);
      } else {
        setError(j.error || "Something went wrong — please try again.");
      }
    } catch {
      setError("Something went wrong — please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24
      }}
    >
      <div className="glass" style={{ padding: 36, width: "100%", maxWidth: 440, textAlign: "center" }}>
        <div className="brand" style={{ marginBottom: 6, justifyContent: "center" }}>
          <span className="dot" /> {brand}
        </div>

        {done ? (
          <>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: "14px 0 6px" }}>You&apos;re unsubscribed ✅</h1>
            <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
              <strong style={{ color: "var(--text)" }}>{email}</strong> has been removed from
              the {brand} design notes. No more design emails from us.
            </p>
            <Link href="/" className="btn btn-primary" style={{ display: "inline-flex", width: "100%", justifyContent: "center" }}>
              Back to {brand}
            </Link>
          </>
        ) : !valid ? (
          <>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: "14px 0 6px" }}>Link looks incomplete</h1>
            <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
              This unsubscribe link is missing its email address. If the link was forwarded,
              try opening it from the original email — or email{" "}
              <a href={`mailto:${contactEmail}`} style={{ color: "var(--accent)" }}>
                {contactEmail}
              </a>{" "}
              and ask to be removed.
            </p>
            <Link href="/" className="btn btn-outline" style={{ display: "inline-flex", width: "100%", justifyContent: "center" }}>
              Go to homepage
            </Link>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: "14px 0 6px" }}>Unsubscribe from design notes?</h1>
            <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.7, marginBottom: 8 }}>
              We&apos;ll remove <strong style={{ color: "var(--text)" }}>{email}</strong> from the
              {brand} newsletter list. You can always re-subscribe later.
            </p>

            {error && (
              <p style={{ color: "#ff8080", fontSize: 13, margin: "10px 0" }}>{error}</p>
            )}

            <button
              type="button"
              className="btn btn-primary"
              disabled={busy}
              onClick={confirm}
              style={{ width: "100%", justifyContent: "center", marginTop: 14 }}
            >
              {busy ? "Removing…" : "Yes, unsubscribe me"}
            </button>
            <Link
              href="/"
              style={{ display: "inline-block", marginTop: 14, fontSize: 13, color: "var(--muted)" }}
            >
              No thanks — keep my subscription
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
