import Link from "next/link";
import { ArrowRight } from "lucide-react";

const PRODUCT_LINKS = [
  { href: "#product", label: "Product" },
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#faq", label: "FAQ" }
] as const;

export function LandingFooter() {
  return (
    <footer className="landing-footer">
      <div className="landing-container landing-footer-inner">
        <div className="landing-footer-brand">
          <Link className="landing-nav-brand" href="/">
            <span aria-hidden="true" className="brand-mark">
              S
            </span>
            <span>Switchboard</span>
          </Link>
          <p className="landing-footer-tagline">
            One workspace for DSA practice, applications, and the projects that back them up. Set three numbers,
            log the work, know where you stand.
          </p>
          <Link className="landing-btn landing-btn-ghost landing-btn-sm landing-footer-cta" href="/signup">
            Create your account
            <ArrowRight aria-hidden="true" className="landing-btn-arrow" size={15} />
          </Link>
        </div>

        <nav aria-label="Footer" className="landing-footer-nav">
          <div className="landing-footer-col">
            <p className="landing-footer-heading">Product</p>
            {PRODUCT_LINKS.map((link) => (
              <a className="landing-footer-link" href={link.href} key={link.href}>
                {link.label}
              </a>
            ))}
          </div>

          <div className="landing-footer-col">
            <p className="landing-footer-heading">Account</p>
            <Link className="landing-footer-link" href="/signup">
              Create account
            </Link>
            <Link className="landing-footer-link" href="/login">
              Log in
            </Link>
            <Link className="landing-footer-link" href="/forgot-password">
              Forgot password
            </Link>
          </div>
        </nav>
      </div>

      <div className="landing-container landing-footer-base">
        <span>© {new Date().getFullYear()} Switchboard</span>
        <span>Execution over planning.</span>
      </div>
    </footer>
  );
}
