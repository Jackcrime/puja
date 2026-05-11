// ─── Admin Data Store ──────────────────────────────────────────────────────────
// Semua data yang bisa diedit admin disimpan di localStorage.
// App membaca dari sini dulu, lalu fallback ke mockData jika kosong.

export type StoreKey =
  | "admin_ayat_categories"
  | "admin_special_verses"
  | "admin_authors"
  | "admin_devotional"
  | "admin_pustaka_books"
  | "admin_perikop"
  | "admin_announcement"
  | "admin_verse_highlights"
  | "admin_prayer_topic";

function get<T>(key: StoreKey, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function set<T>(key: StoreKey, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function remove(key: StoreKey): void {
  try {
    localStorage.removeItem(key);
  } catch {}
}

// ─── Generic CRUD helpers ──────────────────────────────────────────────────────

export function readStore<T>(key: StoreKey, fallback: T): T {
  return get(key, fallback);
}

export function writeStore<T>(key: StoreKey, value: T): void {
  set(key, value);
}

export function resetStore(key: StoreKey): void {
  remove(key);
}

// ─── Item-level CRUD (untuk array data) ───────────────────────────────────────

export function addItem<T extends { id: string | number }>(
  key: StoreKey,
  fallback: T[],
  item: Omit<T, "id"> & Partial<Pick<T, "id">>
): T[] {
  const current = get<T[]>(key, fallback);
  const newItem = {
    ...item,
    id: (item as any).id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  } as T;
  const updated = [...current, newItem];
  set(key, updated);
  return updated;
}

export function updateItem<T extends { id: string | number }>(
  key: StoreKey,
  fallback: T[],
  id: string | number,
  changes: Partial<T>
): T[] {
  const current = get<T[]>(key, fallback);
  const updated = current.map((item) =>
    item.id === id ? { ...item, ...changes } : item
  );
  set(key, updated);
  return updated;
}

export function deleteItem<T extends { id: string | number }>(
  key: StoreKey,
  fallback: T[],
  id: string | number
): T[] {
  const current = get<T[]>(key, fallback);
  const updated = current.filter((item) => item.id !== id);
  set(key, updated);
  return updated;
}

// ─── Export all data as JSON (untuk backup) ────────────────────────────────────
export function exportAllData(): string {
  const keys: StoreKey[] = [
    "admin_ayat_categories",
    "admin_special_verses",
    "admin_authors",
    "admin_devotional",
    "admin_pustaka_books",
    "admin_perikop",
    "admin_announcement",
    "admin_verse_highlights",
    "admin_prayer_topic",
  ];

  const result: Record<string, unknown> = {};
  keys.forEach((k) => {
    try {
      const raw = localStorage.getItem(k);
      if (raw) result[k] = JSON.parse(raw);
    } catch {}
  });

  return JSON.stringify(result, null, 2);
}
