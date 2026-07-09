import Link from "next/link";
import type { ActionCardsData } from "@/lib/action-dashboard";

type ActionCardsGridProps = {
  cards: ActionCardsData;
};

const CARD_CONFIG = [
  {
    key: "activity" as const,
    title: "Activity",
    subtitle: "Everything you changed today",
    href: "/dashboard/activity"
  },
  {
    key: "dsa" as const,
    title: "DSA",
    subtitle: "Problems and spaced repetition",
    href: "/dashboard/dsa"
  },
  {
    key: "applications" as const,
    title: "Applications",
    subtitle: "Track your job search",
    href: "/dashboard/applications"
  },
  {
    key: "projects" as const,
    title: "Projects",
    subtitle: "What you're building next",
    href: "/dashboard/projects"
  }
];

export function ActionCardsGrid({ cards }: ActionCardsGridProps) {
  return (
    <section className="action-cards-grid" aria-label="Today's actions">
      {CARD_CONFIG.map((card) => (
        <Link className="action-card" href={card.href} key={card.key} prefetch={false}>
          <p className="action-card-title">{card.title}</p>
          <p className="action-card-subtitle">{card.subtitle}</p>
          <p className={`action-card-metric tone-${cards[card.key].tone}`}>{cards[card.key].metric}</p>
        </Link>
      ))}
    </section>
  );
}
