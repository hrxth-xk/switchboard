"use client";

import type { CSSProperties } from "react";
import { Toaster } from "sonner";

/* Toasts are absolutely positioned inside the toaster, which is sized by
   --width (sonner defaults to 356px). The card fills this, so widen it here
   rather than on .app-toast — a toast wider than its container renders off
   centre. */
const TOASTER_STYLE = { "--width": "420px" } as CSSProperties;

export function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      style={TOASTER_STYLE}
      gap={10}
      duration={5000}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "app-toast",
          title: "app-toast-title",
          description: "app-toast-description",
          icon: "app-toast-icon",
          content: "app-toast-content",
          success: "app-toast-success",
          error: "app-toast-error",
          actionButton: "app-toast-action"
        }
      }}
    />
  );
}
