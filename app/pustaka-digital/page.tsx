"use client";

import React, { useState, useMemo, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePustakaBooks, type PustakaBook } from "@/lib/hooks/useFirestoreData";

const CATEGORIES = ["Semua", "BUKU", "MATERI", "PANDUAN"];
const PUSTAKA_PER_PAGE = 6;
import { useI18n } from "@/lib/hooks/useI18n";
import {
  Search, Library, Download, Eye, FileText, BookOpen, File,
  ChevronLeft, ChevronRight, CheckSquare, Square, X, FileDown,
} from "lucide-react";

const categoryIcons: Record<string, React.ElementType> = {
  BUKU: BookOpen,
  MATERI: FileText,
  PANDUAN: File,
};

function downloadFile(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export default function PustakaDigital() {
  const { t } = useI18n();
  const { data: PUSTAKA_BOOKS, loading } = usePustakaBooks();
  const [search, setSearch]     = useState("");
  const [category, setCategory] = useState("Semua");
  const [page, setPage]         = useState(1);
  const [preview, setPreview]   = useState<PustakaBook | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Multi-select
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelected(new Set(PUSTAKA_BOOKS.map((b) => b.id)));
  }, [PUSTAKA_BOOKS]);

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  const bulkDownload = useCallback(() => {
    PUSTAKA_BOOKS
      .filter((b) => selected.has(b.id) && b.fileUrl)
      .forEach((b, i) => {
        setTimeout(() => downloadFile(b.fileUrl!, `${b.title}.pdf`), i * 300);
      });
  }, [PUSTAKA_BOOKS, selected]);

  const filtered = useMemo(() => {
    setPage(1);
    return PUSTAKA_BOOKS.filter((b) => {
      const matchSearch =
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.description.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === "Semua" || b.category === category;
      return matchSearch && matchCat;
    });
  }, [search, category, PUSTAKA_BOOKS]);

  const totalPages = Math.ceil(filtered.length / PUSTAKA_PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PUSTAKA_PER_PAGE, page * PUSTAKA_PER_PAGE);
  const selectedWithFile = PUSTAKA_BOOKS.filter((b) => selected.has(b.id) && b.fileUrl);

  return (
    <AppLayout>
      {/* Preview / PDF Dialog */}
      <Dialog open={!!preview} onOpenChange={(o) => { if (!o) { setPreview(null); setPdfLoading(false); } }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          {preview && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif leading-snug pr-6" style={{ color: "var(--brand)" }}>
                  {preview.title}
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3 overflow-y-auto flex-1 py-2">
                <div className="flex flex-wrap gap-2">
                  <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full border"
                    style={{ color: "var(--gold)", borderColor: "var(--gold-border)", backgroundColor: "var(--gold-muted)" }}>
                    {preview.category}
                  </span>
                  <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground">{preview.year}</span>
                  <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground">{preview.pages} {t("pustaka.pages")}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{preview.description}</p>

                <div className="flex gap-3 pt-1">
                  {preview.fileUrl && (
                    <a href={preview.fileUrl} target="_blank" rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-colors hover:bg-muted"
                      style={{ borderColor: "var(--brand)", color: "var(--brand)" }}>
                      <Eye className="h-4 w-4" /> {t("pustaka.view")}
                    </a>
                  )}
                  {preview.fileUrl && (
                    <button onClick={() => downloadFile(preview.fileUrl!, `${preview.title}.pdf`)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors hover:opacity-90"
                      style={{ backgroundColor: "var(--brand)" }}>
                      <Download className="h-4 w-4" /> {t("pustaka.download")}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <div className="max-w-3xl mx-auto px-4 pt-8 pb-24">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Library className="h-5 w-5" style={{ color: "var(--gold)" }} />
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "var(--gold)" }}>Perpustakaan Digital</p>
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl mb-2" style={{ color: "var(--brand)" }}>{t("pustaka.title")}</h1>
          <p className="text-muted-foreground text-sm">{t("pustaka.subtitle")}</p>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder={t("pustaka.search")}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 transition-shadow"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => setCategory(cat)}
                className="shrink-0 px-4 py-1.5 rounded-full border text-sm font-semibold transition-colors"
                style={category === cat
                  ? { backgroundColor: "var(--brand)", color: "white", borderColor: "var(--brand)" }
                  : { borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>
                {cat === "Semua" ? t("common.all") : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Count + select all */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-muted-foreground font-medium">
            {loading ? "Memuat..." : `${filtered.length} ${t("pustaka.found")}`}
          </p>
          {!loading && PUSTAKA_BOOKS.length > 0 && (
            <button onClick={selected.size === PUSTAKA_BOOKS.length ? clearSelection : selectAll}
              className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
              style={{ color: "var(--brand)" }}>
              {selected.size === PUSTAKA_BOOKS.length
                ? <><CheckSquare className="h-3.5 w-3.5" /> Batal pilih semua</>
                : <><Square className="h-3.5 w-3.5" /> Pilih semua</>}
            </button>
          )}
        </div>

        {/* Book List */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-[var(--brand)]" />
            <span className="text-sm">Memuat dokumen...</span>
          </div>
        ) : paginated.length > 0 ? (
          <>
            <div className="flex flex-col gap-3 mb-6">
              {paginated.map((book) => {
                const Icon = categoryIcons[book.category] || FileText;
                const isSelected = selected.has(book.id);
                return (
                  <div key={book.id} onClick={() => toggleSelect(book.id)}
                    className="bg-card border rounded-xl p-5 hover:shadow-sm hover:-translate-y-0.5 transition-all cursor-pointer"
                    style={{ borderColor: isSelected ? "var(--brand)" : "hsl(var(--border))", backgroundColor: isSelected ? "var(--brand-muted)" : "" }}>
                    <div className="flex gap-3">
                      <div className="shrink-0 flex items-start pt-1">
                        {isSelected
                          ? <CheckSquare className="h-4 w-4" style={{ color: "var(--brand)" }} />
                          : <Square className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--brand-muted)" }}>
                        <Icon className="h-5 w-5" style={{ color: "var(--brand)" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md border"
                            style={{ color: "var(--gold)", borderColor: "var(--gold-border)", backgroundColor: "var(--gold-muted)" }}>
                            {book.category}
                          </span>
                          <span className="text-xs text-muted-foreground">{book.year}</span>
                          <span className="text-xs text-muted-foreground">{book.pages} {t("pustaka.pages")}</span>
                        </div>
                        <h3 className="font-serif font-semibold text-base mb-1.5 leading-snug" style={{ color: "var(--brand)" }}>{book.title}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-3">{book.description}</p>
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => setPreview(book)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors hover:bg-muted"
                            style={{ borderColor: "var(--brand)", color: "var(--brand)" }}>
                            <Eye className="h-3.5 w-3.5" /> {t("pustaka.view")}
                          </button>
                          {book.fileUrl && (
                            <button onClick={() => downloadFile(book.fileUrl!, `${book.title}.pdf`)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors hover:opacity-90"
                              style={{ backgroundColor: "var(--brand)" }}>
                              <Download className="h-3.5 w-3.5" /> {t("pustaka.download")}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground disabled:opacity-40 hover:bg-muted transition-colors disabled:cursor-not-allowed">
                  <ChevronLeft className="h-4 w-4" /> {t("pustaka.previous")}
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button key={i} onClick={() => setPage(i + 1)}
                      className="w-9 h-9 rounded-lg text-sm font-semibold transition-colors"
                      style={page === i + 1
                        ? { backgroundColor: "var(--brand)", color: "white" }
                        : { color: "hsl(var(--muted-foreground))", backgroundColor: "transparent" }}>
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground disabled:opacity-40 hover:bg-muted transition-colors disabled:cursor-not-allowed">
                  {t("pustaka.next")} <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Library className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">{t("pustaka.notFound")}</p>
            <p className="text-sm mt-1">{t("pustaka.notFoundSub")}</p>
          </div>
        )}
      </div>

      {/* Floating selection bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border border-border bg-card">
          <span className="text-sm font-semibold" style={{ color: "var(--brand)" }}>
            {selected.size} dipilih
          </span>
          <div className="w-px h-4 bg-border" />
          <button onClick={bulkDownload} disabled={selectedWithFile.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-40"
            style={{ backgroundColor: "var(--brand)" }}>
            <FileDown className="h-4 w-4" />
            Download {selectedWithFile.length > 1 ? `${selectedWithFile.length} file` : "file"}
          </button>
          <button onClick={clearSelection}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </AppLayout>
  );
}