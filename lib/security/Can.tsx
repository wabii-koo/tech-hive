"use client";

import { PermissionKey, useCan } from "./rbac-context";
import React, { ReactNode } from "react";

type Props = {
  anyOf?: PermissionKey[];
  allOf?: PermissionKey[];
  fallback?: ReactNode;
  children: ReactNode;
};

export function Can({ anyOf, allOf, fallback = null, children }: Props) {
  const allowedAny = anyOf && anyOf.length ? useCan(anyOf) : true;
  const allowedAll =
    allOf && allOf.length
      ? allOf.every((perm) => useCan(perm))
      : true;

  if (allowedAny && allowedAll) return <>{children}</>;
  return <>{fallback}</>;
}
