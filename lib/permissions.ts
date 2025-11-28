// lib/permissions.ts

import { RoleScope } from "@prisma/client";
import { getCurrentSession } from "@/lib/auth-server";
import { getTenantAndUser } from "@/lib/get-tenant-and-user";
import { prisma } from "@/lib/prisma";

export async function getCurrentUserPermissions(): Promise<string[]> {
  const { user } = await getCurrentSession();
  if (!user) return [];

  const { tenant } = await getTenantAndUser();
  const currentTenantId = tenant?.id ?? null;

  // 1) Get all roles for this user (central + tenant)
  const userRoles = await prisma.userRole.findMany({
    where: { userId: user.id },
    include: {
      role: true, // we only need scope + key from Role
    },
  });

  // 2) Keep:
  //    - all CENTRAL roles
  //    - TENANT roles only for the current tenant
  const relevantRoles = userRoles.filter((ur) => {
    const role = ur.role;

    if (role.scope === RoleScope.CENTRAL) {
      return true;
    }

    if (role.scope === RoleScope.TENANT && currentTenantId) {
      return ur.tenantId === currentTenantId;
    }

    return false;
  });

  if (!relevantRoles.length) {
    if (process.env.NODE_ENV !== "production") {
      console.log(
        "[getCurrentUserPermissions] user:",
        user.email,
        "tenant:",
        tenant?.slug ?? "GLOBAL",
        "→ no relevant roles"
      );
    }
    return [];
  }

  // 3) Fetch rolePermission rows for those roles
  const roleIds = relevantRoles.map((ur) => ur.roleId);

  const rolePermissions = await prisma.rolePermission.findMany({
    where: { roleId: { in: roleIds } },
    select: { permissionId: true },
  });

  if (!rolePermissions.length) return [];

  const permissionIds = Array.from(
    new Set(rolePermissions.map((rp) => rp.permissionId))
  );

  // 4) Load the actual permissions and return their keys
  const permissions = await prisma.permission.findMany({
    where: { id: { in: permissionIds } },
    select: { key: true },
  });

  const keys = permissions.map((p) => p.key);

  if (process.env.NODE_ENV !== "production") {
    console.log(
      "[getCurrentUserPermissions] user:",
      user.email,
      "tenant:",
      tenant?.slug ?? "GLOBAL",
      "perms:",
      keys
    );
  }

  return keys;
}
