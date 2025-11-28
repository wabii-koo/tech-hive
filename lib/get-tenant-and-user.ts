// lib/get-tenant-and-user.ts

import { getCurrentSession } from "@/lib/auth-server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function getTenantAndUser(redirectTo: string = "/") {
  // 1) Require an authenticated user
  const { user } = await getCurrentSession();

  if (!user?.id) {
    redirect(`/sign-in?callbackURL=${encodeURIComponent(redirectTo)}`);
  }

  // 2) Resolve host → tenant (Next 16: headers() is async)
  const h = await headers();
  const rawHost = h.get("host") ?? "";
  const host = rawHost.split(":")[0]; // strip port: "localhost:3000" -> "localhost"

  let tenant = null;

  // Multi-tenant subdomain case (acme.localhost, beta.localhost, central.localhost)
  if (host && host !== "localhost" && host !== "127.0.0.1") {
    const tenantDomain = await prisma.tenantDomain.findUnique({
      where: { domain: host },
      include: { tenant: true },
    });

    tenant = tenantDomain?.tenant ?? null;
  }

  // Dev fallback: plain localhost -> central-hive (or first tenant)
  if (!tenant) {
    tenant =
      (await prisma.tenant.findFirst({
        where: { slug: "central-hive" },
      })) ?? (await prisma.tenant.findFirst());
  }

  if (!tenant) {
    throw new Error(
      "No tenant could be resolved. Make sure you ran the seed and have at least one tenant."
    );
  }

  // 3) Load user roles for this tenant
  const userRoles = await prisma.userRole.findMany({
    where: {
      userId: user.id,
      tenantId: tenant.id,
    },
    include: { role: true },
  });

  const isTenantSuperadmin = userRoles.some(
    (ur) => ur.role.key === "tenant_superadmin"
  );

  return {
    user,
    tenant,
    userRoles,
    isTenantSuperadmin,
  };
}
