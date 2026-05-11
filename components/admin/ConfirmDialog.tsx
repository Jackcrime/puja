"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  onConfirm: () => void;
  confirmLabel?: string;
  danger?: boolean;
}

export function ConfirmDialog({
  open, onOpenChange, title = "Konfirmasi Hapus",
  description = "Tindakan ini tidak bisa dibatalkan. Yakin ingin menghapus?",
  onConfirm, confirmLabel = "Ya, Hapus", danger = true,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mt-1 mb-4">{description}</p>
        <div className="flex gap-2 justify-end">
          <button onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
            Batal
          </button>
          <button
            onClick={() => { onConfirm(); onOpenChange(false); }}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
            style={{ backgroundColor: danger ? "#dc2626" : "var(--brand)" }}
          >
            {confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
