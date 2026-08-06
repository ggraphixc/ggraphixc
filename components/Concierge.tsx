"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "bot"; parts: string };

// NOTE: this widget is mounted ONCE site-wide via <ConciergePortal /> in the
// root layout (hidden on /admin). Don't add another <Concierge /> to a page —
// it would render a duplicate chat button.
type RecommendedProject = {
  title: string;
  slug: string;
  result?: string | null;
  image_url?: string | null;
};

export default function Concierge({
  brand = "ggraphixc",
  email = "hello@ggraphixc.com"
}: {
  brand?: string;
  email?: string;
}) {
  const welcome: Msg = {
    role: "bot",
    parts: `Hey! I'm the ${brand} concierge 🤖 Ask me about services, process, timelines, or rough budgets — or just say hi.`
  };
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([welcome]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [related, setRelated] = useState<RecommendedProject[]>([]);
  const [failedImgs, setFailedImgs] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, busy]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    const next: Msg[] = [...messages, { role: "user", parts: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    setRelated([]);
    try {
      const res = await fetch("/api/ai/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next })
      });
      const json = await res.json().catch(() => ({}));
      setRelated(Array.isArray(json.projects) ? json.projects : []);
      setMessages((m) => [
        ...m,
        {
          role: "bot",
          parts:
            json.reply ||
            (json.error
              ? "That's too many messages at once — give me a second 🙂"
              : `Hmm, I couldn't reach the server. Email ${email} instead!`)
        }
      ]);
    } catch {
      setRelated([]);
      setMessages((m) => [
        ...m,
        { role: "bot", parts: `Network hiccup — try again in a moment, or email ${email}.` }
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {open && (
        <div className="concierge-panel" role="dialog" aria-label="AI project concierge">
          <div className="concierge-head">
            <div className="avatar">{(brand[0] || "G").toUpperCase()}</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14 }}>{brand} concierge</div>
              <div style={{ fontSize: 12, color: "#22c55e", fontWeight: 600 }}>● Online — instant answers</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              style={{
                marginLeft: "auto",
                background: "none",
                border: "none",
                color: "var(--muted)",
                cursor: "pointer",
                fontSize: 16
              }}
            >
              ✕
            </button>
          </div>
          <div className="concierge-msgs" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.role}`}>
                {m.parts}
              </div>
            ))}
            {busy && (
              <div className="msg bot">
                <span className="typing">Thinking</span>
              </div>
            )}
            {related.length > 0 && (
              <div className="concierge-cards">
                <div className="concierge-cards-label">Recommended for you</div>
                {related.map((p) => {
                  if (!p.slug) return null;
                  const imgBroken = p.image_url ? failedImgs[p.image_url] : true;
                  return (
                    <a
                      key={p.slug}
                      className="concierge-card"
                      href={`/projects/${p.slug}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {!imgBroken ? (
                        <img
                          src={p.image_url as string}
                          alt=""
                          loading="lazy"
                          onError={() =>
                            setFailedImgs((f) => ({ ...f, [p.image_url as string]: true }))
                          }
                        />
                      ) : (
                        <span className="card-ph" aria-hidden="true" />
                      )}
                      <span className="card-body">
                        <span className="card-title">{p.title}</span>
                        {p.result && <span className="card-result">{p.result}</span>}
                      </span>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
          <form className="concierge-input" onSubmit={send}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Do you do packaging design?"
              aria-label="Ask the concierge"
            />
            <button type="submit" disabled={busy || !input.trim()} aria-label="Send">
              ➤
            </button>
          </form>
        </div>
      )}

      <button
        className="concierge-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open AI concierge"}
        aria-expanded={open}
      >
        {open ? "✕" : "💬"}
        {!open && <span className="ping" />}
      </button>
    </>
  );
}
