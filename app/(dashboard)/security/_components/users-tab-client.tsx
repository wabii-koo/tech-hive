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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createOrUpdateUserAction,
  deleteUserAction,
  toggleUserActiveAction,
} from "../users-actions";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type RoleLite = {
  id: number;
  key: string;
  name: string;
};

type UserForClient = {
  id: string;
  name: string | null;
  email: string;
  createdAt: string; // ISO string
  isActive: boolean;
  userRoles: {
    id: string;
    role: { key: string; name: string; scope: string };
    tenantId: string | null;
  }[];
};

export function UsersTabClient({
  users,
  assignableRoles,
  centralRoleMap, // kept for future use
  currentUserId,
}: {
  users: UserForClient[];
  assignableRoles: RoleLite[];
  centralRoleMap: Record<number, string>;
  currentUserId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [openDialog, setOpenDialog] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<UserForClient | null>(
    null
  );

  const [formName, setFormName] = React.useState("");
  const [formEmail, setFormEmail] = React.useState("");
  const [formPassword, setFormPassword] = React.useState("");
  const [formRoleId, setFormRoleId] = React.useState<number | "">("");

  const isProtectedUser = React.useCallback(
    (u: UserForClient) => {
      const centralRole = u.userRoles.find(
        (ur) => ur.role.scope === "CENTRAL" && ur.tenantId === null
      );
      const isSuperadmin = centralRole?.role.key === "central_superadmin";
      const isSelf = u.id === currentUserId;
      return isSuperadmin || isSelf;
    },
    [currentUserId]
  );

  function initials(name?: string | null, email?: string) {
    const src = (name || email || "").trim();
    if (!src) return "??";
    const parts = src.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return src[0]!.toUpperCase();
  }

  function openCreate() {
    setEditingUser(null);
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormRoleId(assignableRoles[0]?.id ?? "");
    setOpenDialog(true);
  }

  function openEdit(user: UserForClient) {
    setEditingUser(user);
    setFormName(user.name || "");
    setFormEmail(user.email);
    setFormPassword("");

    const centralRole = user.userRoles.find(
      (ur) => ur.role.scope === "CENTRAL" && ur.tenantId === null
    );
    const match = assignableRoles.find(
      (r) => r.key === centralRole?.role.key
    );
    setFormRoleId(match?.id ?? "");
    setOpenDialog(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formRoleId) return;

    startTransition(async () => {
      try {
        await createOrUpdateUserAction({
          id: editingUser?.id ?? null,
          name: formName,
          email: formEmail,
          password: formPassword || null,
          roleId: formRoleId as number,
        });
        toast.success(editingUser ? "User updated." : "User created.");
        setOpenDialog(false);
        router.refresh();
      } catch (err: any) {
        console.error("Failed to save user", err);
        const msg = String(err?.message || "");
        if (msg === "USER_NAME_REQUIRED") {
          toast.error("Name is required.");
        } else if (msg === "USER_EMAIL_REQUIRED") {
          toast.error("Email is required.");
        } else if (msg === "USER_EMAIL_INVALID") {
          toast.error("Please enter a valid email address.");
        } else if (msg === "USER_PASSWORD_REQUIRED") {
          toast.error("Password is required for new users.");
        } else if (msg === "USER_PASSWORD_TOO_SHORT") {
          toast.error("Password must be at least 8 characters.");
        } else if (msg === "EMAIL_IN_USE") {
          toast.error("This email is already in use.");
        } else {
          toast.error("Failed to save user. Check server logs.");
        }
      }
    });
  }

  const handleToggleActive = React.useCallback(
    (user: UserForClient) => {
      if (isProtectedUser(user)) return;

      startTransition(async () => {
        try {
          await toggleUserActiveAction({
            userId: user.id,
            newActive: !user.isActive,
          });
          toast.success("User status updated.");
          router.refresh();
        } catch (err) {
          console.error("Failed to toggle user active", err);
          toast.error("Failed to update user status.");
        }
      });
    },
    [isProtectedUser, router]
  );

  const columns = React.useMemo<ColumnDef<UserForClient>[]>(() => {
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
        id: "avatar",
        header: "Avatar",
        meta: { exportable: false, printable: false },
        cell: ({ row }) => {
          const u = row.original;
          const inits = initials(u.name, u.email);
          return (
            <div className="flex items-center justify-start">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[11px] font-semibold">
                {inits}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "name",
        header: "User",
        meta: {
          exportable: true,
          printable: true,
          exportValue: (u: UserForClient) => u.name || "",
        },
        cell: ({ row }) => {
          const u = row.original;
          return (
            <div className="flex flex-col">
              <span className="text-xs font-medium">
                {u.name || "(No name)"}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {u.email}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "email",
        header: "Email",
        meta: {
          exportable: true,
          printable: true,
          exportValue: (u: UserForClient) => u.email,
        },
        cell: ({ row }) => row.original.email,
      },
      {
        id: "role",
        header: "Role",
        meta: {
          exportable: true,
          printable: true,
          exportValue: (u: UserForClient) => {
            const centralRole = u.userRoles.find(
              (ur) => ur.role.scope === "CENTRAL" && ur.tenantId === null
            );
            return centralRole ? centralRole.role.name : "";
          },
        },
        cell: ({ row }) => {
          const u = row.original;
          const centralRole = u.userRoles.find(
            (ur) => ur.role.scope === "CENTRAL" && ur.tenantId === null
          );
          return centralRole ? centralRole.role.name : "—";
        },
      },
      {
        id: "active",
        header: "Active",
        meta: {
          exportable: true,
          printable: true,
          exportValue: (u: UserForClient) =>
            u.isActive ? "Active" : "Disabled",
        },
        cell: ({ row }) => {
          const u = row.original;
          const disabled = isProtectedUser(u) || isPending;
          return (
            <div className="flex items-center gap-2">
              <Switch
                checked={u.isActive}
                disabled={disabled}
                onCheckedChange={() => handleToggleActive(u)}
              />
              <span className="text-[10px] text-muted-foreground">
                {u.isActive ? "Active" : "Disabled"}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        meta: {
          exportable: true,
          printable: true,
          exportValue: (u: UserForClient) => u.createdAt,
        },
        cell: ({ row }) => (
          <span className="text-[11px] text-muted-foreground">
            {row.original.createdAt.slice(0, 10)}
          </span>
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
          const u = row.original;
          const protectedUser = isProtectedUser(u);

          return (
            <div className="flex justify-end gap-1">
              <Button
                size="xs"
                variant="outline"
                className="rounded-full border-muted-foreground/30 px-3 text-[10px]"
                disabled={false}
                onClick={() => openEdit(u)}
              >
                Edit
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="xs"
                    variant="outline"
                    className="rounded-full border-destructive/40 px-3 text-[10px] text-destructive hover:bg-destructive/10"
                    disabled={protectedUser}
                  >
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-sm text-[11px]">
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Delete user &quot;{u.name || u.email}&quot;?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. The user account will be
                      permanently removed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="text-[11px]">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-[11px] hover:bg-destructive/90"
                      onClick={() =>
                        startTransition(async () => {
                          if (protectedUser) return;
                          await deleteUserAction({ userId: u.id });
                          toast.success("User deleted.");
                          router.refresh();
                        })
                      }
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
  }, [assignableRoles, handleToggleActive, isProtectedUser, isPending, router]);

  return (
    <div className="space-y-3">
      {/* Header + create button */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">Central Users</h2>
          <p className="text-[11px] text-muted-foreground">
            Manage central-scope users. Superadministrator is unique and cannot
            be reassigned from here.
          </p>
        </div>

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="rounded-full px-3 py-1 text-[11px] font-medium"
              onClick={openCreate}
            >
              + New User
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-sm">
                {editingUser ? "Edit User" : "Create User"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-3 text-[11px]">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground">
                  Name
                </label>
                <input
                  className="w-full rounded-md border bg-background px-2 py-1 text-[11px]"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full rounded-md border bg-background px-2 py-1 text-[11px]"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground">
                  {editingUser ? "Password (optional)" : "Password"}
                </label>
                <input
                  type="password"
                  className="w-full rounded-md border bg-background px-2 py-1 text-[11px]"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder={
                    editingUser ? "Leave blank to keep existing" : ""
                  }
                  {...(editingUser ? {} : { required: true })}
                />
              </div>

              {/* Role dropdown */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground">
                  Role
                </label>
                <select
                  className="w-full rounded-md border bg-background px-2 py-1 text-[11px]"
                  value={formRoleId}
                  onChange={(e) =>
                    setFormRoleId(Number(e.target.value) || "")
                  }
                  required
                >
                  {assignableRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-muted-foreground">
                  Central Superadministrator role is hidden – there is only one.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenDialog(false)}
                  className="text-[11px]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending}
                  className="text-[11px]"
                >
                  {editingUser ? "Save Changes" : "Create User"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users DataTable */}
      {users.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/40 p-4 text-[11px] text-muted-foreground">
          No central users found.
        </div>
      ) : (
        <DataTable<UserForClient, unknown>
          columns={columns}
          data={users}
          searchColumnId="name"
          searchPlaceholder="Search users..."
          fileName="users"
          dateFilterColumnId="createdAt"
          onRefresh={async () => router.refresh()}
          onDeleteRows={async (rows) => {
            const deletable = rows.filter((u) => !isProtectedUser(u));
            if (!deletable.length) {
              toast.error("No deletable users selected.");
              return;
            }

            await Promise.all(
              deletable.map((u) => deleteUserAction({ userId: u.id }))
            );

            toast.success("Selected users deleted.");
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
