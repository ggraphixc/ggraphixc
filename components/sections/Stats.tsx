import Reveal from "@/components/Reveal";

export default function Stats({
  stats
}: {
  stats: { projects: string; clients: string; experience: string; satisfaction: string };
}) {
  const items = [
    { num: stats.projects, label: "Projects Delivered" },
    { num: stats.clients, label: "Happy Clients" },
    { num: stats.experience, label: "Years of Craft" },
    { num: stats.satisfaction, label: "Client Satisfaction" }
  ];
  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="container">
        <Reveal>
          <div className="stat-grid">
            {items.map((it) => (
              <div className="stat glass" key={it.label} style={{ padding: "28px 26px" }}>
                <div className="num">{it.num}</div>
                <div className="muted" style={{ color: "var(--muted)", fontWeight: 600 }}>
                  {it.label}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
