// Shared site-setting defaults. Kept in a dependency-free module so both the
// server data layer (lib/data.ts) and the admin settings page (a client
// component) can import it without pulling server-only code into the bundle.
export const DEFAULT_SETTINGS: Record<string, string> = {
  brand_name: "ggraphixc",
  designer_name: "Godson Otobo",
  role_title: "Graphics Designer",
  hero_badge_tagline: "Brand & Visual Systems",
  pricing_note:
    "Brand identity $1k–$5k+, social kits $1k–$3k, full campaigns $5k+ — exact quotes after a brief.",
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
  google_api_key: "",
  welcome_email_subject: "Welcome to ggraphixc — you're in! 🎉",
  welcome_email_headline: "You're in — welcome to the design notes 👋",
  welcome_email_body:
    "Thanks for subscribing. Once a month you'll get one short email — brand systems, design craft, and the kind of before/after breakdowns that usually stay behind the scenes. No spam, ever.\n\nWhile you wait for the first issue, you can see how these ideas show up in real work on the projects page."
};

export const SETTING_FIELD_LABELS: [key: string, label: string, hint: string][] = [
  ["brand_name", "Brand name", "Shown in the header, footer, and page titles."],
  ["designer_name", "Your name", "Used in page titles, the About section, and the footer credit."],
  ["role_title", "Role title", "e.g. Graphics Designer — shown in the hero badge."],
  ["hero_badge_tagline", "Hero badge tagline", "e.g. Brand & Visual Systems — the small text after the role in the hero badge. Leave empty to hide it."],
  ["pricing_note", "Pricing note (concierge)", "The AI concierge quotes this when visitors ask about cost. Edit it in plain text — e.g. 'Brand identity from $1,000, social kits from $800, exact quote after a brief.'"],
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
  ],
  ["welcome_email_subject", "Welcome email — subject line", "Shown as the subject of the welcome email sent after a new signup."],
  [
    "welcome_email_headline",
    "Welcome email — headline",
    "The big heading at the top of the welcome email body."
  ],
  [
    "welcome_email_body",
    "Welcome email — body",
    "Plain text paragraphs; leave a blank line between paragraphs. The sign-off, projects link, and unsubscribe link are added automatically."
  ]
];
