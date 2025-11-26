// app/(dashboard)/security/page.tsx

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Breadcrumb } from "@/components/breadcrumb";
import { PermissionsTab } from "./_components/permissions-tab";
import { RoleScope } from "@prisma/client";
import { RolesTab } from "./_components/roles-tab";
import { UsersTab } from "./_components/users-tab";
import { prisma } from "@/lib/prisma";

// Shape of the query string ?tab=...
type SearchParams = {
  tab?: "users" | "roles" | "permissions";
};

// ⚠️ In Next 16, `searchParams` is a *Promise* on server components.
// So we type it as Promise<SearchParams> and `await` it inside.
export default async function SecurityPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // ✅ unwrap the promise first (this fixes the runtime error)
  const resolvedSearchParams = await searchParams;

  // Default tab is "users" – only accept our three allowed values
  const tab: "users" | "roles" | "permissions" =
    resolvedSearchParams?.tab === "roles" ||
    resolvedSearchParams?.tab === "permissions"
      ? resolvedSearchParams.tab
      : "users";

  // Load roles + permissions once for the Roles/Permissions tabs
  const [rolesRaw, permissions] = await Promise.all([
    prisma.role.findMany({
      where: {
        scope: RoleScope.CENTRAL, // this screen is central-only
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: { id: "asc" },
    }),
    prisma.permission.findMany({
      orderBy: { key: "asc" },
    }),
  ]);

  // Normalize roles so `permissions` is ALWAYS a simple array of Permission objects
  const roles = rolesRaw.map((r) => ({
    id: r.id,
    key: r.key,
    name: r.name,
    scope: r.scope,
    permissions: r.permissions.map((rp) => ({
      id: rp.permission.id,
      key: rp.permission.key,
      name: rp.permission.name,
    })),
  }));

  return (
    <div className="px-4 py-4 lg:px-6 lg:py-6 xl:px-8">
      {/* Page header with breadcrumb (same pattern as Files page) */}
      <div className="mb-5 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Breadcrumb />
        </div>

        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight">
            Security &amp; Access
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage central users, roles and permissions.
          </p>
        </div>
      </div>

      {/* Tabs: Users / Roles / Permissions */}
      {/* defaultValue now uses the resolved `tab` */}
      <Tabs defaultValue={tab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        {/* Central users – server wrapper that does the data fetch and RBAC guard */}
        <TabsContent value="users" className="space-y-4">
          <UsersTab />
        </TabsContent>

        {/* Roles – uses roles + permissions from above */}
        <TabsContent value="roles" className="space-y-4">
          <RolesTab roles={roles} allPermissions={permissions} />
        </TabsContent>

        {/* Permissions – simple CRUD over permissions */}
        <TabsContent value="permissions" className="space-y-4">
          <PermissionsTab permissions={permissions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
