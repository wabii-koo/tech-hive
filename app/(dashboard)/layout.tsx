// app/(dashboard)/layout.tsx

import { DashboardShell } from "@/components/dashboard-shell";
import type { ReactNode } from "react";
import { getCurrentSession } from "@/lib/auth-server";
import { getCurrentUserPermissions } from "@/lib/permissions";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Dashboard | Hive",
};

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = await getCurrentSession();

  if (!user) {
    redirect("/sign-in?callbackURL=/dashboard");
  }

  const permissions = await getCurrentUserPermissions();

  if (!permissions || permissions.length === 0) {
    if (process.env.NODE_ENV !== "production") {
      console.log(
        "[DashboardLayout] No permissions → redirecting to /access-denied for",
        user.email
      );
    }

    redirect("/access-denied");
  }

  return (
    <DashboardShell
      user={{ name: user.name ?? null, email: user.email }}
      permissions={permissions}
    >
      {children}
    </DashboardShell>
  );
}
