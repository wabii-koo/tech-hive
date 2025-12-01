// app/(dashboard)/files/layout.tsx

import { DashboardShell } from "@/components/dashboard-shell";
import { FileManagerEventListener } from "@/components/file-manager/file-manager-event-listener";
import type { Metadata } from "next";
import { PermissionsProvider } from "@/components/providers/permissions-provider";
import type { ReactNode } from "react";
import { getCurrentSession } from "@/lib/auth-server";
import { getCurrentUserPermissions } from "@/lib/permissions";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

// 👈 add this

export const metadata: Metadata = {
  title: "File Manager",
};

export default function FilesLayout({ children }: { children: ReactNode }) {
  // parent (dashboard)/layout already has DashboardShell
  return <>{children}</>;
}
