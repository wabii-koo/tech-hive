// components/file-manager/file-actions-menu.tsx
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { deleteFileAction } from "./file-actions";
import { showToast } from "@/lib/toast";

type FileActionsMenuProps = {
  fileId: string;
  fileName: string;
  folderId?: string | null;
};

export function FileActionsMenu({
  fileId,
  fileName,
  folderId = null,
}: FileActionsMenuProps) {
  const [openConfirm, setOpenConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteFileAction(fileId, folderId ?? undefined);
        setOpenConfirm(false);
        showToast({
          title: "File deleted",
          description: `“${fileName}” was deleted successfully.`,
          variant: "success",
        });
      } catch (error) {
        console.error("[FileActionsMenu] delete error", error);
        showToast({
          title: "Delete failed",
          description:
            error instanceof Error
              ? error.message
              : "We couldn't delete this file.",
          variant: "error",
        });
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-7 w-7 rounded-full border bg-background text-muted-foreground shadow-sm hover:bg-accent"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40 text-xs">
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setOpenConfirm(true)}
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete file
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={openConfirm} onOpenChange={setOpenConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this file?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The file{" "}
              <span className="font-medium text-foreground">
                “{fileName}”
              </span>{" "}
              will be permanently removed from this workspace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
