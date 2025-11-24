// components/file-manager/create-folder-dialog.tsx
"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createFolderAction } from "./create-folder-action";
import { showToast } from "@/lib/toast";
import { useTransition } from "react";

type CreateFolderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId?: string | null;
};

export function CreateFolderDialog({
  open,
  onOpenChange,
  parentId,
}: CreateFolderDialogProps) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    // Inject parentId if present
    if (parentId) {
      formData.set("parentId", parentId);
    }

    startTransition(async () => {
      try {
        await createFolderAction(formData);
        onOpenChange(false);
        form.reset();
        showToast({
          title: "Folder created",
          description: "Your folder has been created successfully.",
          variant: "success",
        });
      } catch (error) {
        console.error("[CreateFolderDialog] error", error);
        showToast({
          title: "Something went wrong",
          description: "We couldn't create the folder. Please try again.",
          variant: "error",
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new folder</DialogTitle>
          <DialogDescription>
            Give your folder a name. You can organize files into folders later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            name="name"
            placeholder="Folder name"
            autoFocus
            disabled={isPending}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
