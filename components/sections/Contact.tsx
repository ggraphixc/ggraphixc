"use client";

import { useActionState, useEffect, useRef } from "react";
import { submitInquiry, type ContactState } from "@/app/actions/contact";

const RANGES = ["< $1k", "$1k - $5k", "$5k - $15k", "$15k+"];

const initial: ContactState = { status: "idle", message: "" };

export default function Contact({
  email = "hello@ggraphixc.com",
  phone = "",
  whatsapp = "",
  location = ""
}: {
  email?: string;
  phone?: string;
  whatsapp?: string;
  location?: string;
}) {
  const [state, formAction, pending] = useActionState(submitInquiry, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state.status]);

  return (
    <section className="section" id="contact">
      <div className="container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.1fr)",
            gap: 50,
            alignItems: "start"
          }}
          className="contact-grid"
        >
          <div>
            <span className="kicker">Start a Project</span>
            <h2 className="section-title">Let&apos;s build your next advantage</h2>
            <p className="section-lead">
              Tell me where your brand is now and where you want it to go. I&apos;ll reply within 24 hours with a clear
              plan.
            </p>
            <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
              <a href={`mailto:${email}`} className="btn btn-outline" style={{ justifyContent: "flex-start" }}>
                <i className="fa-solid fa-envelope" /> {email}
              </a>
              {(whatsapp || phone) && (
                <a
                  href={whatsapp ? `https://wa.me/${whatsapp}` : `tel:${phone}`}
                  className="btn btn-ghost"
                  style={{ justifyContent: "flex-start" }}
                  target={whatsapp ? "_blank" : undefined}
                  rel={whatsapp ? "noreferrer" : undefined}
                >
                  <i className={whatsapp ? "fa-brands fa-whatsapp" : "fa-solid fa-phone"} />
                  {whatsapp ? (phone ? `WhatsApp · ${phone}` : "Chat on WhatsApp") : phone}
                </a>
              )}
              {location && (
                <span style={{ color: "var(--muted)", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <i className="fa-solid fa-location-dot" style={{ color: "var(--accent)" }} /> {location}
                </span>
              )}
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginTop: 22,
                padding: 18,
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                background: "rgba(255,255,255,0.02)"
              }}
            >
              <span style={{ color: "var(--muted)", fontSize: 13, fontWeight: 600 }}>What happens next:</span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>
                <i className="fa-solid fa-check" style={{ color: "var(--accent)", marginRight: 6 }} />Reply in 24h
              </span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>
                <i className="fa-solid fa-check" style={{ color: "var(--accent)", marginRight: 6 }} />Free kickoff call
              </span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>
                <i className="fa-solid fa-check" style={{ color: "var(--accent)", marginRight: 6 }} />Clear quote &amp; timeline
              </span>
            </div>
          </div>

          <form ref={formRef} action={formAction} className="glass" style={{ padding: 32 }}>
            <div className="field">
              <label htmlFor="name">Full Name</label>
              <input id="name" name="name" required placeholder="Godson Otobo" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="contact-row">
              <div className="field">
                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" required placeholder="you@brand.com" />
              </div>
              <div className="field">
                <label htmlFor="phone">Phone / WhatsApp</label>
                <input id="phone" name="phone" placeholder="+234 ..." />
              </div>
            </div>
            <div className="field">
              <label htmlFor="range">Investment Range</label>
              <select id="range" name="investment_range" defaultValue="">
                <option value="" disabled>
                  Select a range
                </option>
                {RANGES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="message">Project goals, timeline & success criteria</label>
              <textarea id="message" name="message" required placeholder="I need a brand identity and social kit for a launch in 4 weeks..." />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={pending}>
              {pending ? "Sending..." : "Send Project Brief"}
            </button>
            {state.message && (
              <p
                role="status"
                style={{ marginTop: 14, color: state.status === "error" ? "#ff8080" : "var(--accent)", fontSize: 14 }}
              >
                {state.message}
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
