"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ViewTransitions from "@/components/ViewTransitions";

/**
 * Wraps site content in the homepage Header/Footer chrome. The admin portal
 * (/admin/*) has its own chrome (AdminNav) and must NOT show the public
 * header/footer, so we skip them on those routes.
 */
export default function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <ViewTransitions>
      <Header />
      <main>{children}</main>
      <Footer />
    </ViewTransitions>
  );
}
