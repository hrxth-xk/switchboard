import { useCallback, useState } from "react";
import { flushSync } from "react-dom";

export function usePendingAction<T extends string = string>() {
  const [pending, setPending] = useState<T | null>(null);

  const run = useCallback(async (key: T, action: () => Promise<void>) => {
    flushSync(() => setPending(key));
    try {
      await action();
    } finally {
      setPending(null);
    }
  }, []);

  const isPending = useCallback((key: T) => pending === key, [pending]);

  return { pending, run, isPending, isBusy: pending !== null };
}
