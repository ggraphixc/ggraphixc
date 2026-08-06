"use client";

import { usePathname } from "next/navigation";
import Concierge from "@/components/Concierge";

/**
 * Site-wide concierge mount. Rendered once from the server layout so the chat
 * widget (bottom-right 💬) appears on every public page. The admin portal is
 * the owner's private space — the visitor chat is hidden there, matching how
 * SiteChrome hides the public header/footer on /admin routes.
 */
export default function ConciergePortal({
  brand,
  email
}: {
  brand: string;
  email: string;
}) {
  const pathname = usePathname();
  // Fail closed: also skip if pathname isn't available yet (first client render).
  if (!pathname || pathname.startsWith("/admin")) return null;
  return <Concierge brand={brand} email={email} />;
}
