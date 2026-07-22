"use client";

import { useCallback, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((next: ConfirmOptions) => {
    setOptions(next);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = useCallback((value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOptions(null);
  }, []);

  const confirmDialog = (
    <ConfirmDialog
      cancelLabel={options?.cancelLabel}
      confirmLabel={options?.confirmLabel}
      description={options?.description}
      destructive={options?.destructive}
      onCancel={() => settle(false)}
      onConfirm={() => settle(true)}
      open={options !== null}
      title={options?.title ?? ""}
    />
  );

  return { confirm, confirmDialog };
}
