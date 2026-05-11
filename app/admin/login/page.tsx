"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { login, onAuthChange } from "@/lib/admin/auth";
import { Shield, Eye, EyeOff, Lock, AlertCircle, Loader2 } from "lucide-react";

export default function AdminLogin() {
  const router   = useRouter();
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [checking, setChecking] = useState(true);

  // Kalau sudah login, langsung ke dashboard
  useEffect(() => {
    const unsub = onAuthChange((user) => {
      if (user) router.replace("/admin/dashboard");
      setChecking(false);
    });
    return () => unsub();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const ok = await login(password);
    if (ok) { router.push("/admin/dashboard"); }
    else    { setError("Password salah. Cek di Firebase Console → Authentication."); setLoading(false); setPassword(""); }
  };

  if (checking) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="h-1 w-full" style={{ backgroundColor: "var(--brand)" }} />
          <div className="p-8">
            <div className="flex flex-col items-center mb-8">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "var(--brand)" }}>
                <Shield className="h-7 w-7 text-white" />
              </div>
              <h1 className="font-serif font-bold text-xl" style={{ color: "var(--brand)" }}>Admin Panel</h1>
              <p className="text-sm text-muted-foreground mt-1">GKPB Puji dan Janji</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-1.5" style={{ color: "var(--gold)" }}>
                  Password Admin
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password Firebase Auth" required autoFocus
                    className="w-full pl-9 pr-10 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-1"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 dark:bg-red-950/20 px-3 py-2.5 rounded-xl">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading || !password}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ backgroundColor: "var(--brand)" }}
              >
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Memeriksa...</> : "Masuk"}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-border text-xs text-muted-foreground space-y-1">
              <p>Email: <code className="bg-muted px-1 rounded">{process.env.NEXT_PUBLIC_ADMIN_EMAIL || "—"}</code></p>
              <p>Password diatur di Firebase Console → Authentication → Users</p>
            </div>
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-4">
          <a href="/" className="hover:underline">← Kembali ke Aplikasi</a>
        </p>
      </div>
    </div>
  );
}
