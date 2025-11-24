// components/ui/sonner.tsx
"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      richColors
      closeButton
      position="top-right"
      toastOptions={{
        className: "border bg-card/95 shadow-lg",
      }}
    />
  );
}
