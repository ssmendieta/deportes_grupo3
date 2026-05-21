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
    <div style={{ position: 'relative', display: 'inline-block' }} ref={dropdownRef}>
      {/* Botón Principal */}
      <button
        onClick={() => !cargando && setIsOpen(!isOpen)}
        disabled={cargando}
        style={{
          backgroundColor: '#004b7c', // Color azul oscuro acorde a la UCB
          color: '#ffffff',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '20px', // Bordes redondeados del estilo de tu UI
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: cargando ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
          transition: 'background-color 0.2s',
        }}
      >
        {cargando ? (
          <>
            {/* Spinner de carga inline */}
            <span style={{
              display: 'inline-block',
              width: '14px',
              height: '14px',
              border: '2px solid #ffffff',
              borderTop: '2px solid transparent',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            Generando...
          </>
        ) : (
          <>
            Exportar Reporte
            <span style={{ fontSize: '10px' }}>▼</span>
          </>
        )}
      </button>

      {/* Menú Desplegable (Dropdown) */}
      {isOpen && (
        <ul
          style={{
            position: 'absolute',
            top: '105%',
            right: 0,
            backgroundColor: '#ffffff',
            minWidth: '160px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            borderRadius: '8px',
            padding: '6px 0',
            margin: 0,
            listStyle: 'none',
            zIndex: 100,
            border: '1px solid #e0e0e0',
          }}
        >
          <li
            onClick={() => handleExportar('pdf')}
            style={{
              padding: '10px 16px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            📄 Exportar PDF
          </li>
          <li
            onClick={() => handleExportar('excel')}
            style={{
              padding: '10px 16px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            📊 Exportar Excel
          </li>
        </ul>
      )}

      {/* Mensaje de Error Inline */}
      {error && (
        <div
          style={{
            color: '#d32f2f',
            fontSize: '12px',
            marginTop: '6px',
            position: 'absolute',
            whiteSpace: 'nowrap',
            left: '5px'
          }}
        >
          ⚠️ {error}
        </div>
      )}
    </div>
  );
};