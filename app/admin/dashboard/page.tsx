"use client";

import { useState, useEffect, useCallback } from "react";
import type { ApplicationRecord } from "@/lib/airtable";
import AdminNav from "@/components/admin/AdminNav";
import ApplicationDrawer from "@/components/admin/ApplicationDrawer";

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  New: { bg: "rgba(47,109,255,0.12)", color: "#2f6dff", border: "rgba(47,109,255,0.25)" },
  "In Review": { bg: "rgba(255,195,0,0.12)", color: "#ffc300", border: "rgba(255,195,0,0.25)" },
  "Intro Call": { bg: "rgba(100,200,120,0.12)", color: "#64c878", border: "rgba(100,200,120,0.25)" },
  "Due Diligence": { bg: "rgba(180,100,255,0.12)", color: "#b464ff", border: "rgba(180,100,255,0.25)" },
  "Term Sheet": { bg: "rgba(0,200,180,0.12)", color: "#00c8b4", border: "rgba(0,200,180,0.25)" },
  Invested: { bg: "rgba(40,200,80,0.12)", color: "#28c850", border: "rgba(40,200,80,0.25)" },
  Passed: { bg: "rgba(150,150,150,0.12)", color: "#969696", border: "rgba(150,150,150,0.25)" },
  "On Hold": { bg: "rgba(255,140,0,0.12)", color: "#ff8c00", border: "rgba(255,140,0,0.25)" },
};

const ALL_STATUSES = Object.keys(STATUS_COLORS);

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS["New"];
  return (
    <span style={{
      fontSize: "11px", fontWeight: 600, padding: "3px 9px",
      borderRadius: "20px", whiteSpace: "nowrap",
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
    }}>
      {status}
    </span>
  );
}

function fmt(n: number): string {
  if (!n) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export default function DashboardPage() {
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selected, setSelected] = useState<ApplicationRecord | null>(null);

  const fetchApplications = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/applications");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setApplications(data.applications);
    } catch {
      setError("Could not load applications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const filtered = applications.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      a.startupName.toLowerCase().includes(q) ||
      a.founderName.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.country.toLowerCase().includes(q) ||
      a.vertical.toLowerCase().includes(q);
    const matchStatus = filterStatus === "All" || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = applications.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  async function handleStatusChange(id: string, newStatus: string) {
    await fetch(`/api/admin/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setApplications((prev) =>
      prev.map((a) => a.id === id ? { ...a, status: newStatus } : a)
    );
    if (selected?.id === id) {
      setSelected((s) => s ? { ...s, status: newStatus } : s);
    }
  }

  return (
    <div style={s.page}>
      <AdminNav active="dashboard" />

      <main style={s.main}>
        <div style={s.header}>
          <div>
            <h1 style={s.title}>Applications</h1>
            <p style={s.subtitle}>{applications.length} total · {counts["New"] || 0} new</p>
          </div>
        </div>

        {/* Status summary pills */}
        <div style={s.statusRow}>
          {["All", ...ALL_STATUSES].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              style={{
                ...s.pill,
                ...(filterStatus === st ? s.pillActive : {}),
              }}
            >
              {st} {st !== "All" && counts[st] ? <span style={s.pillCount}>{counts[st]}</span> : null}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={s.searchRow}>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search startup, founder, country..."
            style={s.search}
          />
        </div>

        {/* Table */}
        {loading ? (
          <p style={s.empty}>Loading...</p>
        ) : error ? (
          <p style={{ ...s.empty, color: "#ff5a5a" }}>{error}</p>
        ) : filtered.length === 0 ? (
          <p style={s.empty}>No applications match your filter.</p>
        ) : (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  {["Startup", "Founder", "Country", "Vertical", "Stage", "Round", "Status", "Date"].map((h) => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => setSelected(a)}
                    style={s.tr}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ ...s.td, fontWeight: 600, color: "#eef1f6" }}>{a.startupName}</td>
                    <td style={s.td}>{a.founderName}</td>
                    <td style={s.td}>{a.country}</td>
                    <td style={s.td}>{a.vertical}</td>
                    <td style={s.td}>{a.roundStage}</td>
                    <td style={s.td}>{fmt(a.roundSize)}</td>
                    <td style={s.td}><StatusBadge status={a.status} /></td>
                    <td style={{ ...s.td, color: "rgba(238,241,246,0.4)", fontSize: "12px" }}>
                      {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short" }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {selected && (
        <ApplicationDrawer
          application={selected}
          allStatuses={ALL_STATUSES}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
          onNotesChange={async (id, notes) => {
            await fetch(`/api/admin/applications/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ notes }),
            });
            setApplications((prev) =>
              prev.map((a) => a.id === id ? { ...a, notes } : a)
            );
            setSelected((s) => s ? { ...s, notes } : s);
          }}
        />
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#050506", color: "#eef1f6" },
  main: { maxWidth: "1280px", margin: "0 auto", padding: "32px 24px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" },
  title: { fontSize: "26px", fontWeight: 700, color: "#eef1f6", margin: "0 0 4px" },
  subtitle: { fontSize: "14px", color: "rgba(238,241,246,0.45)", margin: 0 },
  statusRow: { display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" },
  pill: {
    padding: "5px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: 500,
    background: "transparent", border: "1px solid rgba(255,255,255,0.12)",
    color: "rgba(238,241,246,0.55)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
  },
  pillActive: {
    background: "rgba(47,109,255,0.12)", border: "1px solid rgba(47,109,255,0.35)",
    color: "#2f6dff",
  },
  pillCount: {
    background: "rgba(255,255,255,0.1)", borderRadius: "20px",
    padding: "1px 7px", fontSize: "11px",
  },
  searchRow: { marginBottom: "20px" },
  search: {
    width: "100%", maxWidth: "400px", padding: "10px 14px",
    background: "#0c0e14", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px", color: "#eef1f6", fontSize: "14px", outline: "none",
    boxSizing: "border-box",
  },
  tableWrap: { overflowX: "auto", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 600,
    color: "rgba(238,241,246,0.4)", letterSpacing: "0.06em", textTransform: "uppercase",
    borderBottom: "1px solid rgba(255,255,255,0.08)", whiteSpace: "nowrap",
  },
  tr: { cursor: "pointer", transition: "background 0.1s" },
  td: {
    padding: "14px 16px", fontSize: "13px", color: "rgba(238,241,246,0.7)",
    borderBottom: "1px solid rgba(255,255,255,0.05)", whiteSpace: "nowrap",
  },
  empty: { color: "rgba(238,241,246,0.4)", padding: "40px 0", textAlign: "center" },
};
