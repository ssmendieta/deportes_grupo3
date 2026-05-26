import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../../shared/components/PageHeader";
import {
  actualizarDeportista,
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

import { ExportarReporteButton } from "../../../shared/components/ExportarReporteButton";
import { useToast } from "../../../shared/hooks/useToast";

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
  const [deportistaEditando, setDeportistaEditando] =
    useState<Deportista | null>(null);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const data = await listarDeportistas();
      setDeportistas(data);
    } catch {
      // Error silencioso 
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    const tarea = window.setTimeout(() => {
      void cargarDatos();
    }, 0);

    return () => window.clearTimeout(tarea);
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

  const handleAbrirNuevo = () => {
    setDeportistaEditando(null);
    setFormularioAbierto((prev) => !prev);
  };

  const handleEditar = (deportista: Deportista) => {
    setCuentaSeleccionada(null);
    setDeportistaEditando(deportista);
    setFormularioAbierto(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelarFormulario = () => {
    setFormularioAbierto(false);
    setDeportistaEditando(null);
  };

  const handleGuardar = async (data: DeportistaFormData) => {
    if (deportistaEditando) {
      await actualizarDeportista(deportistaEditando.id, data);
      toast.success("Información del deportista actualizada correctamente.");
    } else {
      await crearDeportista(data);
      toast.success("Deportista registrado correctamente.");
    }

    setFormularioAbierto(false);
    setDeportistaEditando(null);
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
      <PageHeader
        eyebrow="Universidad Católica Boliviana"
        title="Registro de nuevo deportista"
        description="Alta y consulta de deportistas para academias, clases libres y equipos competitivos."
        actionLabel={formularioAbierto ? "Cerrar formulario" : "+ Nuevo deportista"}
        onAction={formularioAbierto ? handleCancelarFormulario : handleAbrirNuevo}
      />

      <div style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
        <ExportarReporteButton
          endpoint="/deportistas/reporte"
          filtrosActuales={{ tipo: tipoFiltro, busqueda }}
          nombreArchivoBase="Reporte_Deportistas_Registrados"
          filtrosConfig={[
            {
              name: "tipo",
              label: "Tipo",
              type: "select",
              options: [
                { value: "todos", label: "Todos" },
                { value: "estudiante_ucb", label: "Estudiante UCB" },
                { value: "academia", label: "Academia" },
                { value: "competitivo", label: "Competitivo" },
              ],
            },
          ]}
        />
      </div>

      {formularioAbierto && (
        <DeportistaForm
          deportistaEditando={deportistaEditando}
          onCancelar={handleCancelarFormulario}
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
        onEditar={handleEditar}
        onVerCuenta={setCuentaSeleccionada}
      />
    </div>
  );
}

export default RegistroDeportistaPage;
