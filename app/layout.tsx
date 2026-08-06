import type { Metadata } from "next";
import "./globals.css";
import SiteChrome from "@/components/SiteChrome";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "ggraphixc — Godson Otobo | Graphics Designer",
  description:
    "Godson Otobo (ggraphixc) builds brand identities, creative systems, and conversion-ready design for ambitious brands.",
  metadataBase: new URL("https://ggraphixc.com"),
  openGraph: {
    title: "ggraphixc — Godson Otobo | Graphics Designer",
    description:
      "Brand identity, creative systems, and conversion-ready design by Godson Otobo.",
    type: "website"
  }
};

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // suppressHydrationWarning: the inline script below intentionally adds the
  // `js` class to <html> before React hydrates (progressive-enhancement toggle);
  // React would otherwise flag it as an attribute mismatch on every load.
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
              name: "Godson Otobo",
              alternateName: "ggraphixc",
              jobTitle: "Graphics Designer",
              url: "https://ggraphixc.com",
              description:
                "Brand identity, creative systems, and conversion-ready design by Godson Otobo (ggraphixc).",
              knowsAbout: [
                "Brand Identity",
                "Creative Systems",
                "Product UI",
                "Social & Campaign Design"
              ],
              email: "hello@ggraphixc.com"
            })
          }}
        />
      </head>
      <body>
        <SiteChrome header={<Header />} footer={<Footer />}>{children}</SiteChrome>
        <Analytics />
      </body>
    </html>
  );
}
