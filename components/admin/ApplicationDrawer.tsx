"use client";

import { useState } from "react";
import type { ApplicationRecord } from "@/lib/airtable";

interface Props {
  application: ApplicationRecord;
  allStatuses: string[];
  onClose: () => void;
  onStatusChange: (id: string, status: string) => Promise<void>;
  onNotesChange: (id: string, notes: string) => Promise<void>;
}

function fmt(n: number): string {
  if (!n) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function Row({ label, value }: { label: string; value: string | number | undefined | null }) {
  if (!value && value !== 0) return null;
  return (
    <div style={s.row}>
      <span style={s.rowLabel}>{label}</span>
      <span style={s.rowValue}>{String(value)}</span>
    </div>
  );
}

export default function ApplicationDrawer({ application: a, allStatuses, onClose, onStatusChange, onNotesChange }: Props) {
  const [notes, setNotes] = useState(a.notes || "");
  const [saving, setSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);

  async function saveNotes() {
    setSaving(true);
    await onNotesChange(a.id, notes);
    setSaving(false);
  }

  async function changeStatus(s: string) {
    setStatusSaving(true);
    await onStatusChange(a.id, s);
    setStatusSaving(false);
  }

  return (
    <>
      <div style={s.overlay} onClick={onClose} />
      <div style={s.drawer}>
        <div style={s.drawerHeader}>
          <div>
            <h2 style={s.drawerTitle}>{a.startupName}</h2>
            <p style={s.drawerSub}>{a.founderName} · {a.country}</p>
          </div>
          <button onClick={onClose} style={s.closeBtn} aria-label="Close">✕</button>
        </div>

        <div style={s.body}>
          {/* Status selector */}
          <div style={s.section}>
            <p style={s.sectionLabel}>Status</p>
            <div style={s.statusGrid}>
              {allStatuses.map((st) => (
                <button
                  key={st}
                  onClick={() => changeStatus(st)}
                  disabled={statusSaving}
                  style={{
                    ...s.statusBtn,
                    ...(a.status === st ? s.statusBtnActive : {}),
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div style={s.section}>
            <p style={s.sectionLabel}>Contact</p>
            <Row label="Email" value={a.email} />
            <a href={`mailto:${a.email}`} style={s.actionLink}>Send email →</a>
            {a.linkedinUrl && (
              <a href={a.linkedinUrl} target="_blank" rel="noopener noreferrer" style={s.actionLink}>
                LinkedIn →
              </a>
            )}
          </div>

          {/* Company */}
          <div style={s.section}>
            <p style={s.sectionLabel}>Company</p>
            <Row label="Website" value={a.website} />
            <Row label="Vertical" value={a.vertical} />
            <Row label="Sales model" value={a.salesModel} />
            <Row label="Product stage" value={a.productStage} />
            <Row label="Co-founders" value={a.numberOfCoFounders} />
            <Row label="Team size" value={a.teamSize} />
            {a.website && (
              <a href={a.website} target="_blank" rel="noopener noreferrer" style={s.actionLink}>
                Visit website →
              </a>
            )}
          </div>

          {/* Description */}
          {a.companyDescription && (
            <div style={s.section}>
              <p style={s.sectionLabel}>Description</p>
              <p style={s.desc}>{a.companyDescription}</p>
            </div>
          )}

          {/* Financials */}
          <div style={s.section}>
            <p style={s.sectionLabel}>Financials</p>
            <Row label="Net revenue LTM" value={fmt(a.netRevenueLTM)} />
            <Row label="Last month revenue" value={fmt(a.lastMonthNetRevenue)} />
            <Row label="Total raised" value={fmt(a.totalCapitalRaised)} />
          </div>

          {/* Round */}
          <div style={s.section}>
            <p style={s.sectionLabel}>Round</p>
            <Row label="Stage" value={a.roundStage} />
            <Row label="Instrument" value={a.instrument} />
            <Row label="Round size" value={fmt(a.roundSize)} />
            <Row label="Pre-money / CAP" value={fmt(a.preMoneyValuationCap)} />
            {a.discountRate != null && <Row label="Discount rate" value={`${a.discountRate}%`} />}
            {a.interestRate != null && <Row label="Interest rate" value={`${a.interestRate}%`} />}
            {a.pitchDeckLink && (
              <a href={a.pitchDeckLink} target="_blank" rel="noopener noreferrer" style={{ ...s.actionLink, marginTop: "8px" }}>
                View pitch deck →
              </a>
            )}
          </div>

          {/* Source */}
          <div style={s.section}>
            <p style={s.sectionLabel}>Source</p>
            <Row label="How did they find us" value={a.howDidYouFindUs} />
            <Row label="Submitted" value={a.submittedAt ? new Date(a.submittedAt).toLocaleString("es-MX") : ""} />
          </div>

          {/* Notes */}
          <div style={s.section}>
            <p style={s.sectionLabel}>Internal notes</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              placeholder="Add internal notes about this application..."
              style={s.textarea}
            />
            <button onClick={saveNotes} disabled={saving} style={s.saveBtn}>
              {saving ? "Saving..." : "Save notes"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

const s: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100,
  },
  drawer: {
    position: "fixed", top: 0, right: 0, bottom: 0, width: "440px", maxWidth: "100vw",
    background: "#07080d", borderLeft: "1px solid rgba(255,255,255,0.09)",
    zIndex: 101, overflowY: "auto", display: "flex", flexDirection: "column",
  },
  drawerHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    padding: "24px", borderBottom: "1px solid rgba(255,255,255,0.08)",
    position: "sticky", top: 0, background: "#07080d", zIndex: 10,
  },
  drawerTitle: { fontSize: "20px", fontWeight: 700, color: "#eef1f6", margin: "0 0 4px" },
  drawerSub: { fontSize: "13px", color: "rgba(238,241,246,0.45)", margin: 0 },
  closeBtn: {
    background: "transparent", border: "none", color: "rgba(238,241,246,0.4)",
    fontSize: "18px", cursor: "pointer", padding: "4px 8px",
  },
  body: { padding: "8px 24px 40px", flex: 1 },
  section: { borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "20px", marginBottom: "20px" },
  sectionLabel: {
    fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
    color: "#2f6dff", margin: "0 0 12px",
  },
  row: { display: "flex", justifyContent: "space-between", gap: "16px", marginBottom: "8px" },
  rowLabel: { fontSize: "13px", color: "rgba(238,241,246,0.45)", flexShrink: 0 },
  rowValue: { fontSize: "13px", color: "#eef1f6", textAlign: "right", wordBreak: "break-word" },
  actionLink: {
    display: "inline-block", fontSize: "13px", color: "#2f6dff",
    textDecoration: "none", marginTop: "6px", marginRight: "16px",
  },
  desc: { fontSize: "13px", color: "rgba(238,241,246,0.65)", lineHeight: "1.6", margin: 0 },
  statusGrid: { display: "flex", flexWrap: "wrap", gap: "8px" },
  statusBtn: {
    padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 500,
    background: "transparent", border: "1px solid rgba(255,255,255,0.12)",
    color: "rgba(238,241,246,0.5)", cursor: "pointer",
  },
  statusBtnActive: {
    background: "rgba(47,109,255,0.12)", border: "1px solid rgba(47,109,255,0.35)", color: "#2f6dff",
  },
  textarea: {
    width: "100%", background: "#0c0e14", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "#eef1f6",
    outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: "1.5",
  },
  saveBtn: {
    marginTop: "10px", padding: "8px 20px", background: "#2f6dff", color: "#fff",
    border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
  },
};
