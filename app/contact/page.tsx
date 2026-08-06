import type { Metadata } from "next";
import Contact from "@/components/sections/Contact";
import Concierge from "@/components/Concierge";
import { getSettings } from "@/lib/data";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: `Contact — ${s.brand_name}`,
    description: `Start a project with ${s.designer_name} (${s.brand_name}). Brand, product, and campaign design.`
  };
}

export default async function ContactPage() {
  const settings = await getSettings();
  return (
    <div style={{ paddingTop: 80 }}>
      <Contact
        email={settings.contact_email}
        phone={settings.contact_phone}
        whatsapp={settings.whatsapp_number}
        location={settings.location}
      />
      <Concierge
        brand={settings.brand_name || "ggraphixc"}
        email={settings.contact_email || "hello@ggraphixc.com"}
      />
    </div>
  );
}
