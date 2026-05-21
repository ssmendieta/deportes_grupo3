import { useState } from "react";
import { descargarReporte } from "../services/reporteService";

export type FiltroConfig = {
  name: string;
  label: string;
  type: "select" | "date";
  options?: { value: string; label: string }[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  endpoint: string;
  nombreArchivoBase: string;
  filtrosConfig: FiltroConfig[];
  filtrosActuales: Record<string, unknown>;
};

function ReporteFilterModal({
  open,
  onClose,
  endpoint,
  nombreArchivoBase,
  filtrosConfig,
  filtrosActuales,
}: Props) {
  const [filtros, setFiltros] = useState<Record<string, unknown>>(filtrosActuales);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleExportar = async (formato: "pdf" | "excel") => {
    setCargando(true);
    setError(null);
    try {
      await descargarReporte(endpoint, formato, filtros, nombreArchivoBase);
      onClose();
    } catch {
      setError("Error al descargar el archivo. Intente de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <section className="modal-card" style={{ backgroundColor: "#fff" }}>
        <button className="modal-close" onClick={onClose}>
          ×
        </button>

        <h2>Exportar reporte</h2>
        <p>Ajusta los filtros antes de exportar.</p>

        <div className="form-grid">
          {filtrosConfig.map((cfg) => (
            <label key={cfg.name} className="field">
              <span>{cfg.label}</span>
              {cfg.type === "select" && cfg.options ? (
                <select
                  value={String(filtros[cfg.name] ?? "")}
                  onChange={(e) =>
                    setFiltros((prev) => ({ ...prev, [cfg.name]: e.target.value }))
                  }
                >
                  {cfg.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="date"
                  value={String(filtros[cfg.name] ?? "")}
                  onChange={(e) =>
                    setFiltros((prev) => ({ ...prev, [cfg.name]: e.target.value }))
                  }
                />
              )}
            </label>
          ))}
        </div>

        {error && <div className="form-error full">{error}</div>}

        <hr style={{ margin: "24px 0 16px", border: "none", borderTop: "1px solid #e0e0e0" }} />

        <div className="form-actions full" style={{ justifyContent: "flex-end", gap: 10 }}>
          <button className="btn btn-ghost" type="button" onClick={onClose} disabled={cargando}>
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            type="button"
            disabled={cargando}
            onClick={() => handleExportar("pdf")}
          >
            {cargando ? "Generando..." : "Exportar PDF"}
          </button>
          <button
            className="btn btn-primary"
            type="button"
            disabled={cargando}
            onClick={() => handleExportar("excel")}
          >
            {cargando ? "Generando..." : "Exportar Excel"}
          </button>
        </div>
      </section>
    </div>
  );
}

export default ReporteFilterModal;