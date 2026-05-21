// frontend/src/shared/components/ExportarReporteButton.tsx

import React, { useState, useRef, useEffect } from 'react';
import { descargarReporte } from '../services/reporteService';

// AQUÍ ESTABA EL ERROR (Ya corregido sin espacios):
interface ExportarReporteButtonProps {
  endpoint: string;
  filtros?: Record<string, any>;
  nombreArchivoBase: string; 
}

export const ExportarReporteButton: React.FC<ExportarReporteButtonProps> = ({
  endpoint,
  filtros = {},
  nombreArchivoBase, // Corregido aquí también
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ... El resto de tu código hacia abajo se mantiene exactamente igual

  // Cerrar el dropdown si el usuario hace click afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportar = async (formato: 'pdf' | 'excel') => {
    setCargando(true);
    setError(null);
    setIsOpen(false); // Cierra el menú al hacer click en una opción

    try {
      await descargarReporte(endpoint, formato, filtros, nombreArchivoBase);
    } catch (err: any) {
      setError('Error al descargar el archivo. Intente de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="exportar-btn-container" ref={dropdownRef}>
      <button
        onClick={() => !cargando && setIsOpen(!isOpen)}
        disabled={cargando}
        className="exportar-btn"
      >
        {cargando ? (
          <>
            <span className="exportar-spinner" />
            Generando...
          </>
        ) : (
          <>
            Exportar Reporte
            <span style={{ fontSize: '10px' }}>▼</span>
          </>
        )}
      </button>

      {isOpen && (
        <ul className="exportar-dropdown">
          <li
            onClick={() => handleExportar('pdf')}
            className="exportar-dropdown-item"
          >
            📄 Exportar PDF
          </li>
          <li
            onClick={() => handleExportar('excel')}
            className="exportar-dropdown-item"
          >
            📊 Exportar Excel
          </li>
        </ul>
      )}

      {error && (
        <div className="exportar-error">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
};