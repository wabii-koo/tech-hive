// lib/security/rbac-context.tsx
"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

type RbacContextValue = {
  permissions: string[];
  has: (perm: string) => boolean;
  canAny: (perms: string[] | string) => boolean;
  canAll: (perms: string[] | string) => boolean;
};

const RbacContext = createContext<RbacContextValue | null>(null);

export function RbacProvider({
  permissions,
  children,
}: {
  permissions: string[];
  children: ReactNode;
}) {
  const value = useMemo<RbacContextValue>(() => {
    const set = new Set(permissions ?? []);

    const normalize = (ps: string | string[]) =>
      Array.isArray(ps) ? ps : [ps];

    const has = (p: string) => set.has(p);
    const canAny = (ps: string[] | string) =>
      normalize(ps).some((p) => set.has(p));
    const canAll = (ps: string[] | string) =>
      normalize(ps).every((p) => set.has(p));

    const ctxValue: RbacContextValue = {
      permissions: [...set],
      has,
      canAny,
      canAll,
    };

    if (process.env.NODE_ENV !== "production") {
      // Shows once per render tree; handy to confirm what’s coming in
      console.debug("[RBAC] permissions:", ctxValue.permissions);
    }

    return ctxValue;
  }, [permissions]);

  return (
    <RbacContext.Provider value={value}>{children}</RbacContext.Provider>
  );
}

export function useRbac() {
  const ctx = useContext(RbacContext);
  if (!ctx) throw new Error("useRbac must be used within <RbacProvider>");
  return ctx;
}

// Ergonomic hook
export function useCan() {
  const { has, canAny, canAll, permissions } = useRbac();

  return {
    permissions, // useful for debugging in components
    can: has,
    canAny,
    canAll,
  };
}
