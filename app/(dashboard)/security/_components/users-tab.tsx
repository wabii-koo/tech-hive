// app/(dashboard)/security/_components/users-tab.tsx

import { RoleScope } from "@prisma/client";
import { UsersTabClient } from "./users-tab-client";
import { getCurrentSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export async function UsersTab() {
  const { user } = await getCurrentSession();

  if (!user?.id) {
    return (
      <div className="rounded-xl border bg-card/60 p-4 text-xs text-muted-foreground">
        You must be signed in to view central users.
      </div>
    );
  }

  // Load current user, all CENTRAL roles, and all users that have at least one central role
  const [dbUser, roles, centralUsers] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id as string },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    }),
    prisma.role.findMany({
      where: { scope: RoleScope.CENTRAL },
      orderBy: { id: "asc" },
    }),
    prisma.user.findMany({
      where: {
        userRoles: {
          some: { tenantId: null }, // users that have at least one central role
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    }),
  ]);

  // Guard: only central_superadmin (tenantId = null) can manage central users
  const isCentralSuperadmin = dbUser?.userRoles.some(
    (ur) => ur.role.key === "central_superadmin" && ur.tenantId === null
  );

  if (!dbUser || !isCentralSuperadmin) {
    return (
      <div className="rounded-xl border bg-card/60 p-4 text-xs text-muted-foreground">
        Only the central superadministrator can manage central users.
      </div>
    );
  }

  // Map roles that can be assigned in the dropdown (central roles EXCLUDING central_superadmin)
  const assignableRoles = roles
    .filter((r) => r.key !== "central_superadmin")
    .map((r) => ({
      id: r.id,
      key: r.key,
      name: r.name,
    }));

  // Map users into a DTO for the client
  const usersForClient = centralUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    createdAt: u.createdAt.toISOString(),
    image: (u as any).image ?? null,
    isActive: (u as any).isActive ?? true,
    userRoles: u.userRoles.map((ur) => ({
      id: ur.id,
      tenantId: ur.tenantId,
      role: {
        key: ur.role.key,
        name: ur.role.name,
        scope: ur.role.scope,
      },
    })),
  }));

  // Simple lookup map for display (not strictly required, but handy)
  const centralRoleMap: Record<number, string> = {};
  roles.forEach((r) => {
    centralRoleMap[r.id] = r.name;
  });

  return (
    <UsersTabClient
      users={usersForClient}
      assignableRoles={assignableRoles}
      centralRoleMap={centralRoleMap}
      currentUserId={dbUser.id}
    />
  );
}
