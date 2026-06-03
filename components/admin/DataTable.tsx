"use client";

import React, { useState } from "react";
import { Pencil, Trash2, Plus, ChevronLeft, ChevronRight, Search } from "lucide-react";

export interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T extends { id: string | number }> {
  columns: Column<T>[];
  data: T[];
  onAdd?: () => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onBulkDelete?: (ids: (string | number)[]) => void;
  bulkDeleteLabel?: string;
  addLabel?: string;
  emptyText?: string;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
  /** Jumlah baris per halaman. Default: 15 */
  pageSize?: number;
  /** Elemen filter tambahan (select, dll) yang dirender di toolbar */
  filters?: React.ReactNode;
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  onAdd,
  onEdit,
  onDelete,
  onBulkDelete,
  bulkDeleteLabel,
  addLabel = "Tambah",
  emptyText = "Belum ada data.",
  searchValue,
  onSearchChange,
  searchPlaceholder = "Cari...",
  pageSize = 15,
  filters,
}: DataTableProps<T>) {
  const [page,     setPage]     = useState(1);
  const [selected, setSelected] = useState<Set<string | number>>(new Set());

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const start      = (safePage - 1) * pageSize;
  const pageData   = data.slice(start, start + pageSize);

  const pageIds    = pageData.map((r) => r.id);
  const allChecked = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const someChecked= pageIds.some((id) => selected.has(id)) && !allChecked;

  const toggleRow  = (id: string | number) => setSelected((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const togglePage = () => {
    if (allChecked) {
      setSelected((prev) => { const next = new Set(prev); pageIds.forEach((id) => next.delete(id)); return next; });
    } else {
      setSelected((prev) => { const next = new Set(prev); pageIds.forEach((id) => next.add(id)); return next; });
    }
  };

  const clearSelection = () => setSelected(new Set());

  const handleSearch = (v: string) => {
    onSearchChange?.(v);
    setPage(1);
  };

  const showCheckbox = !!onBulkDelete;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border flex-wrap">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {onSearchChange ? (
            <div className="relative min-w-[160px] max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue ?? ""}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1"
              />
            </div>
          ) : null}
          {filters}
        </div>

        {onAdd && (
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 shrink-0"
            style={{ backgroundColor: "var(--brand)" }}
          >
            <Plus className="h-4 w-4" />
            {addLabel}
          </button>
        )}
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {showCheckbox && (
                <th className="px-4 py-3 w-10">
                  <button
                    onClick={togglePage}
                    className="w-4 h-4 rounded border-2 flex items-center justify-center transition-all"
                    style={{
                      borderColor:     allChecked || someChecked ? "var(--brand)" : "var(--border)",
                      backgroundColor: allChecked ? "var(--brand)" : "transparent",
                    }}
                  >
                    {allChecked   && <span className="text-white text-[10px] font-black leading-none">✓</span>}
                    {someChecked  && <span className="w-2 h-0.5 rounded-full" style={{ backgroundColor: "var(--brand)" }} />}
                  </button>
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground"
                  style={{ width: col.width }}
                >
                  {col.label}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground w-24">
                  Aksi
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {pageData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (showCheckbox ? 2 : 1)}
                  className="px-4 py-12 text-center text-muted-foreground text-sm"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              pageData.map((row) => {
                const isChecked = selected.has(row.id);
                return (
                  <tr
                    key={row.id}
                    className={`transition-colors ${isChecked ? "bg-red-50 dark:bg-red-950/15" : "hover:bg-muted/30"}`}
                  >
                    {showCheckbox && (
                      <td className="px-4 py-3 w-10" onClick={() => toggleRow(row.id)}>
                        <div
                          className="w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer transition-all"
                          style={{
                            borderColor:     isChecked ? "#dc2626" : "var(--border)",
                            backgroundColor: isChecked ? "#dc2626" : "transparent",
                          }}
                        >
                          {isChecked && <span className="text-white text-[10px] font-black leading-none">✓</span>}
                        </div>
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={String(col.key)} className="px-4 py-3 text-sm align-top">
                        {col.render ? col.render(row) : String((row as any)[col.key] ?? "—")}
                      </td>
                    ))}
                    {(onEdit || onDelete) && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {onEdit && (
                            <button
                              onClick={() => onEdit(row)}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                              aria-label="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(row)}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                              aria-label="Hapus"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Bulk delete action bar ────────────────────────────────────────── */}
      {showCheckbox && selected.size > 0 && (
        <div className="sticky bottom-0 flex items-center justify-between gap-3 px-5 py-3 border-t border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20">
          <p className="text-xs font-semibold text-red-700 dark:text-red-400">
            {selected.size} item dipilih
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={clearSelection}
              className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground"
            >
              Batal
            </button>
            <button
              onClick={() => { onBulkDelete?.([...selected]); clearSelection(); }}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg text-white hover:opacity-90 transition-all"
              style={{ backgroundColor: "#dc2626" }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {bulkDeleteLabel ?? `Hapus ${selected.size} Item`}
            </button>
          </div>
        </div>
      )}

      {/* ── Footer: count + pagination ────────────────────────────────────── */}
      <div className="px-4 py-2.5 border-t border-border bg-muted/20 flex items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          {data.length === 0
            ? "0 item"
            : `${start + 1}–${Math.min(start + pageSize, data.length)} dari ${data.length} item`}
        </p>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors"
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="text-xs text-muted-foreground px-1 tabular-nums">
              {safePage} / {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors"
              aria-label="Halaman berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}