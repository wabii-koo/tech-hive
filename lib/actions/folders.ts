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

  try {
    await prisma.folder.create({
      data: {
        name: input.name.trim(),
        tenantId: tenant.id,
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
