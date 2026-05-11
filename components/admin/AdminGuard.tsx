"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthChange } from "@/lib/admin/auth";
import { Loader2 } from "lucide-react";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router  = useRouter();
  const [state, setState] = useState<"loading" | "authed" | "rejected">("loading");

  useEffect(() => {
    // onAuthChange waits for Firebase Auth to restore session
    const unsub = onAuthChange((user) => {
      if (user) { setState("authed"); }
      else      { setState("rejected"); router.replace("/admin/login"); }
    });
    return () => unsub();
  }, [router]);

  if (state === "loading")  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
  if (state === "rejected") return null;
  return <>{children}</>;
}
