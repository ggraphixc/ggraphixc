import { getClients } from "@/lib/data";

export default async function Clients() {
  const clients = await getClients();
  const row = [...clients, ...clients];

  return (
    <section className="clients" aria-label="Brands I've worked with">
      <div className="container">
        <div className="clients-head">
          <span className="kicker">Trusted by</span>
          <p>Brands I&apos;ve helped look &amp; feel their best</p>
        </div>
      </div>
      <div className="clients-marquee" aria-hidden="true">
        <div className="clients-track">
          {row.map((c, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={`${c.id}-${i}`} src={c.logo_url ?? ""} alt="" loading="lazy" title={c.name} />
          ))}
        </div>
      </div>
      <div className="clients-static">
        {clients.map((c) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={c.id} src={c.logo_url ?? ""} alt={c.name} loading="lazy" title={c.name} />
        ))}
      </div>
    </section>
  );
}
