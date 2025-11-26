// app/(dashboard)/security/_components/users-tab-client.tsx

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

/* ----------------------------- Types ----------------------------- */

type RoleLite = {
  id: number;
  key: string;
  name: string;
};

type UserForClient = {
  id: string;
  name: string | null;
  email: string;
  createdAt: string; // ISO
  isActive: boolean;
  userRoles: {
    id: string;
    role: { key: string; name: string; scope: string };
    tenantId: string | null;
  }[];
};

type FormErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  roleId?: string;
  general?: string;
};

/* ----------------------------- Helpers ----------------------------- */

function isTaggedError(err: unknown, tag: string) {
  const msg = String((err as any)?.message ?? "");
  const code = String((err as any)?.code ?? "");
  return msg.includes(tag) || code === tag;
}

function generateStrongPassword(length = 12) {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%^&*";

  const all = upper + lower + digits + symbols;

  let pwd = "";
  // ensure at least 1 of each group
  pwd += upper[Math.floor(Math.random() * upper.length)];
  pwd += lower[Math.floor(Math.random() * lower.length)];
  pwd += digits[Math.floor(Math.random() * digits.length)];
  pwd += symbols[Math.floor(Math.random() * symbols.length)];

  for (let i = pwd.length; i < length; i++) {
    pwd += all[Math.floor(Math.random() * all.length)];
  }

  // simple shuffle
  return pwd
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

function initials(name?: string | null, email?: string) {
  const src = (name || email || "").trim();
  if (!src) return "??";
  const parts = src.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src[0]!.toUpperCase();
}

/* ----------------------------- Component ----------------------------- */

export function UsersTabClient({
  users,
  assignableRoles,
  centralRoleMap, // still unused, kept for future
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
  const [formConfirmPassword, setFormConfirmPassword] = React.useState("");
  const [formRoleId, setFormRoleId] = React.useState<number | "">("");

  const [errors, setErrors] = React.useState<FormErrors>({});

  /* --------------------- protection: self / superadmin --------------------- */

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

  /* --------------------- Toggle active --------------------- */

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
          console.error("toggleUserActiveAction failed", err);
          toast.error("Failed to update user status. Check server logs.");
        }
      });
    },
    [isProtectedUser, router]
  );

  /* --------------------- Open dialogs --------------------- */

  function resetForm() {
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormConfirmPassword("");
    setFormRoleId(assignableRoles[0]?.id ?? "");
    setErrors({});
  }

  function openCreate() {
    setEditingUser(null);
    resetForm();
    setOpenDialog(true);
  }

  function openEdit(user: UserForClient) {
    setEditingUser(user);
    setFormName(user.name || "");
    setFormEmail(user.email);
    setFormPassword("");
    setFormConfirmPassword("");

    const centralRole = user.userRoles.find(
      (ur) => ur.role.scope === "CENTRAL" && ur.tenantId === null
    );
    const match = assignableRoles.find(
      (r) => r.key === centralRole?.role.key
    );
    setFormRoleId(match?.id ?? "");
    setErrors({});
    setOpenDialog(true);
  }

  /* --------------------- Form submit + validation --------------------- */

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: FormErrors = {};
    const isEditing = !!editingUser;

    // Basic validations
    if (!formName.trim()) nextErrors.name = "Name is required.";

    if (!formEmail.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formEmail.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!formRoleId) {
      nextErrors.roleId = "Role is required.";
    }

    const passwordProvided = !!formPassword.trim();
    const confirmProvided = !!formConfirmPassword.trim();

    // For new users password is always required.
    // For editing, password is only required if they try to change it.
    if (!isEditing || passwordProvided || confirmProvided) {
      if (!passwordProvided) {
        nextErrors.password = "Password is required.";
      } else if (formPassword.length < 8) {
        nextErrors.password = "Password must be at least 8 characters.";
      }

      if (!confirmProvided) {
        nextErrors.confirmPassword = "Please confirm the password.";
      } else if (formPassword !== formConfirmPassword) {
        nextErrors.confirmPassword = "Passwords do not match.";
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});

    startTransition(async () => {
      try {
        await createOrUpdateUserAction({
          id: editingUser?.id ?? null,
          name: formName.trim(),
          email: formEmail.trim(),
          password: formPassword || null,
          roleId: formRoleId as number,
        });

        toast.success(editingUser ? "User updated." : "User created.");
        setOpenDialog(false);
        router.refresh();
      } catch (err: any) {
        console.error("createOrUpdateUserAction failed", err);

        if (isTaggedError(err, "EMAIL_IN_USE")) {
          setErrors((prev) => ({
            ...prev,
            email: "The email has already been taken.",
          }));
          return;
        }

        setErrors((prev) => ({
          ...prev,
          general: "Failed to save user. Check server logs.",
        }));
        toast.error("Failed to save user.");
      }
    });
  }

  /* --------------------- Password generator --------------------- */

  function handleGeneratePassword() {
    const pwd = generateStrongPassword(12);
    setFormPassword(pwd);
    setFormConfirmPassword(pwd);
    // clear any previous password errors
    setErrors((prev) => ({
      ...prev,
      password: undefined,
      confirmPassword: undefined,
    }));
  }

  /* --------------------- DataTable columns --------------------- */

  const columns = React.useMemo<ColumnDef<UserForClient>[]>(() => {
    return [
      // selection
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

      // avatar
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

      // user (name + email)
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

      // email column (for export + visibility)
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

      // role
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

      // active
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

      // created at
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

      // actions
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
                          try {
                            await deleteUserAction({ userId: u.id });
                            toast.success("User deleted.");
                            router.refresh();
                          } catch (err) {
                            console.error("deleteUserAction failed", err);
                            toast.error(
                              "Failed to delete user. Check server logs."
                            );
                          }
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
  }, [handleToggleActive, isProtectedUser, isPending, router]);

  /* ----------------------------- JSX ----------------------------- */

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
              {errors.general && (
                <p className="rounded-md bg-destructive/10 px-2 py-1 text-[10px] text-destructive">
                  {errors.general}
                </p>
              )}

              {/* Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground">
                  Name
                </label>
                <input
                  className={`w-full rounded-md border bg-background px-2 py-1 text-[11px] ${
                    errors.name ? "border-destructive" : ""
                  }`}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
                {errors.name && (
                  <p className="mt-1 text-[10px] text-destructive">
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground">
                  Email
                </label>
                <input
                  type="email"
                  className={`w-full rounded-md border bg-background px-2 py-1 text-[11px] ${
                    errors.email ? "border-destructive" : ""
                  }`}
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  required
                />
                {errors.email && (
                  <p className="mt-1 text-[10px] text-destructive">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password + Generate */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground">
                  {editingUser ? "Password (optional)" : "Password"}
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    className={`flex-1 rounded-md border bg-background px-2 py-1 text-[11px] ${
                      errors.password ? "border-destructive" : ""
                    }`}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder={
                      editingUser ? "Leave blank to keep existing" : ""
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGeneratePassword}
                    className="text-[11px]"
                  >
                    Generate
                  </Button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-[10px] text-destructive">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground">
                  Confirm Password
                </label>
                <input
                  type="password"
                  className={`w-full rounded-md border bg-background px-2 py-1 text-[11px] ${
                    errors.confirmPassword ? "border-destructive" : ""
                  }`}
                  value={formConfirmPassword}
                  onChange={(e) => setFormConfirmPassword(e.target.value)}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-[10px] text-destructive">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Role dropdown */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground">
                  Role
                </label>
                <select
                  className={`w-full rounded-md border bg-background px-2 py-1 text-[11px] ${
                    errors.roleId ? "border-destructive" : ""
                  }`}
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
                {errors.roleId && (
                  <p className="mt-1 text-[10px] text-destructive">
                    {errors.roleId}
                  </p>
                )}
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
