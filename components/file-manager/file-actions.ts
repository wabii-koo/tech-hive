// components/file-manager/file-actions.ts
"use server";

import { getTenantAndUser } from "@/lib/get-tenant-and-user";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteFileAction(
  fileId: string,
  folderId?: string | null
) {
  const { user, tenant } = await getTenantAndUser();

  const file = await prisma.file.findFirst({
    where: {
      id: fileId,
      tenantId: tenant.id,
      ownerId: user.id,
    },
  });

  if (!file) {
    throw new Error("File not found or you do not have permission.");
  }

  await prisma.file.delete({
    where: { id: file.id },
  });

  // Refresh root & folder views
  revalidatePath("/files");
  if (folderId) {
    revalidatePath(`/files/${folderId}`);
  }
}
