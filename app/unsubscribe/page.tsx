import { Suspense } from "react";
import { getSettings } from "@/lib/data";
import { UnsubscribeClient } from "./UnsubscribeClient";

export const metadata = {
  title: "Unsubscribe",
  description: "Unsubscribe from design notes."
};

export default async function UnsubscribePage() {
  const s = await getSettings();
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ color: "var(--muted)" }}>Loading…</p>
        </div>
      }
    >
      <UnsubscribeClient brand={s.brand_name || "ggraphixc"} contactEmail={s.contact_email || "hello@ggraphixc.vercel.app"} />
    </Suspense>
  );
}
