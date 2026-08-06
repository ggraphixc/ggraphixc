// Shared site-setting defaults. Kept in a dependency-free module so both the
// server data layer (lib/data.ts) and the admin settings page (a client
// component) can import it without pulling server-only code into the bundle.
export const DEFAULT_SETTINGS: Record<string, string> = {
  brand_name: "ggraphixc",
  designer_name: "Godson Otobo",
  role_title: "Graphics Designer",
  hero_headline: "I Design Brands, Visuals & Digital Experiences",
  hero_lead:
    "Godson Otobo (ggraphixc) builds brand identities, creative systems, and conversion-ready design for ambitious brands that want to look premium and earn trust.",
  about_text:
    "I'm a graphics designer obsessed with clarity and craft. From first sketch to shipped system, I help brands look intentional, consistent, and impossible to ignore.",
  stats_projects: "120+",
  stats_clients: "60+",
  stats_experience: "6+",
  stats_satisfaction: "98%",
  contact_email: "hello@ggraphixc.com",
  contact_phone: "",
  whatsapp_number: "",
  location: "",
  meta_description:
    "Godson Otobo (ggraphixc) builds brand identities, creative systems, and conversion-ready design for ambitious brands.",
  footer_description:
    "Premium brand identity, creative systems, and conversion-ready design by Godson Otobo.",
  copyright_text: "© 2026 ggraphixc. All rights reserved.",
  footer_credit: "Designed by Godson Otobo",
  social_behance: "https://behance.net",
  social_instagram: "https://instagram.com",
  social_x: "https://x.com",
  social_linkedin: "https://linkedin.com",
  google_api_key: ""
};

export const SETTING_FIELD_LABELS: [key: string, label: string, hint: string][] = [
  ["brand_name", "Brand name", "Shown in the header, footer, and page titles."],
  ["designer_name", "Your name", "Used in page titles, the About section, and the footer credit."],
  ["role_title", "Role title", "e.g. Graphics Designer — shown in the hero badge."],
  ["contact_phone", "Phone number", "Used for the tel: link in the contact section."],
  ["whatsapp_number", "WhatsApp number", "Digits only with country code, e.g. 2348000000000 — enables a wa.me chat button."],
  ["location", "Location", "e.g. Lagos, Nigeria — shown in the contact section."],
  ["meta_description", "Site description (SEO)", "Used in search-engine descriptions."],
  ["footer_description", "Footer description", "Short line under the footer logo."],
  ["copyright_text", "Copyright line", "Shown in the footer bottom bar."],
  ["footer_credit", "Footer credit", "e.g. Designed by ..."],
  ["social_behance", "Behance URL", "Footer icon — leave empty to hide."],
  ["social_instagram", "Instagram URL", "Footer icon — leave empty to hide."],
  ["social_x", "X (Twitter) URL", "Footer icon — leave empty to hide."],
  ["social_linkedin", "LinkedIn URL", "Footer icon — leave empty to hide."],
  ["hero_headline", "Hero headline", "The big headline on the homepage."],
  ["hero_lead", "Hero lead", "The supporting paragraph under the headline."],
  ["about_text", "About text", "Short bio shown in the About section."],
  ["stats_projects", "Projects stat", "e.g. 120+"],
  ["stats_clients", "Clients stat", "e.g. 60+"],
  ["stats_experience", "Experience stat", "e.g. 6+"],
  ["stats_satisfaction", "Satisfaction stat", "e.g. 98%"],
  ["contact_email", "Contact email", "Used across the site (footer + contact links)."],
  [
    "google_api_key",
    "Google AI API key (Gemini)",
    "Powers the AI concierge + case-study drafts. Get one at aistudio.google.com. Stored privately (never shown publicly)."
  ]
];
