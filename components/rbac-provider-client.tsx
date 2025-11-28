"use client";

import {
  PermissionKey,
  RbacProvider,
  RoleKey,
} from "@/lib/security/rbac-context";

import { ReactNode } from "react";

type Props = {
  userId: string;
  tenantId: string | null;
  roleKeys?: RoleKey[];
  permissionKeys: PermissionKey[];
  children: ReactNode;
};

export function RbacProviderClient({
  userId,
  tenantId,
  roleKeys = [],
  permissionKeys,
  children,
}: Props) {
  return (
    <RbacProvider
      value={{
        userId,
        tenantId,
        roleKeys,
        permissionKeys,
      }}
    >
      {children}
    </RbacProvider>
  );
}
