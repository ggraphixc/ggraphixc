import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import ProjectsBrowser from "@/components/sections/ProjectsBrowser";
import { getProjects, getSettings } from "@/lib/data";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: `Projects — ${s.brand_name}`,
    description: `Selected brand, product, and campaign design work by ${s.designer_name} (${s.brand_name}).`
  };
}

export const revalidate = 300;

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <section className="section" style={{ paddingTop: 160 }}>
      <div className="container">
        <Reveal>
          <div className="section-head">
            <span className="kicker">Selected Work</span>
            <h1 className="section-title">Designs built to earn attention, trust &amp; action</h1>
            <p className="section-lead">
              A filterable archive of brand identities, creative systems, product UI, and campaign work.
            </p>
          </div>
        </Reveal>
        <ProjectsBrowser projects={projects} />
      </div>
    </section>
  );
}
