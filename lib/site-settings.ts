// Shared site-setting defaults. Kept in a dependency-free module so both the
// server data layer (lib/data.ts) and the admin settings page (a client
// component) can import it without pulling server-only code into the bundle.
export const DEFAULT_SETTINGS: Record<string, string> = {
  hero_headline: "I Design Brands, Visuals & Digital Experiences",
  hero_lead:
    "Godson Otobo (ggraphixc) builds brand identities, creative systems, and conversion-ready design for ambitious brands that want to look premium and earn trust.",
  about_text:
    "I'm a graphics designer obsessed with clarity and craft. From first sketch to shipped system, I help brands look intentional, consistent, and impossible to ignore.",
  stats_projects: "120+",
  stats_clients: "60+",
  stats_experience: "6+",
  stats_satisfaction: "98%",
  contact_email: "hello@ggraphixc.com"
};

export const SETTING_FIELD_LABELS: [key: string, label: string, hint: string][] = [
  ["hero_headline", "Hero headline", "The big headline on the homepage."],
  ["hero_lead", "Hero lead", "The supporting paragraph under the headline."],
  ["about_text", "About text", "Short bio shown in the About section."],
  ["stats_projects", "Projects stat", "e.g. 120+"],
  ["stats_clients", "Clients stat", "e.g. 60+"],
  ["stats_experience", "Experience stat", "e.g. 6+"],
  ["stats_satisfaction", "Satisfaction stat", "e.g. 98%"],
  ["contact_email", "Contact email", "Used across the site (footer + contact links)."]
];
