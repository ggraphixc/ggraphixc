"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export function UnsubscribeClient({
  brand,
  contactEmail
}: {
  brand: string;
  contactEmail: string;
}) {
  const params = useSearchParams();
  // Signed token ("<encoded email>.<signature>") — the server verifies it.
  // The raw email is never shown in the URL.
  const token = (params.get("t") ?? "").trim();
  const tokenLooksValid = token.includes(".") && token.split(".").every((p) => p.length > 0);

  const [phase, setPhase] = useState<"confirm" | "busy" | "done" | "error">("confirm");
  const [resub, setResub] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState("");

  async function call(route: string) {
    setPhase("busy");
    setError("");
    try {
      const res = await fetch(route, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && j.ok) {
        setPhase("done");
      } else {
        setError(j.error || "Something went wrong — please try again.");
        setPhase("error");
      }
    } catch {
      setError("Something went wrong — please try again.");
      setPhase("error");
    }
  }

  async function resubscribe() {
    setResub("busy");
    try {
      const res = await fetch("/api/newsletter/resubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });
      const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      setResub(res.ok && j.ok ? "done" : "idle");
      if (!res.ok || !j.ok) {
        setError(j.error || "Couldn't resubscribe you just now.");
      }
    } catch {
      setResub("idle");
      setError("Couldn't resubscribe you just now.");
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

        {!tokenLooksValid ? (
          <>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: "14px 0 6px" }}>Link looks incomplete</h1>
            <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
              This unsubscribe link is missing its security code. If the link was
              forwarded, try opening it from the original email — or email{" "}
              <a href={`mailto:${contactEmail}`} style={{ color: "var(--accent)" }}>
                {contactEmail}
              </a>{" "}
              and ask to be removed.
            </p>
            <Link href="/" className="btn btn-outline" style={{ display: "inline-flex", width: "100%", justifyContent: "center" }}>
              Go to homepage
            </Link>
          </>
        ) : phase === "done" ? (
          <>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: "14px 0 6px" }}>You&apos;re unsubscribed ✅</h1>
            <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.7, marginBottom: 6 }}>
              This address has been removed from the {brand} design notes — no more
              design emails from us.
            </p>

            {resub === "done" ? (
              <p
                style={{
                  marginTop: 18,
                  padding: 14,
                  borderRadius: 12,
                  background: "rgba(124,92,255,0.08)",
                  border: "1px solid rgba(124,92,255,0.25)",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "var(--accent)"
                }}
              >
                You&apos;re back on the list 🎉
              </p>
            ) : (
              <div
                style={{
                  marginTop: 18,
                  padding: 16,
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.03)"
                }}
              >
                <p style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 4 }}>Changed your mind?</p>
                <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 12 }}>
                  One click puts you back on the list.
                </p>
                {error && <p style={{ color: "#ff8080", fontSize: 12.5, marginBottom: 10 }}>{error}</p>}
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={resub === "busy"}
                  onClick={resubscribe}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  {resub === "busy" ? "Adding you back…" : "Yes, resubscribe me"}
                </button>
                <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 10, opacity: 0.75 }}>
                  Resubscribed addresses get the next design note — no duplicate emails.
                </p>
              </div>
            )}

            <Link
              href="/"
              style={{ display: "inline-block", marginTop: 16, fontSize: 13, color: "var(--muted)" }}
            >
              Back to {brand}
            </Link>
          </>
        ) : phase === "error" ? (
          <>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: "14px 0 6px" }}>Something went wrong</h1>
            <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.7, marginBottom: 6 }}>{error}</p>
            <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 18 }}>
              You can also email{" "}
              <a href={`mailto:${contactEmail}`} style={{ color: "var(--accent)" }}>
                {contactEmail}
              </a>{" "}
              and ask to be removed.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => call("/api/newsletter/unsubscribe")}
              style={{ width: "100%", justifyContent: "center" }}
            >
              Try again
            </button>
            <Link
              href="/"
              style={{ display: "inline-block", marginTop: 14, fontSize: 13, color: "var(--muted)" }}
            >
              Go to homepage
            </Link>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: "14px 0 6px" }}>Unsubscribe from design notes?</h1>
            <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.7, marginBottom: 8 }}>
              You&apos;ll stop receiving the {brand} design notes. You can always
              re-subscribe later.
            </p>

            {error && <p style={{ color: "#ff8080", fontSize: 13, margin: "10px 0" }}>{error}</p>}

            <button
              type="button"
              className="btn btn-primary"
              disabled={phase === "busy"}
              onClick={() => call("/api/newsletter/unsubscribe")}
              style={{ width: "100%", justifyContent: "center", marginTop: 14 }}
            >
              {phase === "busy" ? "Removing…" : "Yes, unsubscribe me"}
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
