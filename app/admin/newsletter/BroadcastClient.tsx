"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendBroadcast, sendTestBroadcast, type BroadcastState } from "@/app/actions/broadcast";
import { buildWelcomeEmailHtml } from "@/lib/welcome-email";

type PickableProject = {
  slug: string;
  title: string;
  category: string;
  result: string;
  description: string;
};

type Props = {
  recipients: string[];
  brevoConfigured: boolean;
  recipientsError?: string | null;
  ownerEmail: string;
  brand: string;
  signoff: string;
  projects?: PickableProject[];
};

const MAX_SHOWN = 24;

export default function BroadcastClient({
  recipients,
  brevoConfigured,
  recipientsError,
  ownerEmail,
  brand,
  signoff,
  projects = []
}: Props) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<BroadcastState | null>(null);
  const [busy, setBusy] = useState<"test" | "all" | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // AI draft panel
  const [showAi, setShowAi] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiTone, setAiTone] = useState("Friendly");
  const [aiProject, setAiProject] = useState(""); // "" = auto (latest project)
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiDone, setAiDone] = useState(false);
  const [aiSubjects, setAiSubjects] = useState<string[]>([]);
  // A finished draft waits here when the message already has content, so it
  // can't silently overwrite what the owner typed.
  const [pendingDraft, setPendingDraft] = useState<string | null>(null);

  // Live preview from the current (unsaved) values — the sign-off, projects
  // CTA and per-subscriber unsubscribe link are appended exactly as in a real
  // send, so what you see is what subscribers get.
  const previewHtml = buildWelcomeEmailHtml({
    brand,
    headline: subject.trim() || "Your subject line",
    body: body.trim() || "Your message body goes here. Blank lines become paragraphs.",
    signoff,
    unsubscribeHref: "https://ggraphixc.vercel.app/unsubscribe?t=preview-token"
  });

  const recipientsShown = recipients.slice(0, MAX_SHOWN);
  const recipientsHidden = recipients.length - recipientsShown.length;
  const canSend = subject.trim() && body.trim() && recipients.length > 0;

  function run(kind: "test" | "all", fn: () => Promise<BroadcastState>) {
    setBusy(kind);
    setResult(null);
    setConfirming(false);
    startTransition(async () => {
      const res = await fn();
      setResult(res);
      setBusy(null);
      // Refresh the server page so the delivery-jobs list shows the new run.
      if (kind === "all") router.refresh();
    });
  }

  async function aiWrite() {
    if (aiBusy) return; // Enter can fire while a draft is generating
    if (!aiTopic.trim()) {
      setAiError("Tell the AI what to write about first.");
      return;
    }
    setAiBusy(true);
    setAiError(null);
    setAiDone(false);
    setPendingDraft(null);
    setAiSubjects([]);
    try {
      const picked = projects.find((p) => p.slug === aiProject);
      const res = await fetch("/api/ai/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: aiTopic.trim(),
          tone: aiTone,
          project: picked
            ? {
                title: picked.title,
                category: picked.category,
                result: picked.result,
                description: picked.description
              }
            : undefined
        })
      });
      const json = (await res.json().catch(() => ({}))) as {
        body?: string;
        subjects?: string[];
        error?: string;
      };
      if (!res.ok || !json.body) {
        throw new Error(json.error || "The AI draft failed.");
      }
      if (Array.isArray(json.subjects) && json.subjects.length > 0) {
        setAiSubjects(json.subjects);
      }
      // Never overwrite what the owner already wrote without asking.
      if (body.trim()) {
        setPendingDraft(json.body);
      } else {
        setBody(json.body);
        setAiDone(true);
      }
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "The AI draft failed.");
    } finally {
      setAiBusy(false);
    }
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>Newsletter broadcast</h1>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            Compose a one-off email and send it to every Brevo Newsletter subscriber.
          </p>
        </div>
        <span className="badge-dot" style={{ fontSize: 13, fontWeight: 700 }}>
          {!brevoConfigured ? (
            "Brevo not connected"
          ) : recipientsError ? (
            "List unavailable"
          ) : (
            <>
              <i className="fa-solid fa-users" style={{ marginRight: 6 }} />
              {recipients.length} subscriber{recipients.length === 1 ? "" : "s"}
            </>
          )}
        </span>
      </div>

      <div className="admin-card" style={{ marginBottom: 18 }}>
        <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 14 }}>Compose</h3>

        <div className="field">
          <label htmlFor="b-subject">Subject line</label>
          <input
            id="b-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Design notes: the before/after nobody saw"
            maxLength={120}
          />
          <span style={{ fontSize: 11, color: "var(--muted)" }}>
            {subject.length}/120 — used as both the subject and the email headline.
          </span>
        </div>

        <div className="field">
          <label htmlFor="b-body">Message</label>
          <textarea
            id="b-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={"Write your newsletter here.\n\nSeparate paragraphs with a blank line."}
            rows={8}
            style={{ minHeight: 160 }}
          />
          <span style={{ fontSize: 11, color: "var(--muted)" }}>
            Plain text — a blank line becomes a new paragraph. The sign-off, “See the work” button,
            and each subscriber’s own unsubscribe link are added automatically.
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            margin: "4px 0 16px",
            paddingTop: 16,
            borderTop: "1px solid var(--border)"
          }}
        >
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setShowAi((a) => !a)}
            aria-expanded={showAi}
          >
            <i className="fa-solid fa-wand-magic-sparkles" style={{ marginRight: 6 }} />
            {showAi ? "Close" : "AI"} write
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setShowPreview((p) => !p)}
            aria-expanded={showPreview}
          >
            <i className="fa-solid fa-eye" style={{ marginRight: 6 }} />
            {showPreview ? "Hide" : "Preview"} email
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => run("test", () => sendTestBroadcast(subject, body))}
            disabled={busy !== null || !subject.trim() || !body.trim()}
          >
            <i className="fa-solid fa-paper-plane" style={{ marginRight: 6 }} />
            {busy === "test" ? "Sending…" : `Send test to ${ownerEmail}`}
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setConfirming(true)}
            disabled={busy !== null || !canSend}
          >
            <i className="fa-solid fa-bullhorn" style={{ marginRight: 6 }} />
            {busy === "all" ? "Sending…" : `Send to all ${recipients.length}`}
          </button>
        </div>

        {showAi && (
          <div
            style={{
              margin: "0 0 16px",
              padding: 16,
              border: "1px solid var(--border)",
              borderRadius: 12,
              background: "var(--surface)"
            }}
          >
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
              Describe the topic in a line — the AI drafts the message paragraphs in your brand&apos;s
              voice and suggests subject lines. Optionally feature a real portfolio project as the
              concrete example. You keep the final word.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div className="field" style={{ flex: "2 1 260px", marginBottom: 0 }}>
                <label htmlFor="ai-topic">Topic</label>
                <input
                  id="ai-topic"
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="e.g. The anatomy of a brand refresh"
                  maxLength={200}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void aiWrite();
                    }
                  }}
                />
              </div>
              <div className="field" style={{ flex: "1 1 160px", marginBottom: 0 }}>
                <label htmlFor="ai-tone">Tone</label>
                <select id="ai-tone" value={aiTone} onChange={(e) => setAiTone(e.target.value)}>
                  <option>Friendly</option>
                  <option>Professional</option>
                  <option>Story-driven</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end", marginTop: 10 }}>
              <div className="field" style={{ flex: "2 1 260px", marginBottom: 0 }}>
                <label htmlFor="ai-project">Feature a project</label>
                <select
                  id="ai-project"
                  value={aiProject}
                  onChange={(e) => setAiProject(e.target.value)}
                  disabled={projects.length === 0}
                >
                  <option value="">Auto — latest project</option>
                  {projects.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => void aiWrite()}
                disabled={aiBusy}
              >
                <i className="fa-solid fa-wand-magic-sparkles" style={{ marginRight: 6 }} />
                {aiBusy ? "Writing…" : "Write draft"}
              </button>
            </div>
            {aiError && (
              <p style={{ color: "#ff8080", fontSize: 13, marginTop: 10 }}>
                <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 6 }} />
                {aiError}
              </p>
            )}
            {aiDone && !aiBusy && (
              <p style={{ color: "var(--accent)", fontSize: 13, marginTop: 10 }}>
                <i className="fa-solid fa-circle-check" style={{ marginRight: 6 }} />
                Draft inserted into the message — tweak it, then preview before sending.
              </p>
            )}
            {aiSubjects.length > 0 && !aiBusy && (
              <div style={{ marginTop: 12 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 8 }}>
                  SUBJECT IDEAS — CLICK ONE TO USE IT
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {aiSubjects.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setSubject(s)}
                      style={{ maxWidth: "100%" }}
                    >
                      <i className="fa-solid fa-arrow-right-to-bracket" style={{ marginRight: 6 }} />
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {pendingDraft && !aiBusy && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                  marginTop: 12,
                  padding: 12,
                  border: "1px solid var(--accent)",
                  borderRadius: 10,
                  background: "rgba(124,92,255,.08)"
                }}
              >
                <span style={{ fontSize: 13, flex: "1 1 220px" }}>
                  <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 6, color: "var(--accent)" }} />
                  The draft is ready — but the message already has content. Replace it?
                </span>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setBody(pendingDraft);
                    setPendingDraft(null);
                    setAiDone(true);
                  }}
                >
                  Replace draft
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setPendingDraft(null)}
                >
                  Keep my text
                </button>
              </div>
            )}
          </div>
        )}

        {showPreview && (
          <div>
            <iframe
              title="Broadcast email preview"
              sandbox=""
              srcDoc={previewHtml}
              style={{
                width: "100%",
                height: 460,
                border: "1px solid var(--border)",
                borderRadius: 12,
                background: "#fff"
              }}
            />
            <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
              Rendered from your current draft. In a real send, each recipient gets their own
              signed unsubscribe link.
            </p>
          </div>
        )}
      </div>

      {!brevoConfigured && (
        <div className="admin-card" style={{ borderColor: "#7c5cff66" }}>
          <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 8 }}>
            <i className="fa-solid fa-circle-info" style={{ marginRight: 6, color: "var(--accent)" }} />
            <strong>Brevo isn’t connected on this deployment.</strong> Add{" "}
            <code style={{ background: "var(--surface)", padding: "2px 6px", borderRadius: 6 }}>BREVO_API_KEY</code>{" "}
            to your environment to see the subscriber list and send broadcasts.
          </p>
        </div>
      )}

      {recipientsError && (
        <div className="admin-card" style={{ borderColor: "#ff8080", borderWidth: 1.5 }}>
          <p style={{ fontSize: 14, color: "var(--muted)" }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 6, color: "#ff8080" }} />
            Couldn&apos;t load the subscriber list from Brevo ({recipientsError}).
            Reload the page to try again — no emails have been sent.
          </p>
        </div>
      )}

      {brevoConfigured && !recipientsError && recipients.length === 0 && (
        <div className="admin-card">
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            The Newsletter list is empty — share the footer signup form to grow it, then come
            back to broadcast.
          </p>
        </div>
      )}

      {recipients.length > 0 && (
        <div className="admin-card">
          <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>Recipients</h3>
          <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 12 }}>
            Everyone on the Brevo “Newsletter” list — {recipients.length} address
            {recipients.length === 1 ? "" : "es"} in total.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {recipientsShown.map((email) => (
              <span
                key={email}
                style={{
                  fontSize: 12.5,
                  padding: "6px 12px",
                  borderRadius: 999,
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--muted)"
                }}
              >
                {email}
              </span>
            ))}
            {recipientsHidden > 0 && (
              <span
                style={{
                  fontSize: 12.5,
                  padding: "6px 12px",
                  borderRadius: 999,
                  background: "var(--surface)",
                  border: "1px dashed var(--border)",
                  color: "var(--muted)"
                }}
              >
                +{recipientsHidden} more
              </span>
            )}
          </div>
        </div>
      )}

      {result && (
        <div
          className="admin-card"
          style={{
            borderColor: result.ok ? "var(--accent)" : "#ff8080",
            borderWidth: 1.5
          }}
        >
          <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>
            {result.queued ? (
              <>
                <i className="fa-solid fa-clock-rotate-left" style={{ color: "var(--accent)", marginRight: 8 }} />
                Delivering in the background
              </>
            ) : result.ok ? (
              <>
                <i className="fa-solid fa-circle-check" style={{ color: "var(--accent)", marginRight: 8 }} />
                Done
              </>
            ) : (
              <>
                <i className="fa-solid fa-triangle-exclamation" style={{ color: "#ff8080", marginRight: 8 }} />
                Something didn’t send
              </>
            )}
          </h3>
          <p style={{ fontSize: 14, marginBottom: result.failures?.length ? 10 : 0 }}>
            {result.message}
          </p>
          {result.failures && result.failures.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--muted)", lineHeight: 1.8 }}>
              {result.failures.map((f) => (
                <li key={f.email}>
                  <strong>{f.email}</strong> — {f.error}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {confirming && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(6,8,14,.7)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 100
          }}
          onClick={() => setConfirming(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Confirm broadcast"
        >
          <div
            className="admin-card"
            style={{ maxWidth: 460, width: "100%", margin: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
              Send to {recipients.length} subscriber{recipients.length === 1 ? "" : "s"}?
            </h3>
            <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.6, marginBottom: 8 }}>
              This emails everyone on the Newsletter list immediately. There’s no undo — and each
              email counts toward Brevo’s daily limit.
            </p>
            <p style={{ fontSize: 13.5, marginBottom: 18 }}>
              <strong>{subject.trim() || "No subject"}</strong>
              {body.trim() && <> — {body.trim().slice(0, 90)}{body.trim().length > 90 ? "…" : ""}</>}
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirming(false)} disabled={isPending}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => run("all", () => sendBroadcast(subject, body))}
                disabled={isPending}
              >
                <i className="fa-solid fa-bullhorn" style={{ marginRight: 6 }} />
                {isPending ? "Sending…" : `Send to all ${recipients.length}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
