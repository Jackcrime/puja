"use client";

import React, { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";

export function OfflineIndicator() {
  const [status, setStatus] = useState<"online" | "offline" | "back">("online");

  useEffect(() => {
    const handleOffline = () => setStatus("offline");
    const handleOnline = () => {
      setStatus("back");
      setTimeout(() => setStatus("online"), 3000);
    };

    if (!navigator.onLine) setStatus("offline");

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (status === "online") return null;

  return (
    <div
      className="w-full text-white text-xs font-semibold py-1.5 px-4 flex items-center justify-center gap-2 transition-all no-print"
      style={{ backgroundColor: status === "offline" ? "#374151" : "#16a34a" }}
    >
      {status === "offline" ? (
        <>
          <WifiOff className="h-3.5 w-3.5" />
          Tidak ada koneksi — mode offline aktif
        </>
      ) : (
        <>
          <Wifi className="h-3.5 w-3.5" />
          Koneksi kembali
        </>
      )}
    </div>
  );
}
