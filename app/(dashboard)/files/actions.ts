"use server";

import { getCurrentSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type CreateFolderState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function createFolder(
  _prevState: CreateFolderState,
  formData: FormData
): Promise<CreateFolderState> {
  const rawName = formData.get("name");
  const rawTenantId = formData.get("tenantId");

  const name = typeof rawName === "string" ? rawName.trim() : "";
  const tenantId = typeof rawTenantId === "string" ? rawTenantId : "";

  if (!name) {
    return { status: "error", message: "Folder name is required." };
  }

  if (!tenantId) {
    return { status: "error", message: "Missing tenant context." };
  }

  const { user } = await getCurrentSession();

  if (!user || !user.id) {
    return {
      status: "error",
      message: "You must be signed in to create folders.",
    };
  }

  try {
    await prisma.folder.create({
      data: {
        name,
        tenantId,
        createdById: user.id as string,
        // parentId stays null for now (root folder)
      },
    });

    // Refresh /files so when you later render real folders, they appear
    revalidatePath("/files");

    return {
      status: "success",
      message: `Folder "${name}" created successfully.`,
    };
  } catch (error) {
    console.error("createFolder error:", error);
    return {
      status: "error",
      message: "Something went wrong while creating folder.",
    };
  }
}
