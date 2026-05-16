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
  | "ayat_nats";

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
  try {
    const ref = doc(db, collectionName, docId);
    await setDoc(ref, { ...data, updatedAt: serverTimestamp() });
  } catch (e) {
    console.error(`[firestore] writeDoc error:`, e);
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
  try {
    const ref = collection(db, collectionName);
    const docRef = await addDoc(ref, { ...data, createdAt: serverTimestamp() });
    return docRef.id;
  } catch (e) {
    console.error(`[firestore] addItem error:`, e);
    return "";
  }
}

// ─── Update item in collection ─────────────────────────────────────────────────
export async function updateItem<T extends object>(
  collectionName: CollectionName,
  docId: string,
  changes: Partial<T>
): Promise<void> {
  try {
    const ref = doc(db, collectionName, docId);
    await updateDoc(ref, { ...changes, updatedAt: serverTimestamp() });
  } catch (e) {
    console.error(`[firestore] updateItem error:`, e);
  }
}

// ─── Clear document (overwrite with empty/default data) ───────────────────────
export async function clearDoc<T extends object>(
  collectionName: CollectionName,
  docId: string,
  emptyData: T
): Promise<void> {
  try {
    const ref = doc(db, collectionName, docId);
    await setDoc(ref, { ...emptyData, updatedAt: serverTimestamp() });
  } catch (e) {
    console.error(`[firestore] clearDoc error:`, e);
  }
}

// ─── Delete item from collection ───────────────────────────────────────────────
export async function deleteItem(
  collectionName: CollectionName,
  docId: string
): Promise<void> {
  try {
    const ref = doc(db, collectionName, docId);
    await deleteDoc(ref);
  } catch (e) {
    console.error(`[firestore] deleteItem error:`, e);
  }
}
// ─── Realtime subscription (onSnapshot) ───────────────────────────────────────
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
