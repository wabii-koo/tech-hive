// app/page.tsx

import {
  ArrowRight,
  Folder,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Gradient background accents */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 top-0 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl dark:bg-emerald-500/15" />
        <div className="absolute bottom-0 right-[-6rem] h-72 w-72 rounded-full bg-sky-500/15 blur-3xl dark:bg-sky-500/10" />
      </div>

      {/* Top bar */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 lg:px-8 lg:py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-400 to-sky-400 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/40">
            H
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">Hive</span>
            <span className="text-[10px] uppercase text-muted-foreground">
              Multi-tenant hub
            </span>
          </div>
        </div>

        <nav className="hidden items-center gap-6 text-xs text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">
            Features
          </a>
          <a href="#workflow" className="hover:text-foreground">
            Workflow
          </a>
          <a href="#about" className="hover:text-foreground">
            About
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/sign-in"
            className="hidden rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent hover:text-accent-foreground md:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3.5 py-1.5 text-xs font-medium text-emerald-950 shadow-md shadow-emerald-500/40 hover:bg-emerald-400"
          >
            Open dashboard
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto flex max-w-6xl flex-col items-center px-4 pb-16 pt-6 lg:flex-row lg:items-stretch lg:gap-10 lg:px-8 lg:pt-10">
        {/* Left column */}
        <div className="flex-1 space-y-5 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-[11px] text-muted-foreground shadow-sm">
            <Sparkles className="h-3 w-3 text-emerald-500" />
            <span className="font-medium text-foreground">
              Central cockpit for your SaaS
            </span>
          </div>

          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Run every tenant, user, and file from{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">
              a single Hive.
            </span>
          </h1>

          <p className="mx-auto max-w-xl text-sm text-muted-foreground lg:mx-0">
            Hive gives you a unified dashboard to manage workspaces, security,
            and storage. Built with modern RBAC, multi-tenancy, and real-time
            insights baked in.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-emerald-950 shadow-lg shadow-emerald-500/40 hover:bg-emerald-400"
            >
              Go to dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-5 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              Sign in to your workspace
            </Link>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Central superadmin can onboard tenants in seconds, with full
            control over roles and permissions.
          </p>
        </div>

        {/* Right column – dashboard preview card */}
        <div className="mt-10 flex flex-1 justify-center lg:mt-0">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card/80 p-4 shadow-xl shadow-emerald-500/20 backdrop-blur">
            <div className="mb-3 flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                Live tenants overview
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-foreground">
                Demo snapshot
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <PreviewRow
                title="Acme Corp"
                subtitle="42 users • Billing: Active"
                pill="Production"
                pillTone="emerald"
              />
              <PreviewRow
                title="Beta Labs"
                subtitle="18 users • Storage: 63% used"
                pill="Sandbox"
                pillTone="sky"
              />
              <PreviewRow
                title="Central Hive"
                subtitle="3 tenants • Error rate 0.2%"
                pill="Control plane"
                pillTone="violet"
              />

              <div className="mt-3 grid gap-2 text-[11px]">
                <FeatureMiniCard
                  icon={<Users className="h-3.5 w-3.5" />}
                  title="RBAC security"
                  body="Fine-grained roles & permissions for every tenant."
                />
                <FeatureMiniCard
                  icon={<Folder className="h-3.5 w-3.5" />}
                  title="Unified files"
                  body="Per-tenant file manager with central policies."
                />
                <FeatureMiniCard
                  icon={<ShieldCheck className="h-3.5 w-3.5" />}
                  title="Central control"
                  body="One superadmin view for the entire platform."
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Simple features strip */}
      <section
        id="features"
        className="border-t border-border bg-card/60 py-8 text-xs"
      >
        <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-6 px-4 lg:px-8">
          <PillFeature
            icon={<Users className="h-3.5 w-3.5" />}
            label="Multi-tenant user management"
          />
          <PillFeature
            icon={<ShieldCheck className="h-3.5 w-3.5" />}
            label="Role-based access control"
          />
          <PillFeature
            icon={<Folder className="h-3.5 w-3.5" />}
            label="Tenant-aware file storage"
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-4 text-center text-[11px] text-muted-foreground">
        © {new Date().getFullYear()} Hive. Crafted for multi-tenant SaaS
        dashboards.
      </footer>
    </main>
  );
}

/* ---------- Small presentational helpers ---------- */

function PreviewRow({
  title,
  subtitle,
  pill,
  pillTone,
}: {
  title: string;
  subtitle: string;
  pill: string;
  pillTone: "emerald" | "sky" | "violet";
}) {
  const pillClasses =
    pillTone === "emerald"
      ? "bg-emerald-500/10 text-emerald-300"
      : pillTone === "sky"
      ? "bg-sky-500/10 text-sky-300"
      : "bg-violet-500/10 text-violet-300";

  return (
    <div className="flex items-center justify-between rounded-2xl bg-muted/70 px-3 py-2">
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-[10px] text-muted-foreground">{subtitle}</p>
      </div>
      <span
        className={`rounded-full px-2 py-0.5 text-[10px] ${pillClasses}`}
      >
        {pill}
      </span>
    </div>
  );
}

function FeatureMiniCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-border bg-background/80 px-3 py-2">
      <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-muted">
        {icon}
      </div>
      <div className="space-y-0.5">
        <p className="text-[11px] font-semibold text-foreground">{title}</p>
        <p className="text-[10px] text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

function PillFeature({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1.5 text-[11px] text-muted-foreground shadow-sm">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted">
        {icon}
      </span>
      <span>{label}</span>
    </div>
  );
}
