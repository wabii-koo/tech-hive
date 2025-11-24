// components/file-manager/create-folder-button.tsx
"use client";

import { Button } from "@/components/ui/button";
import { CreateFolderDialog } from "./create-folder-dialog";
import { Plus } from "lucide-react";
import { useState } from "react";

type CreateFolderButtonProps = {
  parentId?: string | null;
};

export function CreateFolderButton({
  parentId = null,
}: CreateFolderButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        size="sm"
        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[11px] font-medium text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:bg-primary/90"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-3 w-3" />
        Create Folder
      </Button>

      <CreateFolderDialog
        open={open}
        onOpenChange={setOpen}
        parentId={parentId}
      />
    </>
  );
}
