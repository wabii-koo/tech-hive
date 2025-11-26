"use server";

import { prisma } from "@/lib/prisma";

type UpsertPermissionInput = {
  id: number | null;
  key: string;
  name: string;
};

function validatePermission(input: UpsertPermissionInput) {
  const key = input.key.trim();
  const name = input.name.trim();

  if (!name) throw new Error("PERMISSION_NAME_REQUIRED");
  if (!key) throw new Error("PERMISSION_KEY_REQUIRED");
  if (!/^[a-z0-9_]+$/.test(key)) throw new Error("PERMISSION_KEY_INVALID");

  return { key, name };
}

export async function upsertPermissionAction(input: UpsertPermissionInput) {
  const { key, name } = validatePermission(input);

  // unique key
  const existing = await prisma.permission.findFirst({
    where: {
      key,
      ...(input.id ? { id: { not: input.id } } : {}),
    },
  });

  if (existing) {
    throw new Error("PERMISSION_KEY_IN_USE");
  }

  if (input.id) {
    await prisma.permission.update({
      where: { id: input.id },
      data: { key, name },
    });
  } else {
    await prisma.permission.create({
      data: { key, name },
    });
  }
}

export async function deletePermissionAction(id: number) {
  // do NOT delete if used by any role
  const usedInRoles = await prisma.role.count({
    where: { permissions: { some: { id } } },
  });

  if (usedInRoles > 0) {
    throw new Error("PERMISSION_IN_USE");
  }

  await prisma.permission.delete({ where: { id } });
}
