// app/(dashboard)/security/roles/_components/RolesTab.tsx

import type { Permission, Role } from "@prisma/client";

import React from "react";
import { prisma } from "@/lib/prisma";

type RolesTabProps = {
  // keep this flexible so any existing usage with searchParams still compiles
  searchParams?: Record<string, string | string[] | undefined>;
};

type RoleWithPermissions = Role & {
  permissions: Permission[];
};

async function fetchRolesWithPermissions(): Promise<RoleWithPermissions[]> {
  const [roles, allPermissions, rolePermissions] = await Promise.all([
    prisma.role.findMany({
      orderBy: { id: "asc" },
    }),
    prisma.permission.findMany(),
    prisma.rolePermission.findMany(),
  ]);

  const permissionById = new Map<number, Permission>();
  for (const perm of allPermissions) {
    permissionById.set(perm.id, perm);
  }

  const permissionsByRoleId = new Map<number, Permission[]>();
  for (const rp of rolePermissions) {
    const perm = permissionById.get(rp.permissionId);
    if (!perm) continue;

    if (!permissionsByRoleId.has(rp.roleId)) {
      permissionsByRoleId.set(rp.roleId, []);
    }
    permissionsByRoleId.get(rp.roleId)!.push(perm);
  }

  return roles.map((role) => ({
    ...role,
    permissions: permissionsByRoleId.get(role.id) ?? [],
  }));
}

export default async function RolesTab(_props: RolesTabProps) {
  const roles = await fetchRolesWithPermissions();

  if (!roles.length) {
    return (
      <div className="rounded-2xl border bg-card/95 p-4 text-xs text-muted-foreground">
        No roles have been created yet.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card/95 p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold">Roles</h2>
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b text-[10px] uppercase text-muted-foreground">
            <th className="py-2 pr-4">Role</th>
            <th className="py-2 pr-4">Scope</th>
            <th className="py-2 pr-4">Tenant</th>
            <th className="py-2">Permissions</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <tr key={role.id} className="border-b last:border-0">
              <td className="py-2 pr-4 align-top">
                <div className="font-medium">{role.name}</div>
                <div className="text-[10px] text-muted-foreground">
                  {role.key}
                </div>
              </td>
              <td className="py-2 pr-4 align-top text-[10px]">
                {role.scope}
              </td>
              <td className="py-2 pr-4 align-top text-[10px]">
                {role.tenantId ?? "GLOBAL"}
              </td>
              <td className="py-2 align-top text-[10px]">
                {role.permissions.length
                  ? role.permissions.map((p) => p.name).join(", ")
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
