"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import { Search, X, User, Check, ChevronDown } from "lucide-react";
import type { AuthorsMap } from "@/lib/hooks/useFirestoreData";

interface Props {
  value:       string;           // authorCode yang sedang dipilih
  authors:     AuthorsMap;
  loading?:    boolean;
  onChange:    (code: string) => void;
}

export function AuthorPicker({ value, authors, loading, onChange }: Props) {
  const [open,   setOpen]   = useState(false);
  const [query,  setQuery]  = useState("");
  const inputRef            = useRef<HTMLInputElement>(null);
  const modalRef            = useRef<HTMLDivElement>(null);

  // Fokus ke search saat modal buka
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60);
  }, [open]);

  // Tutup modal kalau klik di luar
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Tutup dengan Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const entries = useMemo(() =>
    Object.entries(authors).map(([code, a]) => ({ code, ...a }))
  , [authors]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((a) => {
      const fullName  = `${a.title ?? ""} ${a.name}`.toLowerCase();
      const codeMatch = a.code.toLowerCase().includes(q);
      const nameMatch = fullName.includes(q);
      return codeMatch || nameMatch;
    });
  }, [entries, query]);

  const selected = value ? authors[value] : null;

  const handleSelect = (code: string) => {
    onChange(code);
    setQuery("");
    setOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 h-11 px-3 rounded-xl border border-border bg-muted/30 text-sm text-muted-foreground animate-pulse">
        <div className="w-6 h-6 rounded-full bg-muted" />
        <div className="h-3 w-28 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* ── Trigger button ─────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-background hover:bg-muted/40 transition-colors text-left"
      >
        {/* Avatar */}
        <div className="relative w-8 h-8 rounded-lg shrink-0 overflow-hidden flex items-center justify-center text-xs font-bold text-white"
          style={{ backgroundColor: "var(--brand)" }}>
          {selected?.photoUrl ? (
            <Image src={selected.photoUrl} alt={selected.name} fill sizes="32px" className="object-cover" />
          ) : selected ? (
            value.charAt(0)
          ) : (
            <User className="h-4 w-4 text-white/70" />
          )}
        </div>

        {/* Label */}
        <div className="flex-1 min-w-0">
          {selected ? (
            <>
              <p className="text-sm font-semibold truncate" style={{ color: "var(--brand)" }}>
                {selected.title ? `${selected.title}. ` : ""}{selected.name}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                Kode: <span className="font-bold">{value}</span>
                {selected.ministry && ` · ${selected.ministry}`}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">— Pilih penulis —</p>
          )}
        </div>

        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
      </button>

      {/* ── Modal ──────────────────────────────────────────────── */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm">
          <div
            ref={modalRef}
            className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden"
            style={{ maxHeight: "80vh" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <p className="text-sm font-bold" style={{ color: "var(--brand)" }}>Pilih Penulis</p>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search bar */}
            <div className="px-4 py-3 border-b border-border shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari nama atau inisial..."
                  className="w-full pl-9 pr-9 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 transition-shadow"
                  style={{ "--tw-ring-color": "var(--brand)" } as any}
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5 pl-1">
                {filtered.length} dari {entries.length} penulis
              </p>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1">
              {/* Clear selection */}
              {value && (
                <button
                  onClick={() => handleSelect("")}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left border-b border-border"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center border-2 border-dashed border-border shrink-0">
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground italic">Hapus pilihan</p>
                </button>
              )}

              {filtered.length === 0 ? (
                <div className="text-center py-10 text-sm text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>Tidak ada penulis ditemukan</p>
                  <p className="text-xs mt-0.5">Coba nama lengkap atau kode inisial</p>
                </div>
              ) : (
                filtered.map((a) => {
                  const isSelected = a.code === value;
                  return (
                    <button
                      key={a.code}
                      onClick={() => handleSelect(a.code)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
                      style={isSelected ? { backgroundColor: "var(--brand-muted)" } : {}}
                    >
                      {/* Avatar */}
                      <div
                        className="relative w-9 h-9 rounded-xl shrink-0 overflow-hidden flex items-center justify-center text-sm font-bold text-white ring-2 ring-transparent transition-all"
                        style={{
                          backgroundColor: "var(--brand)",
                          ...(isSelected ? { ringColor: "var(--brand)" } : {}),
                        }}
                      >
                        {a.photoUrl ? (
                          <Image src={a.photoUrl} alt={a.name} fill sizes="36px" className="object-cover" />
                        ) : (
                          a.code.charAt(0)
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold truncate" style={{ color: isSelected ? "var(--brand)" : undefined }}>
                            {a.title ? `${a.title}. ` : ""}{a.name}
                          </p>
                          {/* Inisial badge */}
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0"
                            style={{
                              backgroundColor: isSelected ? "var(--brand)" : "var(--brand-muted)",
                              color:           isSelected ? "white" : "var(--brand)",
                            }}
                          >
                            {a.code}
                          </span>
                        </div>
                        {(a.ministry || (a.ministries && a.ministries.length > 0)) && (
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {a.ministry ?? a.ministries?.[0] ?? ""}
                          </p>
                        )}
                      </div>

                      {/* Check */}
                      {isSelected && (
                        <div className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--brand)" }}>
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}