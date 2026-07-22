"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      gap={8}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "app-toast",
          title: "app-toast-title",
          description: "app-toast-description",
          icon: "app-toast-icon",
          content: "app-toast-content",
          success: "app-toast-success",
          error: "app-toast-error"
        }
      }}
    />
  );
}
