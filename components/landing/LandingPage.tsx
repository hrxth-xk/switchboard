import Link from "next/link";
import { Braces, Briefcase, FolderKanban, Gauge } from "lucide-react";

const FEATURES = [
  {
    icon: Braces,
    title: "DSA Tracking",
    description: "Spaced-repetition reviews and topic mastery, so nothing you've learned slips through the cracks."
  },
  {
    icon: Briefcase,
    title: "Job Applications",
    description: "Track every application from wishlist to offer, with next steps always visible."
  },
  {
    icon: FolderKanban,
    title: "Projects",
    description: "Ship portfolio work with clear priorities and progress tracked alongside everything else."
  },
  {
    icon: Gauge,
    title: "Daily Progress",
    description: "One dashboard that shows exactly what needs your attention today — and nothing you don't."
  }
] as const;

export function LandingPage() {
  return (
    <div className="landing-shell">
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <Link className="landing-nav-brand" href="/">
            <span className="brand-mark">S</span>
            <span>Switchboard</span>
          </Link>
          <div className="landing-nav-actions">
            <Link className="landing-nav-link" href="/login">
              Log in
            </Link>
            <Link className="button" href="/signup">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-inner">
          <h1 className="landing-hero-title">One place to track everything that gets you your next offer.</h1>
          <p className="landing-hero-subtitle">
            DSA practice, job applications, and portfolio projects — one focused workspace instead of five
            scattered tools.
          </p>
          <div className="landing-hero-actions">
            <Link className="button" href="/signup">
              Get Started
            </Link>
            <Link className="button secondary" href="#features">
              View Features
            </Link>
          </div>
        </div>
      </section>

      <section className="landing-features" id="features">
        <div className="landing-features-grid">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div className="landing-feature-card" key={title}>
              <div className="landing-feature-icon">
                <Icon size={20} />
              </div>
              <h3 className="landing-feature-title">{title}</h3>
              <p className="landing-feature-desc">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        <span>Switchboard</span>
        <Link href="/login">Log in</Link>
      </footer>
    </div>
  );
}
