import type { MetadataRoute } from "next";
import { getProjects, getPublishedBlog } from "@/lib/data";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://ggraphixc.com";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, posts] = await Promise.all([getProjects(), getPublishedBlog()]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/projects`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/services`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/about`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/blog`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/contact`, changeFrequency: "yearly", priority: 0.6 }
  ];

  const projectRoutes: MetadataRoute.Sitemap = projects.map((p) => ({
    url: `${BASE}/projects/${p.slug}`,
    lastModified: p.created_at,
    changeFrequency: "monthly",
    priority: 0.7
  }));

  const blogRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${BASE}/blog/${p.slug}`,
    lastModified: p.created_at,
    changeFrequency: "monthly",
    priority: 0.6
  }));

  return [...staticRoutes, ...projectRoutes, ...blogRoutes];
}
