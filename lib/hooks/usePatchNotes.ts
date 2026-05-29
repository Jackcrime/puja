"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
export type PatchNoteType = "new" | "fix" | "improve" | "remove";

export interface PatchNoteItem {
  type:        PatchNoteType;
  description: string;
}

export interface PatchNote {
  id:        string;
  version:   string;
  title:     string;
  date:      string;
  items:     PatchNoteItem[];
  published: boolean;
}

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

// ─── Load helper ─────────────────────────────────────────────────────────────
async function loadPatchNotes(publishedOnly = false): Promise<PatchNote[]> {
  let q = supabase.from("patch_notes").select("id, version, title, date, published");
  if (publishedOnly) q = q.eq("published", true);
  q = q.order("date", { ascending: false });

  const { data: notes } = await q;
  if (!notes || notes.length === 0) return [];

  const ids = notes.map((n: any) => n.id);
  const { data: items } = await supabase
    .from("patch_note_items")
    .select("*")
    .in("patch_note_id", ids)
    .order("sort_order");

  return notes.map((n: any) => ({
    id:        n.id,
    version:   n.version,
    title:     n.title,
    date:      n.date,
    published: n.published,
    items:     (items ?? [])
      .filter((i: any) => i.patch_note_id === n.id)
      .map((i: any) => ({ type: i.type as PatchNoteType, description: i.description })),
  }));
}

// ─── Admin hook (realtime) ────────────────────────────────────────────────────
export function usePatchNotesAdmin() {
  const [data,    setData]    = useState<PatchNote[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const notes = await loadPatchNotes(false);
    setData(notes);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();

    // Realtime: reload saat ada perubahan
    const channel = supabase
      .channel("patch_notes:all")
      .on("postgres_changes", { event: "*", schema: "public", table: "patch_notes" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "patch_note_items" }, load)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const add = useCallback(async (note: Omit<PatchNote, "id">) => {
    try {
      const { data: inserted } = await supabase
        .from("patch_notes")
        .insert({ version: note.version, title: note.title, date: note.date, published: note.published })
        .select("id")
        .single();

      if (inserted?.id && note.items?.length) {
        await supabase.from("patch_note_items").insert(
          note.items.map((item, i) => ({
            patch_note_id: inserted.id,
            type:          item.type,
            description:   item.description,
            sort_order:    i,
          }))
        );
      }
    } catch {
      toast.error("Gagal menambah patch note.");
    }
  }, []);

  const update = useCallback(async (id: string, changes: Partial<Omit<PatchNote, "id">>) => {
    try {
      const { version, title, date, published, items } = changes;
      const payload: any = {};
      if (version   !== undefined) payload.version   = version;
      if (title     !== undefined) payload.title     = title;
      if (date      !== undefined) payload.date      = date;
      if (published !== undefined) payload.published = published;

      if (Object.keys(payload).length > 0) {
        await supabase.from("patch_notes").update(payload).eq("id", id);
      }

      if (items !== undefined) {
        await supabase.from("patch_note_items").delete().eq("patch_note_id", id);
        if (items.length > 0) {
          await supabase.from("patch_note_items").insert(
            items.map((item, i) => ({
              patch_note_id: id,
              type:          item.type,
              description:   item.description,
              sort_order:    i,
            }))
          );
        }
      }
    } catch {
      toast.error("Gagal memperbarui patch note.");
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    try {
      await supabase.from("patch_note_items").delete().eq("patch_note_id", id);
      await supabase.from("patch_notes").delete().eq("id", id);
    } catch {
      toast.error("Gagal menghapus patch note.");
    }
  }, []);

  return { data, loading, add, update, remove };
}

// ─── Public hook (read-once, published only) ──────────────────────────────────
export function usePatchNotesPublic() {
  const [data,    setData]    = useState<PatchNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatchNotes(true).then(setData).finally(() => setLoading(false));
  }, []);

  return { data, loading };
}
