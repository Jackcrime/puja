import React from "react";
import Link from "next/link";
import { Youtube, Facebook, Instagram, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t bg-card mt-auto py-10 no-print">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <p className="font-serif font-semibold text-foreground mb-1">Gereja Kristen Protestan di Bali</p>
            <p className="text-sm text-muted-foreground">Sinode GKPB — Bali, Indonesia</p>
          </div>
          <div className="flex items-center gap-3">
            {[
              { icon: Youtube, label: "YouTube GKPB", href: "https://www.youtube.com/@sinodegkpb" },
              { icon: Facebook, label: "Facebook GKPB", href: "fb://facewebmodal/f?href=https://www.facebook.com/61566909179740" },
              { icon: Instagram, label: "Instagram GKPB", href: "https://www.instagram.com/sinodegkpb" },
              { icon: Phone, label: "Whatsapp GKPB", href: "https://wa.me/628213141064" },
            ].map(({ icon: Icon, label, href }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground transition-colors hover:text-white"
                style={{ '--hover-bg': 'var(--brand)' } as any}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--brand)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--brand)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = ''; (e.currentTarget as HTMLElement).style.borderColor = ''; }}
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        <div className="border-t mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Sinode GKPB. Hak cipta dilindungi.</p>
          <div className="flex items-center gap-4">
            <Link href="/tentang" className="hover:text-foreground transition-colors">Tentang</Link>
            <a href="https://pujidanjanji.balichurchsynod.org/kebijakan-privasi" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Kebijakan Privasi</a>
            <a href="https://wa.me/628213141064" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Kontak</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
