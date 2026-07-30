"use client";

import { useState } from "react";
import { COLUMNA_LABEL, TIPO_TAREA_LABEL } from "./TareaCard";
import type { Tarea } from "@/lib/portfolio/portfolioSchemas";

export interface TareaFormValues {
  proyecto: string;
  startup: string;
  tipo_tarea: Tarea["tipo_tarea"];
  tarea: string;
  descripcion: string;
  proxima_accion: string;
  nivel_importancia: Tarea["nivel_importancia"];
  nivel_urgencia: Tarea["nivel_urgencia"];
  columna_kanban: Tarea["columna_kanban"];
  responsable: string;
  fecha_limite: string | null;
  confidencial: boolean;
  etiquetas: string[];
}

function valuesFromTarea(t: Tarea): TareaFormValues {
  return {
    proyecto: t.proyecto,
    startup: t.startup,
    tipo_tarea: t.tipo_tarea,
    tarea: t.tarea,
    descripcion: t.descripcion,
    proxima_accion: t.proxima_accion,
    nivel_importancia: t.nivel_importancia,
    nivel_urgencia: t.nivel_urgencia,
    columna_kanban: t.columna_kanban,
    responsable: t.responsable,
    fecha_limite: t.fecha_limite,
    confidencial: t.confidencial,
    etiquetas: t.etiquetas,
  };
}

const EMPTY_VALUES: TareaFormValues = {
  proyecto: "",
  startup: "",
  tipo_tarea: "compromiso_propio",
  tarea: "",
  descripcion: "",
  proxima_accion: "",
  nivel_importancia: "media",
  nivel_urgencia: "sin_urgencia_definida",
  columna_kanban: "pendiente",
  responsable: "",
  fecha_limite: null,
  confidencial: false,
  etiquetas: [],
};

interface TareaFormModalProps {
  tarea: Tarea | null; // null = creating a new tarea
  onClose: () => void;
  onSave: (values: TareaFormValues, id: string | null) => Promise<void>;
}

