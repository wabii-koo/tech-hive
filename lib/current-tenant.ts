// lib/current-tenant.ts

import { headers } from "next/headers";
import { prisma } from "./prisma";

const CENTRAL_HOSTS = ["localhost", "127.0.0.1", "central.localhost"];

async function getOrCreateCentralTenant() {
  // Just ensure the central tenant exists – do NOT create domains here
  let central = await prisma.tenant.findUnique({
    where: { slug: "central" },
  });

  if (!central) {
    central = await prisma.tenant.create({
      data: {
        slug: "central",
        name: "Central Admin",
      },
    });
  }

  return central;
}

export async function getCurrentTenant() {
  // Next 16 headers() is async
  const headersList = await headers();

  // Always resolve to a *string* here
  const rawHeader =
    headersList.get("x-forwarded-host") ??
    headersList.get("host") ??
    "localhost";

  // If some proxy sends multiple hosts: "a,b", just take the first
  const firstPart = rawHeader.split(",")[0].trim();

  // Strip port (acme.localhost:3000 -> acme.localhost)
  const hostname = firstPart.split(":")[0].toLowerCase();

  // CENTRAL MODE (dashboard on localhost / central.*)
  if (CENTRAL_HOSTS.includes(hostname)) {
    const central = await getOrCreateCentralTenant();

    return {
      mode: "central" as const,
      tenant: central,
      hostname,
    };
  }

  // TENANT MODE (e.g. acme.localhost)
  const domainRecord = await prisma.tenantDomain.findUnique({
    where: { domain: hostname },
    include: { tenant: true },
  });

  if (!domainRecord) {
    throw new Error(`Unknown tenant for host: ${hostname}`);
  }

  return {
    mode: "tenant" as const,
    tenant: domainRecord.tenant,
    hostname,
  };
}
