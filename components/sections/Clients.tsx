const CLIENTS = [
  { src: "/images/clients/gleamify-1.png", name: "Gleamify" },
  { src: "/images/clients/thrive.jpg", name: "Thrive" },
  { src: "/images/clients/gelt.jpg", name: "Gelt Token" },
  { src: "/images/clients/mr-clin.jpg", name: "Mr. Clin" },
  { src: "/images/clients/azax.jpg", name: "Azax" },
  { src: "/images/clients/thrive-token.jpg", name: "Thrive Token" }
];

export default function Clients() {
  const row = [...CLIENTS, ...CLIENTS];
  return (
    <section className="clients" aria-label="Brands I've worked with">
      <div className="container">
        <div className="clients-head">
          <span className="kicker">Trusted by</span>
          <p>Brands I&apos;ve helped look &amp; feel their best</p>
        </div>
      </div>
      <div className="clients-marquee">
        <div className="clients-track">
          {row.map((c, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={`${c.name}-${i}`} src={c.src} alt={c.name} loading="lazy" title={c.name} />
          ))}
        </div>
      </div>
    </section>
  );
}