export default function TareaFormModal({ tarea, onClose, onSave }: TareaFormModalProps) {
  const [values, setValues] = useState<TareaFormValues>(tarea ? valuesFromTarea(tarea) : EMPTY_VALUES);
  const [etiquetasText, setEtiquetasText] = useState(tarea ? tarea.etiquetas.join(", ") : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof TareaFormValues>(key: K, value: TareaFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.proyecto.trim() || !values.tarea.trim()) {
      setError("Proyecto y título de la tarea son obligatorios.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const etiquetas = etiquetasText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      await onSave({ ...values, etiquetas }, tarea?.id ?? null);
    } catch {
      setError("No se pudo guardar la tarea. Intenta de nuevo.");
      setSaving(false);
    }
  }

  return (
    <div style={s.backdrop} onMouseDown={onClose}>
      <form
        style={s.modal}
        onMouseDown={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2 style={s.title}>{tarea ? "Editar tarea" : "Nueva tarea"}</h2>

        <div style={s.row}>
          <label style={s.field}>
            <span style={s.label}>Proyecto *</span>
            <input
              style={s.input}
              value={values.proyecto}
              onChange={(e) => update("proyecto", e.target.value)}
              placeholder="MOOV / Portafolio"
              required
            />
          </label>
          <label style={s.field}>
            <span style={s.label}>Startup</span>
            <input
              style={s.input}
              value={values.startup}
              onChange={(e) => update("startup", e.target.value)}
            />
          </label>
        </div>

        <label style={s.field}>
          <span style={s.label}>Título *</span>
          <input
            style={s.input}
            value={values.tarea}
            onChange={(e) => update("tarea", e.target.value)}
            required
          />
        </label>

        <label style={s.field}>
          <span style={s.label}>Descripción</span>
          <textarea
            style={s.textarea}
            value={values.descripcion}
            onChange={(e) => update("descripcion", e.target.value)}
            rows={3}
          />
        </label>

        <label style={s.field}>
          <span style={s.label}>Próxima acción</span>
          <input
            style={s.input}
            value={values.proxima_accion}
            onChange={(e) => update("proxima_accion", e.target.value)}
          />
        </label>

        <div style={s.row}>
          <label style={s.field}>
            <span style={s.label}>Tipo</span>
            <select
              style={s.input}
              value={values.tipo_tarea}
              onChange={(e) => update("tipo_tarea", e.target.value as Tarea["tipo_tarea"])}
            >
              {(Object.keys(TIPO_TAREA_LABEL) as Tarea["tipo_tarea"][]).map((tipo) => (
                <option key={tipo} value={tipo}>
                  {TIPO_TAREA_LABEL[tipo]}
                </option>
              ))}
            </select>
          </label>
          <label style={s.field}>
            <span style={s.label}>Estado (columna)</span>
            <select
              style={s.input}
              value={values.columna_kanban}
              onChange={(e) => update("columna_kanban", e.target.value as Tarea["columna_kanban"])}
            >
              {(Object.keys(COLUMNA_LABEL) as Tarea["columna_kanban"][]).map((col) => (
                <option key={col} value={col}>
                  {COLUMNA_LABEL[col]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={s.row}>
          <label style={s.field}>
            <span style={s.label}>Importancia</span>
            <select
              style={s.input}
              value={values.nivel_importancia}
              onChange={(e) => update("nivel_importancia", e.target.value as Tarea["nivel_importancia"])}
            >
              <option value="alta">🔴 Alta</option>
              <option value="media">🟡 Media</option>
              <option value="baja">⚪ Baja</option>
            </select>
          </label>
          <label style={s.field}>
            <span style={s.label}>Urgencia</span>
            <select
              style={s.input}
              value={values.nivel_urgencia}
              onChange={(e) => update("nivel_urgencia", e.target.value as Tarea["nivel_urgencia"])}
            >
              <option value="inmediata">🔺 Inmediata</option>
              <option value="esta_semana">🟠 Esta semana</option>
              <option value="este_mes">🔵 Este mes</option>
              <option value="sin_urgencia_definida">⚪ Sin urgencia definida</option>
            </select>
          </label>
        </div>

        <div style={s.row}>
          <label style={s.field}>
            <span style={s.label}>Responsable</span>
            <input
              style={s.input}
              value={values.responsable}
              onChange={(e) => update("responsable", e.target.value)}
            />
          </label>
          <label style={s.field}>
            <span style={s.label}>Fecha límite</span>
            <input
              type="date"
              style={s.input}
              value={values.fecha_limite ?? ""}
              onChange={(e) => update("fecha_limite", e.target.value || null)}
            />
          </label>
        </div>

        <label style={s.field}>
          <span style={s.label}>Etiquetas (separadas por coma)</span>
          <input
            style={s.input}
            value={etiquetasText}
            onChange={(e) => setEtiquetasText(e.target.value)}
            placeholder="legal, ronda, urgente"
          />
        </label>

        <label style={s.checkboxRow}>
          <input
            type="checkbox"
            checked={values.confidencial}
            onChange={(e) => update("confidencial", e.target.checked)}
            style={s.checkbox}
          />
          🔒 Sensible / confidencial
        </label>

        {error && <p style={s.error}>{error}</p>}

        <div style={s.actions}>
          <button type="button" onClick={onClose} style={s.cancelBtn} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" style={s.saveBtn} disabled={saving}>
            {saving ? "Guardando..." : tarea ? "Guardar cambios" : "Crear tarea"}
          </button>
        </div>
      </form>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "40px 16px",
    overflowY: "auto",
    zIndex: 100,
  },
  modal: {
    background: "#0c0e14",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "16px",
    padding: "24px",
    width: "100%",
    maxWidth: "560px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  title: { fontSize: "18px", fontWeight: 700, color: "#eef1f6", margin: 0 },
  row: { display: "flex", gap: "12px", flexWrap: "wrap" },
  field: { display: "flex", flexDirection: "column", gap: "6px", flex: "1 1 200px" },
  label: { fontSize: "12px", fontWeight: 600, color: "rgba(238,241,246,0.55)" },
  input: {
    background: "#050506",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    padding: "9px 12px",
    fontSize: "13px",
    color: "#eef1f6",
    outline: "none",
  },
  textarea: {
    background: "#050506",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    padding: "9px 12px",
    fontSize: "13px",
    color: "#eef1f6",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
  },
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    color: "rgba(238,241,246,0.75)",
    cursor: "pointer",
  },
  checkbox: { width: "14px", height: "14px", cursor: "pointer" },
  error: {
    fontSize: "13px",
    color: "#ff5a5a",
    background: "rgba(255,90,90,0.08)",
    border: "1px solid rgba(255,90,90,0.25)",
    borderRadius: "10px",
    padding: "10px 14px",
    margin: 0,
  },
  actions: { display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "4px" },
  cancelBtn: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "8px",
    padding: "9px 16px",
    fontSize: "13px",
    color: "rgba(238,241,246,0.7)",
    cursor: "pointer",
  },
  saveBtn: {
    background: "#2f6dff",
    border: "none",
    borderRadius: "8px",
    padding: "9px 18px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#fff",
    cursor: "pointer",
  },
};
