"use client";

import { useState, useEffect, useCallback } from "react";
import { readCollection, addItem, updateItem, deleteItem } from "@/lib/firestore";
import { subscribeCollection } from "@/lib/firestore";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PatchNoteType = "new" | "fix" | "improve" | "remove";

export interface PatchNoteItem {
  type:        PatchNoteType;
  description: string;
}

export interface PatchNote {
  id:        string;
  version:   string;           // e.g. "1.2.0"
  title:     string;           // e.g. "Update Konten & Perbaikan"
  date:      string;           // "YYYY-MM-DD"
  items:     PatchNoteItem[];
  published: boolean;
}

// ─── Labels ───────────────────────────────────────────────────────────────────

export const PATCH_TYPE_LABEL: Record<PatchNoteType, string> = {
  new:     "Baru",
  fix:     "Perbaikan",
  improve: "Peningkatan",
  remove:  "Dihapus",
};

export const PATCH_TYPE_COLOR: Record<PatchNoteType, string> = {
  new:     "#16a34a",
  fix:     "#2563eb",
  improve: "#d97706",
  remove:  "#dc2626",
};

// ─── Hook (Admin — realtime via onSnapshot) ───────────────────────────────────

export function usePatchNotesAdmin() {
  const [data,    setData]    = useState<PatchNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeCollection<PatchNote>(
      "patch_notes",
      (items) => {
        // Sort: newest date first
        const sorted = [...items].sort((a, b) =>
          (b.date ?? "").localeCompare(a.date ?? "")
        );
        setData(sorted);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  const add = useCallback(async (note: Omit<PatchNote, "id">) => {
    try {
      await addItem("patch_notes", note);
    } catch {
      toast.error("Gagal menambah patch note.");
    }
  }, []);

  const update = useCallback(async (id: string, changes: Partial<Omit<PatchNote, "id">>) => {
    try {
      await updateItem("patch_notes", id, changes);
    } catch {
      toast.error("Gagal memperbarui patch note.");
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    try {
      await deleteItem("patch_notes", id);
    } catch {
      toast.error("Gagal menghapus patch note.");
    }
  }, []);

  return { data, loading, add, update, remove };
}

// ─── Hook (Public — read once, hanya yang published) ─────────────────────────

export function usePatchNotesPublic() {
  const [data,    setData]    = useState<PatchNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    readCollection<PatchNote>("patch_notes", [])
      .then((items) => {
        const sorted = items
          .filter((n) => n.published)
          .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
        setData(sorted);
      })
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}