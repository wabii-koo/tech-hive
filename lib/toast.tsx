// lib/toast.tsx
"use client";

import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

import type { ReactNode } from "react";
import { toast as sonnerToast } from "sonner";

export type ToastVariant = "success" | "error" | "warning" | "info";

const iconMap: Record<ToastVariant, ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  error: <XCircle className="h-4 w-4 text-red-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  info: <Info className="h-4 w-4 text-blue-500" />,
};

export function showToast(opts: {
  title: string;
  description?: string;
  variant?: ToastVariant;
}) {
  const { title, description, variant = "info" } = opts;

  sonnerToast.custom(
    () => (
      <div className="flex items-start gap-3 rounded-xl border bg-background px-4 py-3 text-sm shadow-lg">
        <div className="mt-0.5">{iconMap[variant]}</div>
        <div className="flex-1">
          <p className="font-semibold">{title}</p>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>
    ),
    {
      duration: 3500,
      position: "top-right",
    }
  );
}
