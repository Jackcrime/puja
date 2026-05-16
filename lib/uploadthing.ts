import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getAuth } from "firebase-admin/auth";
import { initAdminApp } from "@/lib/firebase-admin";

const f = createUploadthing();

async function verifyAdmin(req: Request): Promise<{ uid: string }> {
  const token = req.headers.get("authorization")?.replace("Bearer ", "")?.trim();

  if (!token) {
    throw new Error("Unauthorized: tidak ada token");
  }

  let adminApp;
  try {
    adminApp = initAdminApp();
  } catch (e) {
    // Error ini akan muncul di terminal Next.js — mudah di-debug
    console.error("[uploadthing] Firebase Admin init gagal:", e);
    throw new Error("Server configuration error");
  }

  try {
    const decoded = await getAuth(adminApp).verifyIdToken(token);
    return { uid: decoded.uid };
  } catch (e) {
    console.error("[uploadthing] verifyIdToken gagal:", e);
    throw new Error("Unauthorized: token tidak valid");
  }
}

export const uploadRouter = {

  pustakaUploader: f({ pdf: { maxFileSize: "32MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => verifyAdmin(req))
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("[uploadthing] pustaka uploaded:", file.name, "uid:", metadata.uid);
      return { url: file.ufsUrl, name: file.name, size: file.size };
    }),

  audioUploader: f({ "audio/webm": { maxFileSize: "64MB", maxFileCount: 1 }, audio: { maxFileSize: "64MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => verifyAdmin(req))
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("[uploadthing] audio uploaded:", file.name, "uid:", metadata.uid);
      return { url: file.ufsUrl, name: file.name, size: file.size };
    }),

  imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => verifyAdmin(req))
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("[uploadthing] image uploaded:", file.name, "uid:", metadata.uid);
      return { url: file.ufsUrl, name: file.name, size: file.size };
    }),

} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;