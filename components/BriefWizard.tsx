"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { submitInquiry, type ContactState } from "@/app/actions/contact";
import { trackEvent } from "@/lib/client-track";

const PROJECT_TYPES = [
  { icon: "fa-solid fa-palette", label: "Brand Identity", desc: "Logo, identity system, guidelines" },
  { icon: "fa-solid fa-megaphone", label: "Social & Campaign", desc: "Kits, ads, launch campaigns" },
  { icon: "fa-solid fa-window-maximize", label: "Product & UI Design", desc: "Apps, dashboards, websites" },
  { icon: "fa-solid fa-box-open", label: "Packaging & Print", desc: "Packaging, labels, print collateral" },
  { icon: "fa-solid fa-camera-retro", label: "Art Direction", desc: "Shoots, visual concepts" },
  { icon: "fa-solid fa-ellipsis", label: "Something else", desc: "A different kind of project" }
];

const TIMELINES = ["ASAP — within days", "1–2 weeks", "3–4 weeks", "1–2 months", "Flexible — no rush"];
const RANGES = ["< $1k", "$1k - $5k", "$5k - $15k", "$15k+"];

const STEPS = ["Project type", "Goals", "Details"];

const initial: ContactState = { status: "idle", message: "" };

export default function BriefWizard() {
  const [step, setStep] = useState(0);
  const [projectType, setProjectType] = useState("");
  const [goals, setGoals] = useState("");
  const [timeline, setTimeline] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [budget, setBudget] = useState("");
  const [hint, setHint] = useState("");

  const [state, formAction, pending] = useActionState(submitInquiry, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const stampRef = useRef<HTMLInputElement>(null);
  // Remember the last seen status so the reset below runs exactly once per
  // successful submission (avoiding the setState-in-effect lint rule by
  // delegating the state writes to a helper).
  const prevStatusRef = useRef<ContactState["status"]>("idle");

  // Time-trap stamp (same anti-bot contract as the single form on the home page).
  useEffect(() => {
    if (stampRef.current) stampRef.current.value = String(Date.now());
  }, []);

  const resetAll = () => {
    formRef.current?.reset();
    setStep(0);
    setProjectType("");
    setGoals("");
    setTimeline("");
    setName("");
    setEmail("");
    setPhone("");
    setBudget("");
    setHint("");
  };

  useEffect(() => {
    if (state.status === "success" && prevStatusRef.current !== "success") {
      prevStatusRef.current = "success";
      resetAll();
    } else if (state.status !== "success") {
      prevStatusRef.current = state.status;
    }
  }, [state.status]);

  const canNext = (): string => {
    if (step === 0 && !projectType) return "Pick a project type to continue.";
    if (step === 1 && goals.trim().length < 10) return "Tell me a little more about your goals (at least a sentence).";
    if (step === 2) {
      if (name.trim().length < 2) return "Please add your name.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please add a valid email so I can reply.";
    }
    return "";
  };

  const next = () => {
    const problem = canNext();
    if (problem) {
      setHint(problem);
      return;
    }
    setHint("");
    if (step < 2) {
      setStep(step + 1);
      return;
    }
    // Final step: let the hidden inputs carry the assembled brief.
    try {
      trackEvent("contact_submit", { afterChat: sessionStorage.getItem("cc_chat_open") === "1", wizard: true });
    } catch {}
    formRef.current?.requestSubmit();
  };

  const back = () => {
    setHint("");
    setStep(Math.max(0, step - 1));
  };

  const message = `[${projectType}] ${goals}${timeline ? ` — Timeline: ${timeline}` : ""}`;

  return (
    <form ref={formRef} action={formAction} className="glass" style={{ padding: 32 }}>
      {/* Honeypot: hidden from humans, irresistible to bots. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}>
        <label htmlFor="website">Leave this field empty</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <input ref={stampRef} type="hidden" name="rendered_at" defaultValue="0" />
      {/* Hidden fields — the real form data assembled from the wizard state. */}
      <input type="hidden" name="name" value={name} />
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="phone" value={phone} />
      <input type="hidden" name="investment_range" value={budget} />
      <input type="hidden" name="message" value={message} />

      <div className="wizard-progress" aria-hidden="true">
        {STEPS.map((label, i) => (
          <span
            key={label}
            className={`dot ${i < step ? "done" : i === step ? "active" : ""}`}
            style={{ position: "relative" }}
            title={label}
          />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        {STEPS.map((label, i) => (
          <span
            key={label}
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: i === step ? "var(--accent)" : "var(--muted)",
              transition: "color 0.3s var(--cb)"
            }}
          >
            {label}
          </span>
        ))}
      </div>

      {state.status === "success" ? (
        <div className="wizard-step" style={{ textAlign: "center", padding: "18px 0 6px" }}>
          <div
            style={{
              width: 56,
              height: 56,
              margin: "0 auto 18px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0, 210, 255, 0.12)",
              color: "var(--accent)",
              fontSize: 24
            }}
          >
            <i className="fa-solid fa-check" />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Brief sent 🎉</h3>
          <p style={{ color: "var(--muted)", fontSize: 14.5, lineHeight: 1.7, maxWidth: 380, margin: "0 auto" }}>
            {state.message}
          </p>
        </div>
      ) : (
        <div key={step} className="wizard-step">
          {step === 0 && (
            <>
              <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>What do you need?</div>
              <div className="wizard-types">
                {PROJECT_TYPES.map((t) => (
                  <button
                    type="button"
                    key={t.label}
                    className={`type-card ${projectType === t.label ? "selected" : ""}`}
                    onClick={() => {
                      setProjectType(t.label);
                      setHint("");
                    }}
                  >
                    <i className={t.icon} />
                    <span>
                      {t.label}
                      <small>{t.desc}</small>
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="field">
                <label htmlFor="wiz-goals">Your goals, context &amp; success criteria</label>
                <textarea
                  id="wiz-goals"
                  rows={5}
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  placeholder="e.g. I'm launching a skincare brand in 6 weeks and need a full identity plus a social kit for the launch..."
                />
              </div>
              <div className="field">
                <label htmlFor="wiz-timeline">Timeline (optional)</label>
                <select id="wiz-timeline" value={timeline} onChange={(e) => setTimeline(e.target.value)}>
                  <option value="">Not sure yet</option>
                  {TIMELINES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="field">
                <label htmlFor="wiz-name">Your name</label>
                <input id="wiz-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="contact-row">
                <div className="field">
                  <label htmlFor="wiz-email">Email</label>
                  <input id="wiz-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@brand.com" />
                </div>
                <div className="field">
                  <label htmlFor="wiz-phone">Phone / WhatsApp</label>
                  <input id="wiz-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
                </div>
              </div>
              <div className="field">
                <label htmlFor="wiz-budget">Investment range (optional)</label>
                <select id="wiz-budget" value={budget} onChange={(e) => setBudget(e.target.value)}>
                  <option value="">I&apos;ll discuss this later</option>
                  {RANGES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {hint && (
            <p role="status" style={{ color: "#ff9b9b", fontSize: 13, marginTop: 12 }}>
              <i className="fa-solid fa-circle-info" style={{ marginRight: 6 }} />
              {hint}
            </p>
          )}

          <div className="wizard-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={back} disabled={step === 0 || pending}>
              <i className="fa-solid fa-arrow-left" /> Back
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={next} disabled={pending} style={{ minWidth: 130, justifyContent: "center" }}>
              {pending ? "Sending..." : step === 2 ? "Send Brief" : "Continue"}
              {!pending && <i className={`fa-solid ${step === 2 ? "fa-paper-plane" : "fa-arrow-right"}`} style={{ marginLeft: 8 }} />}
            </button>
          </div>

          {state.status === "error" && state.message && (
            <p role="status" style={{ marginTop: 14, color: "#ff8080", fontSize: 14 }}>{state.message}</p>
          )}
        </div>
      )}
    </form>
  );
}
