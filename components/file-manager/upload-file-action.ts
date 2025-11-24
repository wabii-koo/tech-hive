// components/file-manager/upload-file-action.ts
"use server";

import { getTenantAndUser } from "@/lib/get-tenant-and-user";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Handles file upload, processes the file content, and stores it as a Data URL in the database.
 *
 * @param formData FormData containing the 'file' File object, optional 'baseName', and optional 'folderId'.
 */
export async function uploadFileAction(formData: FormData) {
  // 1. Extract required file and optional data
  const file = formData.get("file");
  const rawBaseName = formData.get("baseName");
  const rawFolderId = formData.get("folderId");

  if (!(file instanceof File)) {
    throw new Error("No file uploaded or file object is invalid.");
  }

  // 2. Authenticate user and resolve tenant
  const { user, tenant } = await getTenantAndUser();

  const originalFileName = file.name;
  const mimeType = file.type || "application/octet-stream";

  // Determine final file name based on optional baseName
  const baseName = typeof rawBaseName === "string" ? rawBaseName.trim() : "";
  const extensionMatch = originalFileName.match(/\.([^.]+)$/);
  const extension = extensionMatch ? `.${extensionMatch[1]}` : "";

  // If baseName is provided, use it, otherwise use the original name
  const finalName = baseName ? `${baseName}${extension}` : originalFileName;

  // 3. Prepare data for storage: Convert File to base64 Data URL
  let fileUrl: string;
  const fileSize = file.size;

  try {
    const buffer = await file.arrayBuffer();
    const base64Content = Buffer.from(buffer).toString("base64");
    fileUrl = `data:${mimeType};base64,${base64Content}`;
  } catch (error) {
    console.error("Failed to process uploaded file:", error);
    throw new Error("Failed to process the file content for storage.");
  }

  // Determine parent folder ID
  const folderId =
    typeof rawFolderId === "string" && rawFolderId.length > 0
      ? rawFolderId
      : null;

  // 4. Create the new file record in the database
  await prisma.file.create({
    data: {
      name: finalName,
      url: fileUrl,
      mimeType,
      size: fileSize,
      ownerId: user.id,
      tenantId: tenant.id,
      folderId,
    },
  });

  // 5. Revalidate paths to update UI:
  // - /files for recents + root view
  // - /files/[folderId] for the folder where file was uploaded
  revalidatePath("/files");
  if (folderId) {
    revalidatePath(`/files/${folderId}`);
  }
}
