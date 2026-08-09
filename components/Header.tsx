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

export default function Header({ brand = "ggraphixc", logo = "/images/brand/ggraphixc-logo.png" }: { brand?: string; logo?: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Flip the data-theme attribute; the sun/moon icon visibility is pure CSS
  // driven by that attribute, so there's no state to keep in sync (and no
  // hydration mismatch — the inline <head> script already chose the theme).
  const toggleTheme = () => {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {}
  };

  return (
    <header className={`site-header ${scrolled ? "scrolled" : ""}`}>
      <div className="header-shell">
        <Link href="/" className="brand" aria-label={`${brand} home`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt="" className="brand-mark" />
          {brand}
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

        <form className="header-search" action="/search" method="get" role="search">
          <i className="fa-solid fa-magnifying-glass header-search-icon" />
          <input type="search" name="q" placeholder="Search…" aria-label="Search projects and notes" />
        </form>

        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle light / dark mode"
          title="Toggle light / dark mode"
        >
          <i className="fa-solid fa-moon theme-icon-dark" />
          <i className="fa-solid fa-sun theme-icon-light" />
        </button>

        <button
          className={`hamburger ${open ? "open" : ""}`}
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
        <div id="mobile-nav" className="mobile-nav">
          <form action="/search" method="get" className="header-search" role="search">
            <i className="fa-solid fa-magnifying-glass header-search-icon" />
            <input type="search" name="q" placeholder="Search projects & notes…" aria-label="Search projects and notes" />
          </form>
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
