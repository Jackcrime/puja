import { NextRequest, NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";
import { getAuth } from "firebase-admin/auth";
import { initAdminApp } from "@/lib/firebase-admin";

const utapi = new UTApi();

// Ekstrak file key dari UploadThing URL
// Contoh URL: https://utfs.io/f/ABC123xyz  → "ABC123xyz"
//             https://xyz.ufs.sh/f/ABC123xyz → "ABC123xyz"
function extractFileKey(url: string): string | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/");
    const key = parts[parts.length - 1];
    return key && key.length > 0 ? key : null;
  } catch {
    return null;
  }
}

export async function DELETE(req: NextRequest) {
  // Verifikasi admin token Firebase
  const token = req.headers.get("authorization")?.replace("Bearer ", "")?.trim();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const adminApp = initAdminApp();
    await getAuth(adminApp).verifyIdToken(token);
  } catch {
    return NextResponse.json({ error: "Unauthorized: token tidak valid" }, { status: 401 });
  }

  // Ambil URL dari body
  let urls: string[];
  try {
    const body = await req.json();
    // Bisa terima satu URL (string) atau array URL
    urls = Array.isArray(body.urls) ? body.urls : [body.url].filter(Boolean);
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  if (urls.length === 0) {
    return NextResponse.json({ error: "Tidak ada URL yang diberikan" }, { status: 400 });
  }

  // Ekstrak file keys dari URLs
  const fileKeys = urls.map(extractFileKey).filter(Boolean) as string[];
  if (fileKeys.length === 0) {
    return NextResponse.json({ error: "URL tidak valid" }, { status: 400 });
  }

  try {
    await utapi.deleteFiles(fileKeys);
    console.log("[uploadthing/delete] Berhasil hapus file keys:", fileKeys);
    return NextResponse.json({ success: true, deleted: fileKeys.length });
  } catch (err) {
    console.error("[uploadthing/delete] Gagal hapus file:", err);
    return NextResponse.json({ error: "Gagal menghapus file dari UploadThing" }, { status: 500 });
  }
}