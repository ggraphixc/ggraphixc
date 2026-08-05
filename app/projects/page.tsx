import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import ProjectsBrowser from "@/components/sections/ProjectsBrowser";
import { getProjects } from "@/lib/data";

export const metadata: Metadata = {
  title: "Projects — ggraphixc",
  description: "Selected brand, product, and campaign design work by Godson Otobo (ggraphixc)."
};

export const revalidate = 300;

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <section className="section" style={{ paddingTop: 160 }}>
      <div className="container">
        <Reveal>
          <span className="kicker">Selected Work</span>
          <h1 className="section-title">Designs built to earn attention, trust & action</h1>
          <p className="section-lead">
            A filterable archive of brand identities, creative systems, product UI, and campaign work.
          </p>
        </Reveal>
        <ProjectsBrowser projects={projects} />
      </div>
    </section>
  );
}
