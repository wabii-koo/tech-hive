"use server";

import React from "react";
import { hash } from "bcryptjs";
import { randomUUID } from "crypto";

import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/send-email";
import {
  UserAccountEmail,
  getUserAccountSubject,
  type UserStatus,
  type UserAccountKind,
} from "@/emails/user-account-template";  

type UpsertUserInput = {
  id: string | null;
  name: string;
  email: string;
  password: string | null;
  roleId: number;
};

type ToggleUserActiveInput = {
  userId: string;
  newActive: boolean;
};

type DeleteUserInput = {
  userId: string;
};

const PASSWORD_PROVIDER_ID = "password";

/* ----------------------- validation helpers ----------------------- */

function normalizeAndValidateUser(input: UpsertUserInput) {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password?.trim() ?? "";

  if (!name) throw new Error("USER_NAME_REQUIRED");
  if (!email) throw new Error("USER_EMAIL_REQUIRED");

  const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  if (!emailRegex.test(email)) throw new Error("USER_EMAIL_INVALID");

  // on create, password is required
  if (!input.id && !password) throw new Error("USER_PASSWORD_REQUIRED");

  if (password && password.length < 8) {
    throw new Error("USER_PASSWORD_TOO_SHORT");
  }

  return { name, email, password };
}

/* -------------------------- create / update -------------------------- */

export async function createOrUpdateUserAction(input: UpsertUserInput) {
  const { name, email, password } = normalizeAndValidateUser(input);

  // unique email check
  const existingEmail = await prisma.user.findFirst({
    where: {
      email,
      ...(input.id ? { id: { not: input.id } } : {}),
    },
  });

  if (existingEmail) {
    throw new Error("EMAIL_IN_USE");
  }

  const hashedPassword = password ? await hash(password, 10) : null;

  // role name for email
  const role = await prisma.role.findUnique({
    where: { id: input.roleId },
    select: { name: true },
  });
  const roleName = role?.name ?? "Central User";

  let user;

  if (input.id) {
    // ------- UPDATE -------
    user = await prisma.user.update({
      where: { id: input.id },
      data: {
        name,
        email,
        userRoles: {
          // replace central role
          deleteMany: { tenantId: null },
          create: {
            tenantId: null,
            roleId: input.roleId,
          },
        },
      },
    });

    if (hashedPassword) {
      const existingAccount = await prisma.account.findFirst({
        where: {
          userId: input.id,
          providerId: PASSWORD_PROVIDER_ID,
        },
      });

      if (existingAccount) {
        await prisma.account.update({
          where: { id: existingAccount.id },
          data: {
            password: hashedPassword,
            accountId: email,
          },
        });
      } else {
        await prisma.account.create({
          data: {
            id: randomUUID(),
            accountId: email,
            providerId: PASSWORD_PROVIDER_ID,
            userId: input.id,
            password: hashedPassword,
          },
        });
      }
    }

    const status: UserStatus = user.isActive ? "ACTIVE" : "INACTIVE";

    // ---- email: user updated ----
    await sendEmail({
      to: user.email,
      subject: getUserAccountSubject("updated"),
      react: React.createElement(UserAccountEmail, {
        kind: "updated",
        name: user.name || user.email,
        email: user.email,
        status,
        roleName,
        // only show password in email if the admin actually changed it
        password: hashedPassword ? password || undefined : undefined,
      }),
    });
  } else {
    // ------- CREATE -------
    const userId = randomUUID();

    user = await prisma.user.create({
      data: {
        id: userId,
        name,
        email,
        isActive: true,
        userRoles: {
          create: {
            tenantId: null,
            roleId: input.roleId,
          },
        },
        ...(hashedPassword
          ? {
              accounts: {
                create: {
                  id: randomUUID(),
                  accountId: email,
                  providerId: PASSWORD_PROVIDER_ID,
                  password: hashedPassword,
                },
              },
            }
          : {}),
      },
    });

    const status: UserStatus = user.isActive ? "ACTIVE" : "INACTIVE";

    await sendEmail({
      to: user.email,
      subject: getUserAccountSubject("created"),
      react: React.createElement(UserAccountEmail, {
        kind: "created",
        name: user.name || user.email,
        email: user.email,
        password: password || undefined,
        status,
        roleName,
      }),
    });
  }
}

/* ---------------------------- other actions ---------------------------- */

export async function toggleUserActiveAction(input: ToggleUserActiveInput) {
  const user = await prisma.user.update({
    where: { id: input.userId },
    data: { isActive: input.newActive },
    include: {
      userRoles: {
        where: { tenantId: null },
        include: { role: true },
        take: 1,
      },
    },
  });

  const status: UserStatus = input.newActive ? "ACTIVE" : "INACTIVE";
  const kind: UserAccountKind = input.newActive ? "updated" : "deactivated";
  const roleName = user.userRoles[0]?.role.name;

  await sendEmail({
    to: user.email,
    subject: getUserAccountSubject(kind),
    react: React.createElement(UserAccountEmail, {
      kind,
      name: user.name || user.email,
      email: user.email,
      status,
      roleName: roleName || undefined,
    }),
  });
}

export async function deleteUserAction(input: DeleteUserInput) {
  await prisma.user.delete({
    where: { id: input.userId },
  });
  // no email on delete (easy to add later with the same template)
}
