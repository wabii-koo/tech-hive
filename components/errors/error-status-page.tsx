// components/error-status-page.tsx

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type ErrorStatusPageProps = {
  statusCode: string;
  title: string;
  description: ReactNode;
  primaryAction: { href: string; label: string };
  secondaryAction?: { href: string; label: string };
  Icon: LucideIcon;
};

export function ErrorStatusPage({
  statusCode,
  title,
  description,
  primaryAction,
  secondaryAction,
  Icon,
}: ErrorStatusPageProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-slate-50">
      {/* Glow blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-10 top-10 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      {/* Card */}
      <section className="relative z-10 flex max-w-md flex-col items-center rounded-3xl border border-white/10 bg-slate-950/70 px-8 py-10 shadow-2xl shadow-emerald-500/10 backdrop-blur-xl">
        {/* Status + icon */}
        <div className="mb-4 flex items-center gap-3">
          <span className="text-4xl font-black tracking-tight text-emerald-400">
            {statusCode}
          </span>
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/40 animate-pulse">
            <Icon className="h-5 w-5" />
          </span>
        </div>

        <h1 className="mb-2 text-xl font-semibold tracking-tight">{title}</h1>

        <p className="mb-5 text-center text-sm text-slate-300">
          {description}
        </p>

        <div className="mb-5 h-px w-full bg-gradient-to-r from-transparent via-slate-600/60 to-transparent" />

        {/* Actions */}
        <div className="flex w-full flex-col gap-2 sm:flex-row">
          <Link
            href={primaryAction.href}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-slate-600 bg-slate-900/70 px-4 py-2 text-xs font-medium text-slate-100 shadow-sm transition hover:border-slate-400 hover:bg-slate-800"
          >
            {primaryAction.label}
          </Link>

          {secondaryAction && (
            <Link
              href={secondaryAction.href}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm transition hover:bg-emerald-400"
            >
              {secondaryAction.label}
            </Link>
          )}
        </div>

        <p className="mt-4 text-[11px] text-slate-400">
          Status code:{" "}
          <span className="font-mono text-emerald-300">{statusCode}</span>
        </p>
      </section>
    </main>
  );
}
