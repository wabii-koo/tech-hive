// components/file-manager/pdf-modal-viewer.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Maximize2, Minimize2 } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";

type PdfModalViewerProps = {
  url: string;
  label?: string;
};

export function PdfModalViewer({ url, label = "View PDF" }: PdfModalViewerProps) {
  const [open, setOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current) {
          await containerRef.current.requestFullscreen();
          setIsFullscreen(true);
        }
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error("[PdfModalViewer] fullscreen error", err);
    }
  }

  return (
    <>
      {/* Trigger button (e.g. shown in the details card) */}
      <Button
        type="button"
        size="sm"
        className="inline-flex items-center gap-1 text-[11px]"
        onClick={() => setOpen(true)}
      >
        <Maximize2 className="h-3 w-3" />
        {label}
      </Button>

      {/* Modal popup with PDF iframe */}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next && document.fullscreenElement) {
            // if user closes modal while fullscreen, exit fullscreen too
            document.exitFullscreen().catch(() => {});
            setIsFullscreen(false);
          }
        }}
      >
        <DialogContent className="max-w-5xl h-[80vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between gap-2">
              <DialogTitle className="text-sm">
                PDF Preview
              </DialogTitle>

              <div className="flex items-center gap-2">
                {/* Fullscreen toggle button */}
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-3.5 w-3.5" />
                  ) : (
                    <Maximize2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* This container goes fullscreen */}
          <div
            ref={containerRef}
            className="flex-1 overflow-hidden rounded-md border bg-background"
          >
            <iframe
              src={url}
              className="h-full w-full"
              title="PDF Preview"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
