// components/file-manager/create-folder-action.ts
"use server";

import { getTenantAndUser } from "@/lib/get-tenant-and-user";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createFolderAction(formData: FormData) {
  const rawName = formData.get("name");
  const name = typeof rawName === "string" ? rawName.trim() : "";

  if (!name) {
    throw new Error("Folder name is required");
  }

  const { user, tenant } = await getTenantAndUser();

  const rawParentId = formData.get("parentId");
  const parentId =
    typeof rawParentId === "string" && rawParentId.length > 0
      ? rawParentId
      : null;

  await prisma.folder.create({
    data: {
      name,
      tenantId: tenant.id,
      createdById: user.id,
      parentId,
    },
  });

  // Revalidate both the root files page and the parent folder's page
  revalidatePath("/files");
  if (parentId) {
    revalidatePath(`/files/${parentId}`);
  }
}
