import type { Metadata } from "next";
import Contact from "@/components/sections/Contact";
import { getSettings } from "@/lib/data";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: `Contact — ${s.brand_name}`,
    description: `Start a project with ${s.designer_name} (${s.brand_name}). Brand, product, and campaign design.`
  };
}

export default async function ContactPage({
  searchParams
}: {
  searchParams: Promise<{ about?: string }>;
}) {
  const sp = await searchParams;
  const settings = await getSettings();
  // Pre-fill the brief with the reason the visitor came (e.g. a “Request
  // access” download button). Next passes the raw (still-encoded) value.
  let about = "";
  if (typeof sp.about === "string" && sp.about) {
    try {
      about = decodeURIComponent(sp.about).slice(0, 200);
    } catch {
      about = sp.about.slice(0, 200);
    }
  }
  return (
    <div style={{ paddingTop: 80 }}>
      <Contact
        email={settings.contact_email}
        phone={settings.contact_phone}
        whatsapp={settings.whatsapp_number}
        location={settings.location}
        wizard
        initialTopic={about || undefined}
      />
    </div>
  );
}
