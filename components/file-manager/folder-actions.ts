// components/file-manager/folder-actions.ts
"use server";

import { getTenantAndUser } from "@/lib/get-tenant-and-user";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function renameFolderAction(folderId: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Folder name is required.");
  }

  const { user, tenant } = await getTenantAndUser();

  const folder = await prisma.folder.findFirst({
    where: {
      id: folderId,
      tenantId: tenant.id,
      createdById: user.id,
    },
  });

  if (!folder) {
    throw new Error("Folder not found or you do not have permission.");
  }

  await prisma.folder.update({
    where: { id: folder.id },
    data: { name: trimmed },
  });

  revalidatePath("/files");
  if (folder.parentId) {
    revalidatePath(`/files/${folder.parentId}`);
  } else {
    revalidatePath(`/files/${folder.id}`);
  }
}

export async function deleteFolderAction(
  folderId: string,
  parentFolderId?: string | null
) {
  const { user, tenant } = await getTenantAndUser();

  const folder = await prisma.folder.findFirst({
    where: {
      id: folderId,
      tenantId: tenant.id,
      createdById: user.id,
    },
  });

  if (!folder) {
    throw new Error("Folder not found or you do not have permission.");
  }

  // NOTE: this deletes only this folder.
  // If you want cascading delete for subfolders/files, we can extend this later.
  await prisma.folder.delete({
    where: { id: folder.id },
  });

  revalidatePath("/files");
  if (parentFolderId) {
    revalidatePath(`/files/${parentFolderId}`);
  }
}
