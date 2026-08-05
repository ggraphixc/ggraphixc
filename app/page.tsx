import Link from "next/link";
import Hero from "@/components/sections/Hero";
import Stats from "@/components/sections/Stats";
import Clients from "@/components/sections/Clients";
import About from "@/components/sections/About";
import Services from "@/components/sections/Services";
import Work from "@/components/sections/Work";
import Testimonials from "@/components/sections/Testimonials";
import FAQ from "@/components/sections/FAQ";
import Contact from "@/components/sections/Contact";
import Reveal from "@/components/Reveal";
import { getProjects, getTestimonials, getSettings, getPublishedBlog } from "@/lib/data";

// ISR: rebuild this page at most every 5 minutes (admin edits purge instantly).
export const revalidate = 300;

export default async function HomePage() {
  const [settings, projects, testimonials, posts] = await Promise.all([
    getSettings(),
    getProjects(),
    getTestimonials(),
    getPublishedBlog()
  ]);

  return (
    <>
      <Hero headline={settings.hero_headline} lead={settings.hero_lead} />
      <Stats
        stats={{
          projects: settings.stats_projects,
          clients: settings.stats_clients,
          experience: settings.stats_experience,
          satisfaction: settings.stats_satisfaction
        }}
      />
      <Clients />
      <About text={settings.about_text} />
      <Services />
      <Work projects={projects} />
      <Testimonials items={testimonials} />

      {posts.length > 0 && (
        <section className="section" id="blog">
          <div className="container">
            <Reveal>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 20 }}>
                <div className="section-head">
                  <span className="kicker">Blog</span>
                  <h2 className="section-title">Notes on design &amp; brand</h2>
                  <p className="section-lead">Short, practical writing on brand systems, visual craft, and process.</p>
                </div>
                <Link href="/blog" className="btn btn-outline btn-sm" style={{ flexShrink: 0 }}>
                  View all posts
                </Link>
              </div>
            </Reveal>
            <div className="work-grid" style={{ marginTop: 36 }}>
              {posts.slice(0, 3).map((p, i) => (
                <Reveal key={p.id} delay={i * 50}>
                  <Link href={`/blog/${p.slug}`} className="work-card" style={{ display: "flex", height: "100%" }}>
                    <div className="thumb">
                      {p.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.cover_url} alt={p.title} loading="lazy" />
                      ) : null}
                      {p.tags && <span className="tag">{p.tags}</span>}
                    </div>
                    <div className="body">
                      <h3 style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.3 }}>{p.title}</h3>
                      {p.excerpt && <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 8 }}>{p.excerpt}</p>}
                      <span className="card-link">
                        Read post <i className="fa-solid fa-arrow-right" />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <FAQ />
      <Contact />
    </>
  );
}
