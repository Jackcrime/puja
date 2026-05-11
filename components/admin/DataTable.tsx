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
  addLabel = "Tambah",
  emptyText = "Belum ada data.",
  searchValue,
  onSearchChange,
  searchPlaceholder = "Cari...",
  pageSize = 15,
  filters,
}: DataTableProps<T>) {
  const [page, setPage] = useState(1);

  // Reset ke halaman 1 saat data berubah (search/filter)
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageData = data.slice(start, start + pageSize);

  const handleSearch = (v: string) => {
    onSearchChange?.(v);
    setPage(1);
  };

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
                  colSpan={columns.length + 1}
                  className="px-4 py-12 text-center text-muted-foreground text-sm"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              pageData.map((row) => (
                <tr key={row.id} className="hover:bg-muted/30 transition-colors">
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
              ))
            )}
          </tbody>
        </table>
      </div>

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