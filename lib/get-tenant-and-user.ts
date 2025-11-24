// lib/get-tenant-and-user.ts

import { getCurrentSession } from "@/lib/auth-server";
import { getCurrentTenant } from "@/lib/current-tenant";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function getTenantAndUser(redirectTo: string = "/files") {
  const { user } = await getCurrentSession();

  if (!user) {
    redirect(`/sign-in?callbackURL=${redirectTo}`);
  }

  // Tenant logic: current domain or 'central-hive' fallback
  let tenant = await getCurrentTenant();
  if (!tenant?.id) {
    tenant = await prisma.tenant.findFirst({
      where: { slug: "central-hive" },
    });
  }

  if (!tenant?.id) {
    throw new Error(
      "Tenant context is missing. Make sure a 'central-hive' tenant exists."
    );
  }

  return { user, tenant };
}