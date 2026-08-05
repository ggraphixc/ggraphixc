import Reveal from "@/components/Reveal";
import { getFaqs } from "@/lib/data";

export default async function FAQ() {
  const faqs = await getFaqs();

  return (
    <section className="section" id="faq">
      <div className="container" style={{ maxWidth: 900 }}>
        <Reveal>
          <span className="kicker">FAQ</span>
          <h2 className="section-title">Answers buyers usually ask</h2>
        </Reveal>

        <div style={{ marginTop: 36 }}>
          {faqs.map((f) => (
            <Reveal key={f.id}>
              <details className="faq-item">
                <summary>
                  {f.question}
                  <span className="plus">+</span>
                </summary>
                <div className="answer">{f.answer}</div>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
