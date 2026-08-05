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
      <button className="btn btn-ghost btn-sm" style={{ width: "100%", marginTop: 16, justifyContent: "center" }} onClick={logout}>
        <i className="fa-solid fa-right-from-bracket" /> Logout
      </button>
    </aside>
  );
}
