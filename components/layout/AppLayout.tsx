"use client";

import React, { useEffect } from "react";
import { Header } from "./Header";
import { Banner } from "./Banner";
import { Footer } from "./Footer";
import { BottomNav } from "./BottomNav";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { InstallPrompt } from "@/components/ui/InstallPrompt";
import { initNotifications } from "@/lib/notifications";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  useEffect(() => {
    // Re-jadwalkan notifikasi setiap kali app dibuka
    initNotifications();
  }, []);

  return (
    <div className="min-h-[100dvh] flex flex-col w-full">
      <OfflineIndicator />
      <Header />
      <Banner />
      <main className="flex-1 w-full pb-20 md:pb-8">{children}</main>
      <Footer />
      <BottomNav />
      <InstallPrompt />
    </div>
  );
}
