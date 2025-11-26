// lib/rbac.ts

import { RoleScope } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Get (or create) the central_superadmin role.
 */
export async function getCentralSuperAdminRole() {
  const role = await prisma.role.upsert({
    where: { key: "central_superadmin" },
    update: {},
    create: {
      key: "central_superadmin",
      name: "Central Super Administrator",
      scope: RoleScope.CENTRAL,
    },
  });

  return role;
}

/**
 * Make sure central_superadmin has *all* permissions in the system.
 * Call this after seeding or when you add new permissions.
 */
export async function syncCentralSuperAdminPermissions() {
  const centralRole = await getCentralSuperAdminRole();

  const permissions = await prisma.permission.findMany({
    select: { id: true },
  });

  await prisma.rolePermission.createMany({
    data: permissions.map((p) => ({
      roleId: centralRole.id,
      permissionId: p.id,
    })),
    skipDuplicates: true,
  });

  return { centralRoleId: centralRole.id, count: permissions.length };
}
