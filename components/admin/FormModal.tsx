"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check } from "lucide-react";

export interface FieldDef {
  key:          string;
  label:        string;
  type?:        "text" | "textarea" | "select" | "number" | "multi-select";
  placeholder?: string;
  options?:     { value: string; label: string; group?: string }[];
  required?:    boolean;
  rows?:        number;
}

interface FormModalProps {
  children?:     React.ReactNode;
  open:          boolean;
  onOpenChange:  (open: boolean) => void;
  title:         string;
  fields:        FieldDef[];
  values:        Record<string, any>;
  onChange:      (key: string, value: any) => void;
  onSubmit:      () => void;
  submitLabel?:  string;
  isEdit?:       boolean;
}

export function FormModal({
  open, onOpenChange, title, fields, values, onChange,
  onSubmit, submitLabel, isEdit, children,
}: FormModalProps) {
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSubmit(); };

  // Helper: toggle item di array (untuk multi-select)
  const toggleMulti = (key: string, val: string) => {
    const current: string[] = Array.isArray(values[key]) ? values[key] : [];
    onChange(key, current.includes(val)
      ? current.filter((v) => v !== val)
      : [...current, val]
    );
  };

  // Group options berdasarkan field `group`
  const groupOptions = (options: FieldDef["options"] = []) => {
    const groups: Record<string, typeof options> = {};
    options.forEach((opt) => {
      const g = opt.group ?? "";
      if (!groups[g]) groups[g] = [];
      groups[g].push(opt);
    });
    return groups;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif" style={{ color: "var(--brand)" }}>
            {isEdit ? `Edit ${title}` : `Tambah ${title}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          {fields.map((field) => (
            <div key={field.key} className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--gold)" }}>
                {field.label}
                {field.required && <span className="text-red-500 ml-0.5">*</span>}
              </label>

              {field.type === "textarea" ? (
                <textarea
                  rows={field.rows ?? 4}
                  placeholder={field.placeholder}
                  value={values[field.key] ?? ""}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  required={field.required}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1 resize-none"
                />

              ) : field.type === "select" ? (
                <select
                  value={values[field.key] ?? ""}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  required={field.required}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
                >
                  <option value="">Pilih...</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>

              ) : field.type === "multi-select" ? (
                // ── Multi-select dengan checkboxes, grouped ──────────────────
                <div className="border border-border rounded-lg overflow-hidden">
                  {field.options?.length === 0 ? (
                    <p className="text-xs text-muted-foreground px-3 py-3 italic">
                      Belum ada pilihan tersedia.
                    </p>
                  ) : (
                    <div className="max-h-52 overflow-y-auto divide-y divide-border">
                      {Object.entries(groupOptions(field.options)).map(([group, opts]) => (
                        <div key={group}>
                          {group && (
                            <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-muted/40 text-muted-foreground">
                              {group}
                            </p>
                          )}
                          {opts.map((opt) => {
                            const selected = (Array.isArray(values[field.key]) ? values[field.key] : []).includes(opt.value);
                            return (
                              <label
                                key={opt.value}
                                className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors text-sm ${
                                  selected ? "bg-brand/5" : "hover:bg-muted/40"
                                }`}
                              >
                                {/* Custom checkbox */}
                                <div
                                  className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                                    selected ? "border-transparent" : "border-border"
                                  }`}
                                  style={selected ? { backgroundColor: "var(--brand)" } : {}}
                                >
                                  {selected && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                                </div>
                                <span className={selected ? "font-medium" : "text-muted-foreground"}>
                                  {opt.label}
                                </span>
                                <input
                                  type="checkbox"
                                  className="hidden"
                                  checked={selected}
                                  onChange={() => toggleMulti(field.key, opt.value)}
                                />
                              </label>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Badge count */}
                  {Array.isArray(values[field.key]) && values[field.key].length > 0 && (
                    <div className="px-3 py-2 border-t border-border bg-muted/20">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-bold" style={{ color: "var(--brand)" }}>
                          {values[field.key].length}
                        </span> dipilih
                      </p>
                    </div>
                  )}
                </div>

              ) : (
                <input
                  type={field.type ?? "text"}
                  placeholder={field.placeholder}
                  value={values[field.key] ?? ""}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  required={field.required}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-1"
                />
              )}
            </div>
          ))}

          {children}

          <div className="flex gap-2 pt-2 justify-end">
            <button type="button" onClick={() => onOpenChange(false)}
              className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
              Batal
            </button>
            <button type="submit"
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "var(--brand)" }}>
              {submitLabel ?? (isEdit ? "Simpan Perubahan" : "Tambah")}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}