import type { Metadata } from "next";
import SetupPasswordClient from "./setup-password-client";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Set Password",
};

async function getBrandSettings() {
  const h = await headers();
  const host = (h.get("host") || "").toLowerCase();
  const bareHost = host.split(":")[0];

  let tenantId: string | null = null;

  if (bareHost === "localhost") {
    const centralTenant = await prisma.tenant.findUnique({
      where: { slug: "central-hive" },
      select: { id: true },
    });
    tenantId = centralTenant?.id ?? null;
  } else {
    const domain = await prisma.tenantDomain.findFirst({
      where: { domain: bareHost },
      select: { tenantId: true },
    });
    tenantId = domain?.tenantId ?? null;
  }

  const brand = await prisma.brandSettings.findFirst({
    where: { tenantId },
  });

  return brand;
}

type SearchParamsPromise = Promise<{ token?: string | string[] }>;

export default async function SetupPasswordPage({
  searchParams,
}: {
  searchParams: SearchParamsPromise;
}) {
  const brand = await getBrandSettings();

  const resolved = await searchParams;
  const tokenParam = resolved?.token;

  const token =
    typeof tokenParam === "string"
      ? tokenParam
      : Array.isArray(tokenParam)
      ? tokenParam[0] ?? ""
      : "";

  return (
    <SetupPasswordClient
      token={token}
      brand={{
        titleText: brand?.titleText,
        logoLightUrl: brand?.logoLightUrl,
        logoDarkUrl: brand?.logoDarkUrl,
        faviconUrl: brand?.faviconUrl,
      }}
    />
  );
}
