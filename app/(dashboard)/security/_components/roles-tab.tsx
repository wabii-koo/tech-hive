"use client";

import * as React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteRoleAction, upsertRoleAction } from "../roles-actions";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import type { Permission } from "@prisma/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// DTOs from the server page
type PermissionDto = {
  id: number;
  key: string;
  name: string;
};

type RoleDto = {
  id: number;
  key: string;
  name: string;
  scope: "CENTRAL" | "TENANT";
  permissions: PermissionDto[];
};

const PROTECTED_ROLE_KEYS = ["central_superadmin", "tenant_superadmin"];

type RoleFormState = {
  id: number | null;
  name: string;
  key: string;
  scope: "CENTRAL" | "TENANT";
  permissionIds: number[];
};

const emptyForm: RoleFormState = {
  id: null,
  name: "",
  key: "",
  scope: "CENTRAL",
  permissionIds: [],
};

export function RolesTab({
  roles,
  allPermissions,
}: {
  roles: RoleDto[];
  allPermissions: Permission[];
}) {
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [form, setForm] = React.useState<RoleFormState>(emptyForm);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const isProtected = (key: string) => PROTECTED_ROLE_KEYS.includes(key);

  function openCreateModal() {
    setError(null);
    setForm({
      ...emptyForm,
      scope: "CENTRAL",
    });
    setIsModalOpen(true);
  }

  function openEditModal(role: RoleDto) {
    setError(null);
    setForm({
      id: role.id,
      name: role.name,
      key: role.key,
      scope: role.scope,
      permissionIds: role.permissions.map((p) => p.id),
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isPending) return;
    setIsModalOpen(false);
  }

  function updateForm<K extends keyof RoleFormState>(key: K, value: RoleFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function togglePermission(id: number) {
    setForm((prev) => {
      const exists = prev.permissionIds.includes(id);
      return {
        ...prev,
        permissionIds: exists
          ? prev.permissionIds.filter((x) => x !== id)
          : [...prev.permissionIds, id],
      };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.key.trim()) {
      setError("Name and key are required.");
      return;
    }

    const scopeToSend =
      form.id != null ? form.scope : ("CENTRAL" as "CENTRAL" | "TENANT");

    startTransition(async () => {
      try {
        await upsertRoleAction({
          id: form.id,
          name: form.name.trim(),
          key: form.key.trim(),
          scope: scopeToSend,
          permissionIds: form.permissionIds,
        });
        toast.success(form.id ? "Role updated." : "Role created.");
        setIsModalOpen(false);
        router.refresh();
      } catch (err: any) {
        console.error("Failed to save role", err);
        const msg = String(err?.message || "");
        if (msg === "ROLE_NAME_REQUIRED") {
          toast.error("Role name is required.");
        } else if (msg === "ROLE_KEY_REQUIRED") {
          toast.error("Role key is required.");
        } else if (msg === "ROLE_KEY_INVALID") {
          toast.error("Role key must be snake_case (lowercase, digits, underscore).");
        } else if (msg === "ROLE_KEY_IN_USE") {
          toast.error("This role key is already in use.");
        } else {
          toast.error("Unexpected error while saving role. Check logs.");
        }
      }
    });
  }

  const editingProtected = form.id !== null && isProtected(form.key);

  async function deleteSingleRole(role: RoleDto) {
    if (isProtected(role.key)) {
      toast.error("Protected roles cannot be deleted.");
      return;
    }

    startTransition(async () => {
      try {
        await deleteRoleAction(role.id);
        toast.success("Role deleted.");
        router.refresh();
      } catch (err: any) {
        console.error("Failed to delete role", err);
        const msg = String(err?.message || "");
        if (msg === "ROLE_PROTECTED") {
          toast.error("Protected roles cannot be deleted.");
        } else if (msg === "ROLE_IN_USE") {
          toast.error(
            "This role is used by one or more users and cannot be deleted."
          );
        } else {
          toast.error("Failed to delete role. Check server logs.");
        }
      }
    });
  }

  const columns = React.useMemo<ColumnDef<RoleDto>[]>(() => {
    return [
      {
        id: "select",
        header: ({ table }) => (
          <div className="flex justify-center">
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && "indeterminate")
              }
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(!!value)
              }
              aria-label="Select all"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex justify-center">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
        meta: { exportable: false, printable: false, align: "center" },
      },
      {
        accessorKey: "name",
        header: "Role",
        meta: {
          exportable: true,
          printable: true,
          exportValue: (r: RoleDto) => r.name,
        },
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "key",
        header: "Key",
        meta: {
          exportable: true,
          printable: true,
          exportValue: (r: RoleDto) => r.key,
        },
        cell: ({ row }) => (
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
            {row.original.key}
          </span>
        ),
      },
      {
        accessorKey: "scope",
        header: "Scope",
        meta: {
          exportable: true,
          printable: true,
          exportValue: (r: RoleDto) => r.scope,
        },
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.scope}
          </span>
        ),
      },
      {
        id: "permissions",
        header: "Permissions",
        meta: {
          exportable: true,
          printable: true,
          exportValue: (role: RoleDto) =>
            role.permissions && role.permissions.length
              ? role.permissions.map((p) => p.key).join(" | ")
              : "No permissions",
        },
        cell: ({ row }) => {
          const perms = row.original.permissions ?? [];
          if (!perms.length) {
            return (
              <span className="text-xs text-muted-foreground">
                No permissions
              </span>
            );
          }
          const labels = perms.map((p) => p.key);
          const first = labels.slice(0, 3).join(", ");
          const extra = labels.length > 3 ? ` +${labels.length - 3} more` : "";
          return (
            <span className="text-xs">
              {first}
              {extra}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => (
          <div className="flex justify-end pr-1 text-right">Actions</div>
        ),
        enableSorting: false,
        enableHiding: false,
        meta: { exportable: false, printable: false, align: "right" },
        cell: ({ row }) => {
          const role = row.original;
          const protectedRole = isProtected(role.key);
          return (
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="xs"
                className="rounded-full border-muted-foreground/30 px-3 text-[10px]"
                onClick={() => openEditModal(role)}
              >
                Edit
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    className="rounded-full border-destructive/40 px-3 text-[10px] text-destructive hover:bg-destructive/10"
                    disabled={protectedRole || isPending}
                  >
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-sm text-[11px]">
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Delete role &quot;{role.name}&quot;?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will detach the role from all users. This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="text-[11px]">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-[11px] hover:bg-destructive/90"
                      onClick={() => deleteSingleRole(role)}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          );
        },
      },
    ];
  }, [isPending, router]);

  return (
    <div className="space-y-4">
      {/* Header + New Role button */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">Roles</h2>
          <p className="text-[11px] text-muted-foreground">
            Define central roles and attach permissions. The{" "}
            <span className="font-semibold">central_superadmin</span> role
            automatically has all permissions.
          </p>
        </div>

        <Button
          type="button"
          className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-medium"
          onClick={openCreateModal}
        >
          + New Role
        </Button>
      </div>

      {/* DataTable for roles */}
      <DataTable<RoleDto, unknown>
        columns={columns}
        data={roles}
        searchColumnId="name"
        searchPlaceholder="Search roles..."
        fileName="roles"
        onRefresh={async () => router.refresh()}
        onDeleteRows={async (rows) => {
          const deletable = rows.filter((r) => !isProtected(r.key));
          if (!deletable.length) {
            toast.error("No deletable roles selected.");
            return;
          }

          let anyInUse = 0;
          let deleted = 0;

          for (const r of deletable) {
            try {
              await deleteRoleAction(r.id);
              deleted++;
            } catch (err: any) {
              console.error("Bulk delete role failed", err);
              const msg = String(err?.message || "");
              if (msg === "ROLE_IN_USE") {
                anyInUse++;
              } else if (msg === "ROLE_PROTECTED") {
                // should not happen here because we filter, but just in case
              }
            }
          }

          if (deleted) {
            toast.success(`Deleted ${deleted} role${deleted > 1 ? "s" : ""}.`);
          }
          if (anyInUse) {
            toast.error(
              `${anyInUse} role${
                anyInUse > 1 ? "s are" : " is"
              } used by users and cannot be deleted.`
            );
          }

          router.refresh();
        }}
      />

      {/* Create / Edit Role modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border bg-card p-4 shadow-xl">
            <h3 className="mb-1 text-sm font-semibold">
              {form.id ? "Edit Role" : "Create Role"}
            </h3>
            <p className="mb-3 text-[11px] text-muted-foreground">
              {editingProtected
                ? "This is a protected role. You can only rename it."
                : "Set the role details and attach permissions."}
            </p>

            <form onSubmit={handleSubmit} className="space-y-3 text-[11px]">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium">Name</label>
                <input
                  type="text"
                  className="h-8 w-full rounded-md border px-2 text-[11px]"
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                  required
                />
              </div>

              {/* Key */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium">
                  Key (unique, snake_case)
                </label>
                <input
                  type="text"
                  className="h-8 w-full rounded-md border px-2 text-[11px]"
                  value={form.key}
                  onChange={(e) => updateForm("key", e.target.value)}
                  required
                  disabled={editingProtected}
                />
              </div>

              {/* Scope display only */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium">Scope</label>
                <div className="inline-flex rounded-full bg-muted px-2 py-1 text-[10px] text-muted-foreground">
                  {form.id ? form.scope : "CENTRAL"}
                </div>
              </div>

              {/* Permissions */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium">Permissions</label>
                <div className="max-h-44 space-y-1 overflow-y-auto rounded-md border p-2 text-[10px]">
                  {allPermissions.length === 0 ? (
                    <p className="text-muted-foreground">
                      No permissions defined yet.
                    </p>
                  ) : (
                    allPermissions.map((perm) => (
                      <label
                        key={perm.id}
                        className="flex cursor-pointer items-center gap-2"
                      >
                        <input
                          type="checkbox"
                          className="h-3 w-3"
                          checked={form.permissionIds.includes(perm.id)}
                          onChange={() => togglePermission(perm.id)}
                          disabled={editingProtected}
                        />
                        <span>
                          <span className="font-mono">{perm.key}</span> –{" "}
                          {perm.name}
                        </span>
                      </label>
                    ))
                  )}
                </div>
                {editingProtected && (
                  <p className="text-[10px] text-muted-foreground">
                    Permissions for protected roles are managed automatically.
                  </p>
                )}
              </div>

              {error && (
                <p className="text-[11px] text-red-500">
                  {error}
                </p>
              )}

              <div className="mt-3 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full px-3 text-[11px]"
                  onClick={closeModal}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="rounded-full px-4 text-[11px]"
                  disabled={isPending}
                >
                  {isPending
                    ? form.id
                      ? "Saving..."
                      : "Creating..."
                    : form.id
                    ? "Save changes"
                    : "Create role"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
