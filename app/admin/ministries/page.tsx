"use client";

import React, { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { DataTable } from "@/components/admin/DataTable";
import { FormModal } from "@/components/admin/FormModal";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useMinistries, type Ministry } from "@/lib/hooks/useSupabaseData";
import { Loader2 } from "lucide-react";
import { showToast } from "@/lib/utils/toast";

const EMPTY = { id: "", name: "", category: "" };

const CATEGORY_OPTIONS = [
  { value: "Badan Sinode",    label: "Badan Sinode"    },
  { value: "Kota Denpasar",   label: "Kota Denpasar"   },
  { value: "Badung Utara",    label: "Badung Utara"    },
  { value: "Badung Selatan",  label: "Badung Selatan"  },
  { value: "Bali Timur",      label: "Bali Timur"      },
  { value: "Bali Timur Laut", label: "Bali Timur Laut" },
  { value: "Buleleng",        label: "Buleleng"        },
  { value: "Jembrana",        label: "Jembrana"        },
  { value: "Tabanan",         label: "Tabanan"         },
  { value: "Kategorial",      label: "Kategorial"      },
];

// Badge warna per kategori
const CATEGORY_COLOR: Record<string, string> = {
  "Badan Sinode":    "var(--gold)",
  "Kota Denpasar":   "var(--brand)",
  "Badung Utara":    "#0891b2",
  "Badung Selatan":  "#0e7490",
  "Bali Timur":      "#7c3aed",
  "Bali Timur Laut": "#6d28d9",
  "Buleleng":        "#059669",
  "Jembrana":        "#d97706",
  "Tabanan":         "#b45309",
  "Kategorial":      "#6b7280",
};

export default function AdminMinistries() {
  const { data, loading, add, update, remove } = useMinistries();

  const [modal,   setModal]   = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [editing, setEditing] = useState<Ministry | null>(null);
  const [form,    setForm]    = useState(EMPTY);
  const [target,  setTarget]  = useState<Ministry | null>(null);
  const [search,  setSearch]  = useState("");

  const openAdd    = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit   = (m: Ministry) => { setEditing(m); setForm(m); setModal(true); };
  const openDelete = (m: Ministry) => { setTarget(m); setConfirm(true); };

  const handleSubmit = async () => {
    const isEdit = !!editing;
    setModal(false);
    try {
      if (isEdit) {
        await update(editing!.id, { name: form.name, category: form.category });
        showToast.success(`Unit Pelayanan "${form.name}" berhasil diperbarui.`);
      } else {
        await add({ name: form.name, category: form.category });
        showToast.success(`Unit Pelayanan "${form.name}" berhasil ditambahkan.`);
      }
    } catch {
      showToast.error("Gagal menyimpan. Coba lagi.");
    }
  };

  const handleDelete = async () => {
    if (!target) return;
    const name = target.name;
    setTarget(null);
    try {
      await remove(target.id);
      showToast.success(`Unit Pelayanan "${name}" berhasil dihapus.`);
    } catch {
      showToast.error("Gagal menghapus. Coba lagi.");
    }
  };

  const filtered = data.filter((m) =>
    !search ||
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.category.toLowerCase().includes(search.toLowerCase())
  );

  // Group untuk info sidebar
  const groups = CATEGORY_OPTIONS.map((cat) => ({
    label: cat.label,
    count: data.filter((m) => m.category === cat.label).length,
    color: CATEGORY_COLOR[cat.label] ?? "var(--muted-foreground)",
  })).filter((g) => g.count > 0);

  return (
    <AdminGuard>
      <AdminLayout title="Unit Pelayanan">
        <div className="flex flex-col lg:flex-row gap-5">

          {/* ── Tabel utama ─────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            <div className="mb-4 flex items-center gap-3">
              <p className="text-sm text-muted-foreground">
                {loading ? "Memuat..." : `${data.length} unit pelayanan`}
              </p>
              {!loading && (
                <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 px-2 py-0.5 rounded-full font-semibold">
                  Live Supabase
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex items-center gap-3 text-muted-foreground py-10">
                <Loader2 className="h-5 w-5 animate-spin" /> Memuat data...
              </div>
            ) : (
              <DataTable
                columns={[
                  {
                    key: "category", label: "Kategori", width: "140px",
                    render: (m) => (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{
                          color: CATEGORY_COLOR[m.category] ?? "var(--muted-foreground)",
                          backgroundColor: `${CATEGORY_COLOR[m.category] ?? "#888"}18`,
                        }}>
                        {m.category}
                      </span>
                    ),
                  },
                  {
                    key: "name", label: "Nama Unit Pelayanan",
                    render: (m) => <span className="font-medium">{m.name}</span>,
                  },
                ]}
                data={filtered}
                onAdd={openAdd}
                onEdit={openEdit}
                onDelete={openDelete}
                addLabel="Tambah Unit"
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Cari nama atau kategori..."
                emptyText="Belum ada unit pelayanan."
              />
            )}
          </div>

          {/* ── Sidebar ringkasan ────────────────────────────────────────── */}
          {!loading && groups.length > 0 && (
            <div className="lg:w-52 shrink-0">
              <div className="bg-card border border-border rounded-xl p-4 sticky top-20">
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--gold)" }}>
                  Ringkasan
                </p>
                <div className="space-y-2.5">
                  {groups.map((g) => (
                    <div key={g.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
                        <span className="text-xs text-muted-foreground">{g.label}</span>
                      </div>
                      <span className="text-xs font-bold" style={{ color: g.color }}>{g.count}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium">Total</span>
                    <span className="text-sm font-bold" style={{ color: "var(--brand)" }}>{data.length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <FormModal
          open={modal}
          onOpenChange={setModal}
          title="Unit Pelayanan"
          isEdit={!!editing}
          fields={[
            {
              key: "category", label: "Kategori", type: "select", required: true,
              options: CATEGORY_OPTIONS,
            },
            { key: "name", label: "Nama Unit", placeholder: "Jemaat Singaraja", required: true },
          ]}
          values={form}
          onChange={(k, v) => setForm((f) => ({ ...f, [k]: v }))}
          onSubmit={handleSubmit}
        />

        <ConfirmDialog
          open={confirm}
          onOpenChange={setConfirm}
          description={`Hapus "${target?.name}"? Penulis yang terhubung ke unit ini perlu di-update manual.`}
          onConfirm={handleDelete}
        />
      </AdminLayout>
    </AdminGuard>
  );
}