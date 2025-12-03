// lib/actions/folders.ts
"use server";

import { getCurrentSession } from "@/lib/auth-server";
import { getCurrentTenant } from "@/lib/current-tenant";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createFolderAction(input: { name: string }) {
  const { user } = await getCurrentSession();

  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  const tenant = await getCurrentTenant();
  let tenantId: string | undefined;

  // ✅ FIX: Check the mode. "central" mode object does NOT have an ID.
  if (tenant.mode === "tenant") {
    tenantId = tenant.id;
  } else {
    // If we are in central/root mode, resolve the ID of the 'Central Hive' tenant explicitly.
    const central = await prisma.tenant.findUnique({
      where: { slug: "central-hive" },
    });
    tenantId = central?.id;
  }

  if (!tenantId) {
    return { ok: false, error: "Tenant context is missing or invalid." };
  }

  try {
    await prisma.folder.create({
      data: {
        name: input.name.trim(),
        tenantId: tenantId,
        createdById: user.id,
      },
    });

    // refresh /files listing
    revalidatePath("/files");

    return { ok: true };
  } catch (error) {
    console.error("[createFolderAction]", error);
    return { ok: false, error: "Failed to create folder." };
  }
}