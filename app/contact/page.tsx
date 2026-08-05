import type { Metadata } from "next";
import Contact from "@/components/sections/Contact";
import Concierge from "@/components/Concierge";

export const metadata: Metadata = {
  title: "Contact — ggraphixc",
  description: "Start a project with Godson Otobo (ggraphixc). Brand, product, and campaign design."
};

export default function ContactPage() {
  return (
    <div style={{ paddingTop: 80 }}>
      <Contact />
      <Concierge />
    </div>
  );
}
