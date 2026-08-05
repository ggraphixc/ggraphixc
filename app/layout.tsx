import type { Metadata } from "next";
import "./globals.css";
import SiteChrome from "@/components/SiteChrome";
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
      where: {
        href_matches: "/*",
        not: { href_matches: "/admin*" }
      },
      eagerness: "moderate"
    }
  ]
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
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
        <SiteChrome>{children}</SiteChrome>
        <Analytics />
      </body>
    </html>
  );
}
