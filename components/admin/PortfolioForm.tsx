"use client";

import { useState } from "react";
import type { PortfolioCompany, PortfolioCompanyInput } from "@/lib/portfolio";

interface Props {
  company: PortfolioCompany | null;
  saving: boolean;
  onSave: (data: PortfolioCompanyInput) => Promise<void>;
  onClose: () => void;
}

const VERTICALS = [
  "Fleet Software", "EV & Charging", "Logistics", "Ride-hailing",
  "Mobility Fintech", "ADAS & Safety", "MaaS", "Urban Mobility", "Other",
];

const STAGES = ["Pre-seed", "Seed", "Series A", "Series B+", "Growth"];

export default function PortfolioForm({ company, saving, onSave, onClose }: Props) {
  const [form, setForm] = useState<PortfolioCompanyInput>({
    name: company?.name || "",
    description: company?.description || "",
    website: company?.website || "",
    vertical: company?.vertical || "",
    stage: company?.stage || "",
    country: company?.country || "",
    investmentYear: company?.investmentYear ?? undefined,
    logoUrl: company?.logoUrl || "",
    visible: company?.visible ?? false,
  });

  function set(field: keyof PortfolioCompanyInput, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <>
      <div style={s.overlay} onClick={onClose} />
      <div style={s.drawer}>
        <div style={s.header}>
          <h2 style={s.title}>{company ? "Edit company" : "Add company"}</h2>
          <button onClick={onClose} style={s.closeBtn}>✕</button>
        </div>

        <form
          style={s.form}
          onSubmit={async (e) => { e.preventDefault(); await onSave(form); }}
        >
          <div style={s.body}>
            <Field label="Company name *">
              <input
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                style={s.input}
                placeholder="Startup Inc."
              />
            </Field>

            <Field label="Description">
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={3}
                style={{ ...s.input, resize: "vertical" }}
                placeholder="One-line description of what they do..."
              />
            </Field>

            <Field label="Logo URL">
              <input
                type="url"
                value={form.logoUrl}
                onChange={(e) => set("logoUrl", e.target.value)}
                style={s.input}
                placeholder="https://..."
              />
              {form.logoUrl && (
                <img
                  src={form.logoUrl}
                  alt="Preview"
                  style={{ width: 48, height: 48, objectFit: "contain", marginTop: 8, borderRadius: 8, background: "#0c0e14" }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              )}
            </Field>

            <Field label="Website">
              <input
                type="url"
                value={form.website}
                onChange={(e) => set("website", e.target.value)}
                style={s.input}
                placeholder="https://..."
              />
            </Field>

            <div style={s.twoCol}>
              <Field label="Vertical">
                <select value={form.vertical} onChange={(e) => set("vertical", e.target.value)} style={s.select}>
                  <option value="">Select...</option>
                  {VERTICALS.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </Field>

              <Field label="Stage">
                <select value={form.stage} onChange={(e) => set("stage", e.target.value)} style={s.select}>
                  <option value="">Select...</option>
                  {STAGES.map((st) => <option key={st} value={st}>{st}</option>)}
                </select>
              </Field>
            </div>

            <div style={s.twoCol}>
              <Field label="Country">
                <input
                  value={form.country}
                  onChange={(e) => set("country", e.target.value)}
                  style={s.input}
                  placeholder="Mexico"
                />
              </Field>

              <Field label="Investment year">
                <input
                  type="number"
                  value={form.investmentYear ?? ""}
                  onChange={(e) => set("investmentYear", e.target.value ? parseInt(e.target.value) : undefined)}
                  style={s.input}
                  placeholder="2024"
                  min={2020}
                  max={2040}
                />
              </Field>
            </div>

            <div style={s.visibleRow}>
              <label style={s.checkLabel}>
                <input
                  type="checkbox"
                  checked={form.visible}
                  onChange={(e) => set("visible", e.target.checked)}
                  style={{ marginRight: 10 }}
                />
                <span>
                  <strong style={{ color: "#eef1f6" }}>Show on landing page</strong>
                  <br />
                  <span style={{ fontSize: "12px", color: "rgba(238,241,246,0.4)" }}>
                    When enabled, this company appears in the portfolio section of moov.vc
                  </span>
                </span>
              </label>
            </div>
          </div>

          <div style={s.footer}>
            <button type="button" onClick={onClose} style={s.cancelBtn} disabled={saving}>
              Cancel
            </button>
            <button type="submit" style={s.saveBtn} disabled={saving}>
              {saving ? "Saving..." : company ? "Save changes" : "Add company"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ fontSize: "13px", fontWeight: 500, color: "rgba(238,241,246,0.6)" }}>{label}</label>
      {children}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100 },
  drawer: {
    position: "fixed", top: 0, right: 0, bottom: 0, width: "480px", maxWidth: "100vw",
    background: "#07080d", borderLeft: "1px solid rgba(255,255,255,0.09)",
    zIndex: 101, display: "flex", flexDirection: "column",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "24px", borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  title: { fontSize: "18px", fontWeight: 700, color: "#eef1f6", margin: 0 },
  closeBtn: {
    background: "transparent", border: "none", color: "rgba(238,241,246,0.4)",
    fontSize: "18px", cursor: "pointer", padding: "4px 8px",
  },
  form: { display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" },
  body: { padding: "24px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "20px" },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  input: {
    background: "#0c0e14", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px",
    padding: "10px 14px", fontSize: "14px", color: "#eef1f6", outline: "none",
  },
  select: {
    background: "#0c0e14", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px",
    padding: "10px 14px", fontSize: "14px", color: "#eef1f6", outline: "none",
  },
  visibleRow: {
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "10px", padding: "16px",
  },
  checkLabel: { display: "flex", alignItems: "flex-start", gap: "0", cursor: "pointer", fontSize: "13px", color: "rgba(238,241,246,0.6)" },
  footer: {
    padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.08)",
    display: "flex", justifyContent: "flex-end", gap: "12px",
  },
  cancelBtn: {
    padding: "10px 20px", background: "transparent",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px",
    fontSize: "14px", color: "rgba(238,241,246,0.5)", cursor: "pointer",
  },
  saveBtn: {
    padding: "10px 24px", background: "#2f6dff", color: "#fff",
    border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer",
  },
};
