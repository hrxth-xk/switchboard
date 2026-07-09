import type { ReactNode } from "react";
import { SavingSpinner } from "@/components/ui/SavingSpinner";

type ActionButtonContentProps = {
  pending: boolean;
  pendingLabel: string;
  children: ReactNode;
};

export function ActionButtonContent({ pending, pendingLabel, children }: ActionButtonContentProps) {
  return (
    <>
      {pending ? <SavingSpinner /> : null}
      {pending ? pendingLabel : children}
    </>
  );
}
