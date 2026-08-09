import type { Metadata } from "next";
import "./globals.css";
import SiteChrome from "@/components/SiteChrome";
import ConciergePortal from "@/components/ConciergePortal";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Analytics } from "@vercel/analytics/react";
import { getSettings } from "@/lib/data";

// Site identity (brand/name/description) comes from Admin → Settings.
export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const title = `${s.brand_name} — ${s.designer_name} | ${s.role_title}`;
  const description = s.meta_description;
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://ggraphixc.vercel.app";
  return {
    title,
    description,
    metadataBase: new URL(site),
    openGraph: {
      title,
      description,
      type: "website"
    }
  };
}

// Speculation Rules API: browsers pre-render same-origin pages in the background
// so navigation (paired with View Transitions) feels instant. Admin routes are
// excluded — they're auth-protected and not worth pre-rendering.
const speculationRules = {
  prerender: [
    {
      source: "document",
      // `where` accepts exactly ONE predicate — combine conditions with `and`.
      where: {
        and: [{ href_matches: "/*" }, { not: { href_matches: "/admin*" } }]
      },
      eagerness: "moderate"
    }
  ]
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // suppressHydrationWarning: the inline script below intentionally adds the
  // `js` class to <html> before React hydrates (progressive-enhancement toggle);
  // React would otherwise flag it as an attribute mismatch on every load.
  const s = await getSettings();
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://ggraphixc.vercel.app";
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
        />
        {/* Mark the document as JS-enabled before paint so the scroll-reveal
            enhancement can hide content safely; if the observer never fires
            (e.g. a hydration failure), force-show everything after load. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "document.documentElement.classList.add('js');window.addEventListener('load',function(){setTimeout(function(){document.documentElement.classList.add('reveal-fallback')},1500)})"
          }}
        />
        <script type="speculationrules">{JSON.stringify(speculationRules)}</script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: s.designer_name,
              alternateName: s.brand_name,
              jobTitle: s.role_title,
              url: site,
              description: s.meta_description,
              knowsAbout: [
                "Brand Identity",
                "Creative Systems",
                "Product UI",
                "Social & Campaign Design"
              ],
              email: s.contact_email
            })
          }}
        />
      </head>
      <body>
        <SiteChrome header={<Header brand={s.brand_name} logo={s.logo_image} />} footer={<Footer />}>{children}</SiteChrome>
        {/* AI concierge chat — every public page. Hidden inside /admin. */}
        <ConciergePortal
          brand={s.brand_name || "ggraphixc"}
          email={s.contact_email || "hello@ggraphixc.vercel.app"}
        />
        <Analytics />
      </body>
    </html>
  );
}
