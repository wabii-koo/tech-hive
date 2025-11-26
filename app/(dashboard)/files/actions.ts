"use server";

import { getCurrentSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

async function getContext() {
  const { user } = await getCurrentSession();

  if (!user || !user.id) {
    throw new Error("You must be signed in to perform this action.");
  }

  return {
    userId: user.id as string,
  };
}

/* -------------------------------------------------------------------------- */
/*  Create Folder (your existing action)                                       */
/* -------------------------------------------------------------------------- */

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

  const { userId } = await getContext();

  try {
    await prisma.folder.create({
      data: {
        name,
        tenantId,
        createdById: userId,
        // parentId stays null for root; child folders can pass parentId explicitly
      },
    });

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

/* -------------------------------------------------------------------------- */
/*  File favourites / recycle bin                                              */
/* -------------------------------------------------------------------------- */

export async function toggleFavorite(fileId: string) {
  const { userId } = await getContext();

  const file = await prisma.file.findFirst({
    where: {
      id: fileId,
      ownerId: userId,
    },
    select: {
      isFavorite: true,
    },
  });

  if (!file) return;

  await prisma.file.update({
    where: { id: fileId },
    data: { isFavorite: !file.isFavorite },
  });

  revalidatePath("/files");
}

export async function moveToTrash(fileId: string) {
  const { userId } = await getContext();

  await prisma.file.updateMany({
    where: {
      id: fileId,
      ownerId: userId,
      deletedAt: null,
    },
    data: {
      deletedAt: new Date(),
      isFavorite: false,
    },
  });

  revalidatePath("/files");
}

export async function restoreFromTrash(fileId: string) {
  const { userId } = await getContext();

  await prisma.file.updateMany({
    where: {
      id: fileId,
      ownerId: userId,
      deletedAt: { not: null },
    },
    data: {
      deletedAt: null,
    },
  });

  revalidatePath("/files");
}

export async function deleteFilePermanently(fileId: string) {
  const { userId } = await getContext();

  await prisma.file.deleteMany({
    where: {
      id: fileId,
      ownerId: userId,
    },
  });

  revalidatePath("/files");
}
