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

const TIPOS: { valor: TipoDeportista | "todos"; label: string }[] = [
  { valor: "todos", label: "Todos" },
  { valor: "academia", label: "Academia" },
  { valor: "competitivo", label: "Competitivo" },
  { valor: "estudiante_ucb", label: "Estudiante UCB" },
];

function RegistroDeportistaPage() {
  const [deportistas, setDeportistas] = useState<Deportista[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<TipoDeportista | "todos">(
    "todos",
  );
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [cuentaSeleccionada, setCuentaSeleccionada] =
    useState<Deportista | null>(null);

  const cargarDatos = async () => {
    const data = await listarDeportistas();
    setDeportistas(data);
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void cargarDatos();
    }, 0);
    return () => window.clearTimeout(timeoutId);
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
        title="Registro de nuevo deportista"
        description="Alta y consulta de deportistas para academias, clases libres y equipos competitivos."
        actionLabel={
          formularioAbierto ? "Cerrar formulario" : "+ Nuevo deportista"
        }
        onAction={() => setFormularioAbierto((prev) => !prev)}
      />

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
        onVerCuenta={setCuentaSeleccionada}
      />
    </div>
  );
}

export default RegistroDeportistaPage;
