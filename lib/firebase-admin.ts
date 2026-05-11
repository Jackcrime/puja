// ─── Firebase Admin SDK ─────────────────────────────────────────────────────
// SERVER-SIDE ONLY.

import { getApps, initializeApp, cert, type App } from "firebase-admin/app";

export function initAdminApp(): App {
  const existing = getApps().find((a) => a.name === "admin");
  if (existing) return existing;

  const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!rawKey) {
    throw new Error(
      "[firebase-admin] FIREBASE_SERVICE_ACCOUNT_KEY belum di-set di .env.local"
    );
  }

  let serviceAccount: Record<string, string>;
  try {
    serviceAccount = JSON.parse(rawKey);
  } catch {
    throw new Error(
      "[firebase-admin] FIREBASE_SERVICE_ACCOUNT_KEY bukan JSON yang valid. " +
      "Pastikan sudah di-minify jadi satu baris tanpa newline sungguhan."
    );
  }

  // Fix: kalau private_key masih punya literal \\n (double-escaped), convert ke \n
  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
  }

  return initializeApp({ credential: cert(serviceAccount as any) }, "admin");
}