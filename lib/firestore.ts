// ─── Firestore Data Layer ──────────────────────────────────────────────────────
// Pengganti lib/admin/store.ts yang pakai localStorage.
// Semua data disimpan di Firestore, real-time dan sync antar device.

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  addDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type CollectionName =
  | "devotional"
  | "perikop"
  | "special_verses"
  | "authors"
  | "pustaka_books"
  | "announcement"
  | "ayat_categories"
  | "ayat_khusus"
  | "verse_highlights"
  | "prayer_topic"
  | "bible_readings"
  | "ministries"
  | "mazmur_minggu"
  | "bahan_khotbah"
  | "pokok_doa_harian"
  | "ayat_nats"
  | "page_visits"
  | "patch_notes";

// ─── Read single document ──────────────────────────────────────────────────────
export async function readDoc<T>(
  collectionName: CollectionName,
  docId: string,
  fallback: T
): Promise<T> {
  try {
    const ref = doc(db, collectionName, docId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return fallback;
    return snap.data() as T;
  } catch (e) {
    console.error(`[firestore] readDoc error:`, e);
    return fallback;
  }
}

// ─── Write single document ─────────────────────────────────────────────────────
export async function writeDoc<T extends object>(
  collectionName: CollectionName,
  docId: string,
  data: T
): Promise<void> {
  const ref = doc(db, collectionName, docId);
  // Firestore tidak menerima nilai undefined — hapus semua field yang undefined
  const clean = Object.fromEntries(
    Object.entries({ ...data, updatedAt: serverTimestamp() })
      .filter(([, v]) => v !== undefined)
  );
  try {
    await setDoc(ref, clean);
  } catch (e) {
    console.error(`[firestore] writeDoc error (${collectionName}/${docId}):`, e);
    throw e; // re-throw agar hook bisa catch dan tampilkan toast + batalkan setData
  }
}

// ─── Read collection (array data) ─────────────────────────────────────────────
export async function readCollection<T>(
  collectionName: CollectionName,
  fallback: T[]
): Promise<T[]> {
  try {
    const ref = collection(db, collectionName);
    const snap = await getDocs(ref);
    if (snap.empty) return fallback;
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as T));
  } catch (e) {
    console.error(`[firestore] readCollection error:`, e);
    return fallback;
  }
}

// ─── Add item to collection ────────────────────────────────────────────────────
export async function addItem<T extends object>(
  collectionName: CollectionName,
  data: T
): Promise<string> {
  const ref = collection(db, collectionName);
  try {
    const docRef = await addDoc(ref, { ...data, createdAt: serverTimestamp() });
    return docRef.id;
  } catch (e) {
    console.error(`[firestore] addItem error (${collectionName}):`, e);
    throw e;
  }
}

// ─── Update item in collection ─────────────────────────────────────────────────
export async function updateItem<T extends object>(
  collectionName: CollectionName,
  docId: string,
  changes: Partial<T>
): Promise<void> {
  const ref = doc(db, collectionName, docId);
  try {
    await updateDoc(ref, { ...changes, updatedAt: serverTimestamp() });
  } catch (e) {
    console.error(`[firestore] updateItem error (${collectionName}/${docId}):`, e);
    throw e;
  }
}

// ─── Clear document (overwrite with empty/default data) ───────────────────────
export async function clearDoc<T extends object>(
  collectionName: CollectionName,
  docId: string,
  emptyData: T
): Promise<void> {
  const ref = doc(db, collectionName, docId);
  try {
    await setDoc(ref, { ...emptyData, updatedAt: serverTimestamp() });
  } catch (e) {
    console.error(`[firestore] clearDoc error (${collectionName}/${docId}):`, e);
    throw e;
  }
}

// ─── Delete item from collection ───────────────────────────────────────────────
export async function deleteItem(
  collectionName: CollectionName,
  docId: string
): Promise<void> {
  const ref = doc(db, collectionName, docId);
  try {
    await deleteDoc(ref);
  } catch (e) {
    console.error(`[firestore] deleteItem error (${collectionName}/${docId}):`, e);
    throw e;
  }
}
// ─── Realtime subscription (onSnapshot) ───────────────────────────────────────
// ─── Realtime subscription for a whole collection ─────────────────────────────
export function subscribeCollection<T>(
  collectionName: CollectionName,
  onData: (data: T[]) => void
): () => void {
  const ref = collection(db, collectionName);
  const unsub = onSnapshot(
    ref,
    (snap) => {
      onData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as T)));
    },
    (err) => {
      console.error(`[firestore] subscribeCollection error:`, err);
      onData([]);
    }
  );
  return unsub;
}

export function subscribeDoc<T>(
  collectionName: CollectionName,
  docId: string,
  fallback: T,
  onData: (data: T) => void
): () => void {
  const ref = doc(db, collectionName, docId);
  const unsub = onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) { onData(fallback); return; }
      onData(snap.data() as T);
    },
    (err) => {
      console.error(`[firestore] subscribeDoc error:`, err);
      onData(fallback);
    }
  );
  return unsub; // call to unsubscribe
}