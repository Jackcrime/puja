// ─── Supabase Data Layer ──────────────────────────────────────────────────────
// Menggantikan lib/firestore.ts
// Helper CRUD tipis di atas Supabase client — hooks tetap bisa memanggil
// supabase langsung kalau butuh query spesifik.

import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

// ─── Read single row by id ────────────────────────────────────────────────────
export async function readRow<T>(
  table:    string,
  id:       string,
  fallback: T,
  idCol:    string = "id"
): Promise<T> {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq(idCol, id)
    .maybeSingle();

  if (error) {
    console.error(`[supabase-db] readRow error (${table}/${id}):`, error);
    return fallback;
  }
  return (data as T) ?? fallback;
}

// ─── Write (upsert) single row ────────────────────────────────────────────────
export async function writeRow<T extends object>(
  table:  string,
  id:     string,
  data:   T,
  idCol:  string = "id"
): Promise<void> {
  const payload = { [idCol]: id, ...data };
  const { error } = await supabase.from(table).upsert(payload, { onConflict: idCol });

  if (error) {
    console.error(`[supabase-db] writeRow error (${table}/${id}):`, error);
    throw error;
  }
}

// ─── Read collection (all rows) ───────────────────────────────────────────────
export async function readCollection<T>(
  table:    string,
  fallback: T[],
  order?:   { column: string; ascending?: boolean }
): Promise<T[]> {
  let q = supabase.from(table).select("*");
  if (order) q = q.order(order.column, { ascending: order.ascending ?? true });

  const { data, error } = await q;

  if (error) {
    console.error(`[supabase-db] readCollection error (${table}):`, error);
    return fallback;
  }
  return (data as T[]) ?? fallback;
}

// ─── Insert row ───────────────────────────────────────────────────────────────
export async function insertRow<T extends object>(
  table: string,
  data:  T
): Promise<string> {
  const { data: result, error } = await supabase
    .from(table)
    .insert(data)
    .select("id")
    .single();

  if (error) {
    console.error(`[supabase-db] insertRow error (${table}):`, error);
    throw error;
  }
  return (result as any).id as string;
}

// ─── Update row ───────────────────────────────────────────────────────────────
export async function updateRow<T extends object>(
  table:  string,
  id:     string,
  changes: Partial<T>,
  idCol:  string = "id"
): Promise<void> {
  const { error } = await supabase.from(table).update(changes as any).eq(idCol, id);

  if (error) {
    console.error(`[supabase-db] updateRow error (${table}/${id}):`, error);
    throw error;
  }
}

// ─── Delete row ───────────────────────────────────────────────────────────────
export async function deleteRow(
  table: string,
  id:    string,
  idCol: string = "id"
): Promise<void> {
  const { error } = await supabase.from(table).delete().eq(idCol, id);

  if (error) {
    console.error(`[supabase-db] deleteRow error (${table}/${id}):`, error);
    throw error;
  }
}

// ─── Replace all rows di tabel (delete all + insert) ─────────────────────────
// Berguna untuk tabel yang disimpan sekaligus (perikop_items, verse_highlights, dll.)
export async function replaceAllRows<T extends object>(
  table: string,
  rows:  T[]
): Promise<void> {
  // Delete dulu semua
  const { error: delError } = await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (delError) {
    console.error(`[supabase-db] replaceAllRows delete error (${table}):`, delError);
    throw delError;
  }

  if (rows.length === 0) return;

  const { error: insError } = await supabase.from(table).insert(rows);
  if (insError) {
    console.error(`[supabase-db] replaceAllRows insert error (${table}):`, insError);
    throw insError;
  }
}

// ─── Realtime: subscribe ke perubahan satu row ────────────────────────────────
// Equivalent: Firestore subscribeDoc
export function subscribeRow<T>(
  table:    string,
  id:       string,
  fallback: T,
  onData:   (data: T) => void,
  idCol:    string = "id"
): () => void {
  let cancelled = false;

  // Baca sekali dulu
  readRow<T>(table, id, fallback, idCol).then((data) => {
    if (!cancelled) onData(data);
  });

  const channel: RealtimeChannel = supabase
    .channel(`${table}:${idCol}=eq.${id}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table, filter: `${idCol}=eq.${id}` },
      (payload: any) => {
        if (cancelled) return;
        if (payload.eventType === "DELETE") {
          // Row dihapus — kirim fallback (data kosong)
          onData(fallback);
        } else if (payload.new && Object.keys(payload.new).length > 0) {
          // UPDATE / INSERT — pakai payload langsung (lebih cepat dari re-fetch)
          onData(payload.new as T);
        } else {
          // Payload kosong (edge case) — re-fetch
          readRow<T>(table, id, fallback, idCol).then((data) => {
            if (!cancelled) onData(data);
          });
        }
      }
    )
    .subscribe();

  return () => {
    cancelled = true;
    supabase.removeChannel(channel);
  };
}

// ─── Realtime: subscribe ke seluruh collection ───────────────────────────────
// Equivalent: Firestore subscribeCollection
export function subscribeCollection<T>(
  table:    string,
  onData:   (data: T[]) => void,
  order?:   { column: string; ascending?: boolean }
): () => void {
  // Baca sekali dulu
  readCollection<T>(table, [], order).then(onData);

  const channel: RealtimeChannel = supabase
    .channel(`${table}:all`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      () => {
        // Re-fetch saat ada perubahan
        readCollection<T>(table, [], order).then(onData);
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}