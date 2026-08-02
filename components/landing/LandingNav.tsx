"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";
import { EASE_OUT } from "@/lib/motion";

const NAV_LINKS = [
  { href: "#product", label: "Product" },
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#faq", label: "FAQ" }
] as const;

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <header className={`landing-nav${scrolled ? " is-scrolled" : ""}`}>
      <nav className="landing-nav-inner" aria-label="Main">
        <Link className="landing-nav-brand" href="/">
          <span aria-hidden="true" className="brand-mark">
            S
          </span>
          <span>Switchboard</span>
        </Link>

        <div className="landing-nav-links">
          {NAV_LINKS.map((link) => (
            <a className="landing-nav-link" href={link.href} key={link.href}>
              {link.label}
            </a>
          ))}
        </div>

        <div className="landing-nav-actions">
          <Link className="landing-nav-link landing-nav-login" href="/login">
            Log in
          </Link>
          <Link className="landing-btn landing-btn-primary landing-btn-sm" href="/signup">
            Get started
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
          <button
            aria-controls="landing-mobile-menu"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="landing-nav-toggle"
            onClick={() => setMenuOpen((open) => !open)}
            type="button"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      <AnimatePresence initial={false}>
        {menuOpen ? (
          <motion.div
            animate={{ height: "auto", opacity: 1 }}
            className="landing-nav-mobile"
            exit={{ height: 0, opacity: 0 }}
            id="landing-mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: EASE_OUT }}
          >
            <div className="landing-nav-mobile-inner">
              {NAV_LINKS.map((link) => (
                <a
                  className="landing-nav-mobile-link"
                  href={link.href}
                  key={link.href}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <Link className="landing-nav-mobile-link" href="/login" onClick={() => setMenuOpen(false)}>
                Log in
              </Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
