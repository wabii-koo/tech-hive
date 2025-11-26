// app/(dashboard)/security/roles-actions.ts
"use server";

import { RoleScope } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type UpsertRoleInput = {
  id: number | null;
  name: string;
  key: string;
  scope: "CENTRAL" | "TENANT";
  permissionIds: number[];
};

/**
 * Create or update a role and sync its permissions via the explicit
 * RolePermission join table.
 */
export async function upsertRoleAction(input: UpsertRoleInput) {
  const { id, name, key, scope, permissionIds } = input;

  // ---- 1) Validate role key uniqueness ----
  const existingKey = await prisma.role.findFirst({
    where: {
      key,
      ...(id ? { NOT: { id } } : {}),
    },
    select: { id: true },
  });

  if (existingKey) {
    const err = new Error("ROLE_KEY_IN_USE");
    (err as any).code = "ROLE_KEY_IN_USE";
    throw err;
  }

  // ---- 2) Basic scope sanity (optional, but nice) ----
  if (scope !== "CENTRAL" && scope !== "TENANT") {
    const err = new Error("INVALID_SCOPE");
    (err as any).code = "INVALID_SCOPE";
    throw err;
  }

  // ---- 3) Transaction: upsert role + sync RolePermission rows ----
  if (id) {
    // UPDATE
    await prisma.$transaction(async (tx) => {
      // update base role fields
      await tx.role.update({
        where: { id },
        data: {
          name,
          key,
          scope: scope as RoleScope,
        },
      });

      // clear existing permissions
      await tx.rolePermission.deleteMany({
        where: { roleId: id },
      });

      // re-create links
      if (permissionIds.length) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({
            roleId: id,
            permissionId,
          })),
        });
      }
    });
  } else {
    // CREATE
    await prisma.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: {
          name,
          key,
          scope: scope as RoleScope,
        },
      });

      if (permissionIds.length) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({
            roleId: role.id,
            permissionId,
          })),
        });
      }
    });
  }
}

/**
 * Delete role; if it is referenced by UserRole, throw ROLE_IN_USE so
 * the client can show the "used by users" toast.
 */
export async function deleteRoleAction(id: number) {
  try {
    await prisma.role.delete({
      where: { id },
    });
  } catch (err: any) {
    // Prisma FK error
    if (err?.code === "P2003") {
      const tagged = new Error("ROLE_IN_USE");
      (tagged as any).code = "ROLE_IN_USE";
      throw tagged;
    }
    throw err;
  }
}
