"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: "fa-gauge" },
  { href: "/admin/projects", label: "Projects", icon: "fa-images" },
  { href: "/admin/blog", label: "Blog", icon: "fa-pen-nib" },
  { href: "/admin/testimonials", label: "Testimonials", icon: "fa-comment-dots" },
  { href: "/admin/messages", label: "Messages", icon: "fa-envelope" },
  { href: "/admin/newsletter", label: "Newsletter", icon: "fa-bullhorn" },
  { href: "/admin/subscribers", label: "Subscribers", icon: "fa-envelope-open-text" },
  { href: "/admin/clients", label: "Clients", icon: "fa-handshake" },
  { href: "/admin/faqs", label: "FAQs", icon: "fa-circle-question" },
  { href: "/admin/settings", label: "Settings", icon: "fa-gear" }
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="admin-side">
      <div className="brand">
        <span className="dot" /> ggraphixc
      </div>
      <nav className="admin-nav">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={pathname === l.href ? "active" : ""}
          >
            <i className={`fa-solid ${l.icon}`} /> {l.label}
          </Link>
        ))}
      </nav>
      <button className="btn btn-ghost btn-sm admin-logout" onClick={logout}>
        <i className="fa-solid fa-right-from-bracket" /> Logout
      </button>
    </aside>
  );
}
