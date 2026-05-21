import { useState } from "react";
import ReporteFilterModal from "./ReporteFilterModal";
import type { FiltroConfig } from "./ReporteFilterModal";

interface ExportarReporteButtonProps {
  endpoint: string;
  filtrosActuales?: Record<string, unknown>;
  nombreArchivoBase: string;
  filtrosConfig: FiltroConfig[];
}

export const ExportarReporteButton: React.FC<ExportarReporteButtonProps> = ({
  endpoint,
  filtrosActuales = {},
  nombreArchivoBase,
  filtrosConfig,
}) => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="exportar-btn"
      >
        Exportar Reporte ▼
      </button>

      <ReporteFilterModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        endpoint={endpoint}
        nombreArchivoBase={nombreArchivoBase}
        filtrosConfig={filtrosConfig}
        filtrosActuales={filtrosActuales}
      />
    </>
  );
};