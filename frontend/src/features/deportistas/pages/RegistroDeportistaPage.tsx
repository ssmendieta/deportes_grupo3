import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../../shared/components/PageHeader";
import {
  crearDeportista,
  listarDeportistas,
} from "../services/deportistaService";
import type {
  Deportista,
  DeportistaFormData,
  TipoDeportista,
} from "../types/deportista.types";
import DeportistaAccount from "../components/DeportistaAccount";
import DeportistaForm from "../components/DeportistaForm";
import DeportistaTable from "../components/DeportistaTable";

// IMPORTANTE: Importación del botón de reportes
import { ExportarReporteButton } from "../../../shared/components/ExportarReporteButton";
import { useToast } from "../../../shared/contexts/ToastContext";

const TIPOS: { valor: TipoDeportista | "todos"; label: string }[] = [
  { valor: "todos", label: "Todos" },
  { valor: "academia", label: "Academia" },
  { valor: "competitivo", label: "Competitivo" },
  { valor: "estudiante_ucb", label: "Estudiante UCB" },
];

function RegistroDeportistaPage() {
  const toast = useToast();
  const [deportistas, setDeportistas] = useState<Deportista[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<TipoDeportista | "todos">(
    "todos",
  );
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [cuentaSeleccionada, setCuentaSeleccionada] =
    useState<Deportista | null>(null);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const data = await listarDeportistas();
      setDeportistas(data);
    } catch {
      // Error silencioso — la tabla mostrará vacío
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    void cargarDatos();
  }, []);

  const deportistasFiltrados = useMemo(() => {
    return deportistas.filter((item) => {
      const coincideBusqueda = `${item.nombreCompleto} ${item.ci}`
        .toLowerCase()
        .includes(busqueda.toLowerCase());
      const coincideTipo = tipoFiltro === "todos" || item.tipo === tipoFiltro;
      return coincideBusqueda && coincideTipo;
    });
  }, [busqueda, tipoFiltro, deportistas]);

  const handleGuardar = async (data: DeportistaFormData) => {
    await crearDeportista(data);
    setFormularioAbierto(false);
    toast.success("Deportista registrado correctamente.");
    await cargarDatos();
  };

  if (cuentaSeleccionada) {
    return (
      <DeportistaAccount
        deportista={cuentaSeleccionada}
        onVolver={() => setCuentaSeleccionada(null)}
      />
    );
  }

  return (
    <div className="page-stack">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <PageHeader
          title="Registro de nuevo deportista"
          description="Alta y consulta de deportistas para academias, clases libres y equipos competitivos."
          actionLabel={
            formularioAbierto ? "Cerrar formulario" : "+ Nuevo deportista"
          }
          onAction={() => setFormularioAbierto((prev) => !prev)}
        />
        
        {/* Botón integrado respetando los filtros de la tabla */}
        <div style={{ marginTop: "10px" }}>
          <ExportarReporteButton 
            endpoint="/deportistas/reporte" 
            filtros={{ tipo: tipoFiltro, busqueda }} 
            nombreArchivoBase="Reporte_Deportistas_Registrados" 
          />
        </div>
      </div>

      {formularioAbierto && (
        <DeportistaForm
          onCancelar={() => setFormularioAbierto(false)}
          onGuardar={handleGuardar}
        />
      )}

      <section className="panel-card table-toolbar">
        <div className="section-heading">
          <span>Deportistas registrados</span>
          <h2>Listado principal</h2>
        </div>

        <div className="toolbar-controls">
          <input
            className="search-input"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o CI"
          />

          <div className="filter-tabs">
            {TIPOS.map(({ valor, label }) => (
              <button
                key={valor}
                className={`btn ${tipoFiltro === valor ? "btn-primary" : "btn-ghost"} small`}
                onClick={() => setTipoFiltro(valor)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <DeportistaTable
        deportistas={deportistasFiltrados}
        cargando={cargando}
        onVerCuenta={setCuentaSeleccionada}
      />
    </div>
  );
}

export default RegistroDeportistaPage;