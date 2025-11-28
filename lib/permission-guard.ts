// lib/permission-guard.ts

import { getCurrentUserPermissions } from "@/lib/permissions";
import { redirect } from "next/navigation";

/**
 * Require that the current user has at least ONE of the given permissions.
 * If not, redirect to /access-denied.
 */
export async function requireAnyPermission(
  permissions: string | string[]
) {
  const userPerms = await getCurrentUserPermissions();
  const needed = Array.isArray(permissions) ? permissions : [permissions];

  const hasAny = needed.some((p) => userPerms.includes(p));

  if (!hasAny) {
    redirect("/access-denied");
  }

  return userPerms; // handy if you want them in the page
}
