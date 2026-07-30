"use client";

import { useState, useEffect, useCallback } from "react";
import type { PortfolioCompany, PortfolioCompanyInput } from "@/lib/portfolio";
import AdminNav from "@/components/admin/AdminNav";
import PortfolioForm from "@/components/admin/PortfolioForm";

export default function PortfolioPage() {
  const [companies, setCompanies] = useState<PortfolioCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PortfolioCompany | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/portfolio");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setCompanies(data.companies);
    } catch {
      setError("Could not load portfolio companies.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  async function handleSave(data: PortfolioCompanyInput) {
    setSaving(true);
    try {
      if (editing) {
        const res = await fetch(`/api/admin/portfolio/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to update");
        const json = await res.json();
        setCompanies((prev) => prev.map((c) => c.id === editing.id ? json.company : c));
      } else {
        const res = await fetch("/api/admin/portfolio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Failed to create");
        const json = await res.json();
        setCompanies((prev) => [...prev, json.company]);
      }
      setShowForm(false);
      setEditing(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error saving company");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleVisible(company: PortfolioCompany) {
    const res = await fetch(`/api/admin/portfolio/${company.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visible: !company.visible }),
    });
    if (res.ok) {
      const json = await res.json();
      setCompanies((prev) => prev.map((c) => c.id === company.id ? json.company : c));
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/portfolio/${id}`, { method: "DELETE" });
    setCompanies((prev) => prev.filter((c) => c.id !== id));
    setDeleteConfirm(null);
  }

  return (
    <div style={s.page}>
      <AdminNav active="portfolio" />

      <main style={s.main}>
        <div style={s.header}>
          <div>
            <h1 style={s.title}>Portfolio</h1>
            <p style={s.subtitle}>
              {companies.length} companies · {companies.filter((c) => c.visible).length} visible on landing
            </p>
          </div>
          <button onClick={() => { setEditing(null); setShowForm(true); }} style={s.addBtn}>
            + Add company
          </button>
        </div>

        {loading ? (
          <p style={s.empty}>Loading...</p>
        ) : error ? (
          <p style={{ ...s.empty, color: "#ff5a5a" }}>{error}</p>
        ) : companies.length === 0 ? (
          <div style={s.emptyState}>
            <p style={s.emptyTitle}>No portfolio companies yet</p>
            <p style={s.emptySub}>Add your first portfolio company to get started.</p>
            <button onClick={() => { setEditing(null); setShowForm(true); }} style={s.addBtn}>
              + Add first company
            </button>
          </div>
        ) : (
          <div style={s.grid}>
            {companies.map((company) => (
              <div key={company.id} style={s.card}>
                <div style={s.cardTop}>
                  {company.logoUrl ? (
                    <img
                      src={company.logoUrl}
                      alt={company.name}
                      style={s.logo}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <div style={s.logoPlaceholder}>
                      {company.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={s.visibleToggle}>
                    <button
                      onClick={() => handleToggleVisible(company)}
                      title={company.visible ? "Visible on landing — click to hide" : "Hidden — click to show"}
                      style={{
                        ...s.toggleBtn,
                        ...(company.visible ? s.toggleBtnOn : {}),
                      }}
                    >
                      {company.visible ? "● Visible" : "○ Hidden"}
                    </button>
                  </div>
                </div>

                <h3 style={s.companyName}>{company.name}</h3>
                {company.vertical && <p style={s.tag}>{company.vertical}</p>}
                {company.description && <p style={s.desc}>{company.description}</p>}

                <div style={s.meta}>
                  {company.stage && <span style={s.metaItem}>{company.stage}</span>}
                  {company.country && <span style={s.metaItem}>{company.country}</span>}
                  {company.investmentYear && <span style={s.metaItem}>{company.investmentYear}</span>}
                </div>

                <div style={s.actions}>
                  {company.website && (
                    <a href={company.website} target="_blank" rel="noopener noreferrer" style={s.actionLink}>
                      Website →
                    </a>
                  )}
                  <button onClick={() => { setEditing(company); setShowForm(true); }} style={s.editBtn}>
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(company.id)}
                    style={s.deleteBtn}
                  >
                    Delete
                  </button>
                </div>

                {deleteConfirm === company.id && (
                  <div style={s.deleteConfirm}>
                    <p style={{ margin: "0 0 10px", fontSize: "13px" }}>Delete {company.name}?</p>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => handleDelete(company.id)} style={s.confirmYes}>Delete</button>
                      <button onClick={() => setDeleteConfirm(null)} style={s.confirmNo}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {showForm && (
        <PortfolioForm
          company={editing}
          saving={saving}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#050506", color: "#eef1f6" },
  main: { maxWidth: "1280px", margin: "0 auto", padding: "32px 24px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" },
  title: { fontSize: "26px", fontWeight: 700, color: "#eef1f6", margin: "0 0 4px" },
  subtitle: { fontSize: "14px", color: "rgba(238,241,246,0.45)", margin: 0 },
  addBtn: {
    padding: "10px 20px", background: "#2f6dff", color: "#fff", border: "none",
    borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer",
  },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" },
  card: {
    background: "#07080d", border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "10px",
  },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  logo: { width: "48px", height: "48px", objectFit: "contain", borderRadius: "8px" },
  logoPlaceholder: {
    width: "48px", height: "48px", background: "rgba(47,109,255,0.12)",
    border: "1px solid rgba(47,109,255,0.2)", borderRadius: "8px",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "20px", fontWeight: 700, color: "#2f6dff",
  },
  visibleToggle: {},
  toggleBtn: {
    fontSize: "11px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px",
    border: "1px solid rgba(255,255,255,0.12)", background: "transparent",
    color: "rgba(238,241,246,0.4)", cursor: "pointer",
  },
  toggleBtnOn: {
    background: "rgba(40,200,80,0.1)", border: "1px solid rgba(40,200,80,0.3)", color: "#28c850",
  },
  companyName: { fontSize: "16px", fontWeight: 700, color: "#eef1f6", margin: 0 },
  tag: {
    fontSize: "11px", fontWeight: 600, color: "#2f6dff",
    background: "rgba(47,109,255,0.1)", border: "1px solid rgba(47,109,255,0.2)",
    borderRadius: "20px", padding: "2px 10px", alignSelf: "flex-start", margin: 0,
  },
  desc: { fontSize: "13px", color: "rgba(238,241,246,0.55)", lineHeight: "1.5", margin: 0, flexGrow: 1 },
  meta: { display: "flex", gap: "8px", flexWrap: "wrap" },
  metaItem: {
    fontSize: "11px", color: "rgba(238,241,246,0.4)",
    background: "rgba(255,255,255,0.05)", borderRadius: "4px", padding: "2px 8px",
  },
  actions: { display: "flex", gap: "8px", alignItems: "center", marginTop: "4px" },
  actionLink: { fontSize: "13px", color: "#2f6dff", textDecoration: "none" },
  editBtn: {
    fontSize: "12px", padding: "5px 12px", background: "transparent",
    border: "1px solid rgba(255,255,255,0.12)", borderRadius: "6px",
    color: "rgba(238,241,246,0.55)", cursor: "pointer",
  },
  deleteBtn: {
    fontSize: "12px", padding: "5px 12px", background: "transparent",
    border: "1px solid rgba(255,90,90,0.2)", borderRadius: "6px",
    color: "rgba(255,90,90,0.6)", cursor: "pointer",
  },
  deleteConfirm: {
    background: "rgba(255,90,90,0.08)", border: "1px solid rgba(255,90,90,0.2)",
    borderRadius: "8px", padding: "14px",
  },
  confirmYes: {
    padding: "6px 16px", background: "#ff5a5a", color: "#fff",
    border: "none", borderRadius: "6px", fontSize: "13px", cursor: "pointer",
  },
  confirmNo: {
    padding: "6px 16px", background: "transparent", color: "rgba(238,241,246,0.5)",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", fontSize: "13px", cursor: "pointer",
  },
  emptyState: { textAlign: "center", padding: "60px 0" },
  emptyTitle: { fontSize: "20px", fontWeight: 600, color: "rgba(238,241,246,0.6)", margin: "0 0 8px" },
  emptySub: { fontSize: "14px", color: "rgba(238,241,246,0.35)", margin: "0 0 24px" },
  empty: { color: "rgba(238,241,246,0.4)", padding: "40px 0", textAlign: "center" },
};
