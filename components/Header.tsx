"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const NAV = [
  { label: "Work", href: "/#work" },
  { label: "Projects", href: "/projects" },
  { label: "Services", href: "/services" },
  { label: "About", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "Reviews", href: "/#reviews" },
  { label: "FAQ", href: "/#faq" }
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`site-header ${scrolled ? "scrolled" : ""}`}>
      <div className="header-shell">
        <Link href="/" className="brand" aria-label="ggraphixc home">
          <span className="dot" />
          ggraphixc
        </Link>

        <nav className="nav-links" aria-label="Primary">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href}>
              {n.label}
            </Link>
          ))}
          <Link href="/#contact" className="btn btn-primary nav-cta">
            Start a Project
          </Link>
        </nav>

        <button
          className="hamburger"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {open && (
        <div className="mobile-nav">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)}>
              {n.label}
            </Link>
          ))}
          <Link href="/#contact" className="btn btn-primary" onClick={() => setOpen(false)}>
            Start a Project
          </Link>
        </div>
      )}
    </header>
  );
}
