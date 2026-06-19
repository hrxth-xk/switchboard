import { Panel } from "@/components/dashboard/shared";

type PagePlaceholderProps = {
  title: string;
  description: string;
};

export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <Panel title={title} kicker={description}>
      <p className="item-meta">Full functionality for this section is coming in Phase 1.</p>
    </Panel>
  );
}
