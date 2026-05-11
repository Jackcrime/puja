"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User, Church } from "lucide-react";
import { useAuthors } from "@/lib/hooks/useFirestoreData";
import { useI18n } from "@/lib/hooks/useI18n";

interface AuthorModalProps {
  code: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthorModal({ code, open, onOpenChange }: AuthorModalProps) {
  const { t } = useI18n();
  const { data: AUTHORS } = useAuthors();
  const author = AUTHORS[code];

  if (!author) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-serif" style={{ color: "var(--brand)" }}>
            {t("janjihidup.author")}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-5 py-2">
          {/* Avatar / Photo */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-white font-serif font-bold text-xl" style={{ backgroundColor: "var(--brand)" }}>
              {author.photoUrl
                ? <img src={author.photoUrl} alt={author.name} className="w-full h-full object-cover" />
                : code.charAt(0)
              }
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: "var(--gold)" }}>Inisial: {code}</p>
              {author.title && (
                <p className="text-xs text-muted-foreground">{author.title}</p>
              )}
              <p className="font-serif font-bold text-base mt-0.5" style={{ color: "var(--brand)" }}>
                {author.title ? `${author.title}. ${author.name}` : author.name}
              </p>
            </div>
          </div>

          {/* Ministry */}
          <div className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: "var(--brand-muted)" }}>
            <Church className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--brand)" }} />
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-0.5">{t("janjihidup.ministry")}</p>
              <p className="text-sm font-medium" style={{ color: "var(--brand)" }}>{author.ministry}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}