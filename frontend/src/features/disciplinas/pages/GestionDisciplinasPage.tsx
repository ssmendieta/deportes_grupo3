import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../../shared/components/PageHeader";
import DisciplinaFilters from "../components/DisciplinaFilters";
import DisciplinaFormModal from "../components/DisciplinaFormModal";
import DisciplinaTable from "../components/DisciplinaTable";
import {
  actualizarDisciplina,
  cambiarEstadoDisciplina,
  crearDisciplina,
  listarDisciplinas,
} from "../services/disciplinaService";
import type {
  Disciplina,
  DisciplinaFormData,
  FiltroEstadoDisciplina,
} from "../types/disciplina.types";

// IMPORTANTE: Importación del botón de reportes
import { ExportarReporteButton } from "../../../shared/components/ExportarReporteButton";

function GestionDisciplinasPage() {
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] =
    useState<FiltroEstadoDisciplina>("todas");
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [disciplinaEditando, setDisciplinaEditando] =
    useState<Disciplina | null>(null);

  const cargarDatos = async () => {
    setCargando(true);
    const disciplinasData = await listarDisciplinas();
    setDisciplinas(disciplinasData);
    setCargando(false);
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void cargarDatos();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const disciplinasFiltradas = useMemo(() => {
    return disciplinas.filter((disciplina) => {
      const coincideBusqueda = disciplina.nombre
        .toLowerCase()
        .includes(busqueda.toLowerCase());
      const coincideEstado =
        filtroEstado === "todas" ||
        (filtroEstado === "activas" && disciplina.estado === "activa") ||
        (filtroEstado === "inactivas" && disciplina.estado === "inactiva");
      return coincideBusqueda && coincideEstado;
    });
  }, [busqueda, disciplinas, filtroEstado]);

  const abrirCrear = () => {
    setDisciplinaEditando(null);
    setModalAbierto(true);
  };

  const abrirEditar = (disciplina: Disciplina) => {
    setDisciplinaEditando(disciplina);
    setModalAbierto(true);
  };

  const guardarDisciplina = async (data: DisciplinaFormData) => {
    if (disciplinaEditando) {
      await actualizarDisciplina(disciplinaEditando.id, data);
    } else {
      await crearDisciplina(data);
    }
    setModalAbierto(false);
    await cargarDatos();
  };

  const handleCambiarEstado = async (disciplina: Disciplina) => {
    await cambiarEstadoDisciplina(
      disciplina.id,
      disciplina.estado === "activa" ? "inactiva" : "activa",
    );
    await cargarDatos();
  };

  return (
    <div className="page-stack">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <PageHeader
          title="Gestión de disciplinas deportivas"
          description="Crear, editar y activar/desactivar disciplinas deportivas."
          actionLabel="+ Nueva disciplina"
          onAction={abrirCrear}
        />
        
        <div style={{ marginTop: "10px" }}>
          <ExportarReporteButton 
            endpoint="/disciplinas/reporte" 
            filtros={{ estado: filtroEstado, busqueda }} 
            nombreArchivoBase="Reporte_Disciplinas_Deportivas" 
          />
        </div>
      </div>

      <section className="panel-card">
        <p>
          Las disciplinas no se eliminan — se desactivan para preservar el
          historial de reservas, pagos e inscripciones.
        </p>
      </section>

      <DisciplinaFilters
        busqueda={busqueda}
        filtroEstado={filtroEstado}
        onBusquedaChange={setBusqueda}
        onFiltroEstadoChange={setFiltroEstado}
      />

      <DisciplinaTable
        disciplinas={disciplinasFiltradas}
        cargando={cargando}
        onEditar={abrirEditar}
        onCambiarEstado={handleCambiarEstado}
      />

      <DisciplinaFormModal
        abierto={modalAbierto}
        disciplinaEditando={disciplinaEditando}
        onCerrar={() => setModalAbierto(false)}
        onGuardar={guardarDisciplina}
      />
    </div>
  );
}

export default GestionDisciplinasPage;