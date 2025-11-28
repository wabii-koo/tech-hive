// app/(auth)/layout.tsx  or  src/app/(auth)/layout.tsx

import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Themed gradient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="
            absolute inset-0
            bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_60%),radial-gradient(circle_at_bottom,_rgba(129,140,248,0.20),_transparent_55%)]
            dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_60%),radial-gradient(circle_at_bottom,_rgba(15,23,42,0.9),_transparent_55%)]
          "
        />
      </div>

      <div className="flex min-h-screen items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Mini brand header */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-card shadow-sm ring-1 ring-border">
              <span className="text-lg font-semibold tracking-tight">H</span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Hive Admin
              </p>
              <p className="text-sm text-muted-foreground">
                Secure, multi-tenant workspace access
              </p>
            </div>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
