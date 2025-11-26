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
import {
  deletePermissionAction,
  upsertPermissionAction,
} from "../permissions-actions";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { Input } from "@/components/ui/input";
import { Permission } from "@prisma/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Props = {
  permissions: Permission[];
};

type PermissionFormState = {
  id: number | null;
  key: string;
  name: string;
};

export function PermissionsTab({ permissions }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [form, setForm] = React.useState<PermissionFormState>({
    id: null,
    key: "",
    name: "",
  });

  function openCreate() {
    setForm({ id: null, key: "", name: "" });
    setDialogOpen(true);
  }

  function openEdit(p: Permission) {
    setForm({ id: p.id, key: p.key, name: p.name });
    setDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await upsertPermissionAction({
          id: form.id,
          key: form.key,
          name: form.name,
        });
        toast.success(form.id ? "Permission updated." : "Permission created.");
        setDialogOpen(false);
        router.refresh();
      } catch (err: any) {
        console.error("Failed to save permission", err);
        const msg = String(err?.message || "");
        if (msg === "PERMISSION_NAME_REQUIRED") {
          toast.error("Permission name is required.");
        } else if (msg === "PERMISSION_KEY_REQUIRED") {
          toast.error("Permission key is required.");
        } else if (msg === "PERMISSION_KEY_INVALID") {
          toast.error("Key must be snake_case (lowercase, digits, underscore).");
        } else if (msg === "PERMISSION_KEY_IN_USE") {
          toast.error("This permission key is already in use.");
        } else {
          toast.error("Failed to save permission. Check server logs.");
        }
      }
    });
  }

  async function deleteSinglePermission(p: Permission) {
    startTransition(async () => {
      try {
        await deletePermissionAction(p.id);
        toast.success("Permission deleted.");
        router.refresh();
      } catch (err: any) {
        console.error("Failed to delete permission", err);
        const msg = String(err?.message || "");
        if (msg === "PERMISSION_IN_USE") {
          toast.error(
            "This permission is used by one or more roles and cannot be deleted."
          );
        } else {
          toast.error("Failed to delete permission. Check server logs.");
        }
      }
    });
  }

  const columns = React.useMemo<ColumnDef<Permission>[]>(() => {
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
        header: "Name",
        meta: {
          exportable: true,
          printable: true,
          exportValue: (p: Permission) => p.name,
        },
        cell: ({ row }) => row.original.name,
      },
      {
        accessorKey: "key",
        header: "Key",
        meta: {
          exportable: true,
          printable: true,
          exportValue: (p: Permission) => p.key,
        },
        cell: ({ row }) => (
          <span className="font-mono text-[10px]">{row.original.key}</span>
        ),
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
          const p = row.original;
          return (
            <div className="flex justify-end gap-2">
              <Button
                size="xs"
                variant="outline"
                className="rounded-full border-muted-foreground/30 px-3 text-[10px]"
                onClick={() => openEdit(p)}
              >
                Edit
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="xs"
                    variant="outline"
                    className="rounded-full border-destructive/40 px-3 text-[10px] text-destructive hover:bg-destructive/10"
                  >
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-sm text-[11px]">
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Delete permission &quot;{p.name}&quot;?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      If this permission is used in any role it cannot be
                      deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="text-[11px]">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-[11px] hover:bg-destructive/90"
                      onClick={() => deleteSinglePermission(p)}
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
  }, []);

  return (
    <div className="space-y-4 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Permissions</h2>
          <p className="text-[11px] text-muted-foreground">
            Define the capabilities that can be attached to roles. The central
            superadmin role automatically has all permissions.
          </p>
        </div>
        <Button
          size="sm"
          className="rounded-full px-3 py-1 text-[11px] font-medium"
          onClick={openCreate}
        >
          New Permission
        </Button>
      </div>

      {/* DataTable */}
      <DataTable<Permission, unknown>
        columns={columns}
        data={permissions}
        searchColumnId="name"
        searchPlaceholder="Search permissions..."
        fileName="permissions"
        onRefresh={async () => router.refresh()}
        onDeleteRows={async (rows) => {
          if (!rows.length) return;

          let anyInUse = 0;
          let deleted = 0;

          for (const p of rows) {
            try {
              await deletePermissionAction(p.id);
              deleted++;
            } catch (err: any) {
              console.error("Bulk delete permission failed", err);
              const msg = String(err?.message || "");
              if (msg === "PERMISSION_IN_USE") {
                anyInUse++;
              }
            }
          }

          if (deleted) {
            toast.success(
              `Deleted ${deleted} permission${deleted > 1 ? "s" : ""}.`
            );
          }
          if (anyInUse) {
            toast.error(
              `${anyInUse} permission${
                anyInUse > 1 ? "s are" : " is"
              } used by roles and cannot be deleted.`
            );
          }

          router.refresh();
        }}
      />

      {/* Create/Edit modal */}
      {dialogOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl border bg-card p-4 shadow-xl">
            <h3 className="mb-2 text-sm font-semibold">
              {form.id ? "Edit Permission" : "Create Permission"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3 text-[11px]">
              <div className="space-y-1">
                <label className="text-[10px] font-medium">Name</label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-medium">
                  Key (unique, lowercase, snake_case)
                </label>
                <Input
                  value={form.key}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, key: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isPending}>
                  {isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
