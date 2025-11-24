"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Clock,
  Download,
  File as FileIcon,
  Folder as FolderIcon,
  Image as ImageIcon,
  LogOut,
  MoreHorizontal,
  Music,
  Search,
  Settings,
  Share2,
  Star,
  Trash2,
  Video,
} from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

type FolderDto = {
  id: string;
  name: string;
  fileCount: number;
  totalSize: number;
};

type FileDto = {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  folderName: string | null;
  url: string;
  createdAt: string;
};

type Props = {
  folders: FolderDto[];
  recentFiles: FileDto[];
  totalFiles: number;
  totalSize: number;
};

type Selection =
  | { type: "folder"; item: FolderDto }
  | { type: "file"; item: FileDto };

function formatSize(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let value = bytes;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(1)} ${units[i]}`;
}

export function FileManager({
  folders,
  recentFiles,
  totalFiles,
  totalSize,
}: Props) {
  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState<Selection | null>(() => {
    if (recentFiles[0]) return { type: "file", item: recentFiles[0] };
    if (folders[0]) return { type: "folder", item: folders[0] };
    return null;
  });

  const filteredFolders = useMemo(
    () =>
      query.trim()
        ? folders.filter((f) =>
            f.name.toLowerCase().includes(query.toLowerCase())
          )
        : folders,
    [folders, query]
  );

  return (
    <div className="grid h-[calc(100vh-4rem)] grid-cols-[260px,1.8fr,1.2fr] gap-4">
      {/* LEFT – sidebar */}
      <aside className="flex flex-col rounded-2xl border border-border bg-card/80 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">File Manager</h2>
            <p className="text-[11px] text-muted-foreground">
              Organize your tenant files
            </p>
          </div>
          <button className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-accent">
            <Settings className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="mt-4">
          <div className="flex items-center rounded-xl border border-border bg-background px-3 py-2 text-xs">
            <Search className="mr-2 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search files"
              className="h-6 w-full bg-transparent text-xs outline-none"
            />
          </div>
        </div>

        {/* Nav items */}
        <nav className="mt-4 flex-1 space-y-1 text-xs">
          <SidebarItem
            icon={FolderIcon}
            label="My Files"
            active
            badge={totalFiles.toString()}
          />
          <SidebarItem icon={Star} label="Favourites" />
          <SidebarItem icon={Share2} label="Shared Files" />
          <SidebarItem icon={Trash2} label="Recycle Bin" />
          <SidebarItem icon={Clock} label="Recent Files" />
        </nav>

        {/* Usage */}
        <div className="mt-4 rounded-xl bg-accent/40 p-3 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="font-medium">Storage</span>
            <span className="text-muted-foreground">
              {formatSize(totalSize)}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full w-1/2 rounded-full bg-emerald-500/80" />
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            {totalFiles} files stored for this tenant.
          </p>
        </div>

        {/* Footer */}
        <button className="mt-3 inline-flex items-center gap-2 rounded-xl px-2 py-1.5 text-[11px] text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
          <LogOut className="h-3.5 w-3.5" />
          Logout
        </button>
      </aside>

      {/* MIDDLE – folders grid */}
      <section className="flex flex-col rounded-2xl border border-border bg-card/80 p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Folders</h2>
          <div className="space-x-2 text-xs">
            <button className="rounded-full bg-primary px-3 py-1 font-medium text-primary-foreground hover:bg-primary/90">
              + Create Folder
            </button>
            <button className="rounded-full border border-border px-3 py-1 font-medium hover:bg-accent">
              + Upload File
            </button>
          </div>
        </div>

        {/* "My Files" quick categories – just map first few folders */}
        <div>
          <p className="text-[11px] font-medium text-muted-foreground">
            My Files
          </p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {filteredFolders.slice(0, 4).map((folder, idx) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                iconIndex={idx}
                onClick={() =>
                  setSelection({ type: "folder", item: folder })
                }
                selected={
                  selection?.type === "folder" &&
                  selection.item.id === folder.id
                }
              />
            ))}
            {filteredFolders.length === 0 && (
              <div className="col-span-4 rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                No folders yet. Use{" "}
                <span className="font-medium">“Create Folder”</span> to get
                started.
              </div>
            )}
          </div>
        </div>

        {/* All folders */}
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-medium text-muted-foreground">
              Folders
            </p>
            <button className="text-[11px] font-medium text-emerald-600 hover:underline">
              View all
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredFolders.map((folder, idx) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                iconIndex={idx}
                compact
                onClick={() =>
                  setSelection({ type: "folder", item: folder })
                }
                selected={
                  selection?.type === "folder" &&
                  selection.item.id === folder.id
                }
              />
            ))}
          </div>
        </div>

        {/* Recents row */}
        <div className="mt-6">
          <p className="mb-2 text-[11px] font-medium text-muted-foreground">
            Recents
          </p>
          <div className="space-y-1 rounded-xl border border-border bg-background/40 p-3 text-[11px]">
            {recentFiles.length === 0 && (
              <div className="text-muted-foreground">
                No recent files for this tenant.
              </div>
            )}
            {recentFiles.map((file) => (
              <button
                key={file.id}
                onClick={() => setSelection({ type: "file", item: file })}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left hover:bg-accent",
                  selection?.type === "file" &&
                    selection.item.id === file.id &&
                    "bg-accent"
                )}
              >
                <div className="flex items-center gap-2">
                  <FileIcon className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="truncate text-[11px] font-medium">
                    {file.name}
                  </span>
                  {file.folderName && (
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {file.folderName}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {formatSize(file.size)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* RIGHT – details panel */}
      <section className="flex flex-col rounded-2xl border border-border bg-card/80 p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">File Details</h2>
          <button className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-accent">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>

        {!selection ? (
          <div className="mt-10 text-center text-xs text-muted-foreground">
            Select a folder or file to see details.
          </div>
        ) : selection.type === "folder" ? (
          <FolderDetails folder={selection.item} />
        ) : (
          <FileDetails file={selection.item} />
        )}
      </section>
    </div>
  );
}

/* ------------ Small sub-components ------------- */

function SidebarItem({
  icon: Icon,
  label,
  active,
  badge,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  badge?: string;
}) {
  return (
    <button
      className={cn(
        "flex w-full items-center justify-between rounded-xl px-2 py-2",
        "text-[11px]",
        active
          ? "bg-emerald-500/10 font-semibold text-emerald-700"
          : "text-muted-foreground hover:bg-accent"
      )}
    >
      <span className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      {badge && (
        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-600">
          {badge}
        </span>
      )}
    </button>
  );
}

const folderIcons = [ImageIcon, Video, FileIcon, Music, Download];

function FolderCard({
  folder,
  iconIndex,
  compact,
  onClick,
  selected,
}: {
  folder: FolderDto;
  iconIndex: number;
  compact?: boolean;
  onClick: () => void;
  selected?: boolean;
}) {
  const Icon = folderIcons[iconIndex % folderIcons.length];

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full flex-col items-start rounded-2xl border px-3 py-3 text-left text-xs shadow-sm",
        "border-border bg-background/60 hover:border-emerald-400 hover:shadow-md",
        selected && "border-emerald-500 bg-emerald-50/70"
      )}
    >
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
        <Icon className="h-4 w-4" />
      </div>
      <div className="font-medium">{folder.name}</div>
      <div className="mt-1 text-[10px] text-muted-foreground">
        {folder.fileCount} files • {formatSize(folder.totalSize)}
      </div>
      {!compact && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/2 rounded-full bg-emerald-400/80" />
        </div>
      )}
    </button>
  );
}

function FolderDetails({ folder }: { folder: FolderDto }) {
  return (
    <div className="flex flex-1 flex-col text-xs">
      <Card className="mb-4 flex flex-1 flex-col items-center justify-center border border-dashed border-border bg-muted/40">
        <FolderIcon className="h-10 w-10 text-emerald-500" />
        <div className="mt-2 text-sm font-semibold">{folder.name}</div>
        <div className="mt-1 text-[11px] text-muted-foreground">
          {folder.fileCount} files • {formatSize(folder.totalSize)}
        </div>
      </Card>
      <div className="space-y-2 text-[11px]">
        <div>
          <span className="font-medium">Folder name: </span>
          {folder.name}
        </div>
        <div>
          <span className="font-medium">Files: </span>
          {folder.fileCount}
        </div>
        <div>
          <span className="font-medium">Size: </span>
          {formatSize(folder.totalSize)}
        </div>
      </div>
    </div>
  );
}

function FileDetails({ file }: { file: FileDto }) {
  return (
    <div className="flex flex-1 flex-col text-xs">
      <Card className="mb-4 flex flex-1 flex-col items-center justify-center border border-dashed border-border bg-muted/40">
        <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-background shadow-inner">
          <FileIcon className="h-10 w-10 text-emerald-500" />
        </div>
        <div className="mt-3 text-sm font-semibold">{file.name}</div>
        <div className="mt-1 text-[11px] text-muted-foreground">
          {formatSize(file.size)} • {file.mimeType}
        </div>
      </Card>
      <div className="space-y-2 text-[11px]">
        <div>
          <span className="font-medium">Folder: </span>
          {file.folderName ?? "Root"}
        </div>
        <div>
          <span className="font-medium">Created: </span>
          {new Date(file.createdAt).toLocaleString()}
        </div>
        <div>
          <span className="font-medium">Location: </span>
          <span className="break-all text-muted-foreground">{file.url}</span>
        </div>
      </div>
    </div>
  );
}
