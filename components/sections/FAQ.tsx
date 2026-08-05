import Reveal from "@/components/Reveal";

const FAQS = [
  {
    q: "What design services do you offer?",
    a: "Brand identity, creative systems, product & UI design, social and campaign creative, packaging/print, and art direction — either as one project or ongoing visual partnership."
  },
  {
    q: "Can you help my brand look more premium and consistent?",
    a: "Yes. I audit scattered visuals and rebuild them into a clean identity and reusable system, so every touchpoint feels intentional and trustworthy."
  },
  {
    q: "How long does a brand or design project take?",
    a: "A focused identity system usually takes 2–4 weeks, a full brand + creative system 4–8 weeks, and a product UI build depends on scope and approvals."
  },
  {
    q: "Do you provide source files and full ownership?",
    a: "Always. You keep full ownership of every approved asset, design file, and system I create — delivered in formats your team can actually use."
  },
  {
    q: "Can we work together on an ongoing basis?",
    a: "Yes. Many clients keep me on a monthly retainer for continuous design, so new assets ship fast and stay on-brand without hiring in-house."
  }
];

export default function FAQ() {
  return (
    <section className="section" id="faq">
      <div className="container" style={{ maxWidth: 900 }}>
        <Reveal>
          <span className="kicker">FAQ</span>
          <h2 className="section-title">Answers buyers usually ask</h2>
        </Reveal>

        <div style={{ marginTop: 36 }}>
          {FAQS.map((f) => (
            <Reveal key={f.q}>
              <details className="faq-item">
                <summary>
                  {f.q}
                  <span className="plus">+</span>
                </summary>
                <div className="answer">{f.a}</div>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
