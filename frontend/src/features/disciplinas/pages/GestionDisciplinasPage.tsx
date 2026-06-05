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

import { ExportarReporteButton } from "../../../shared/components/ExportarReporteButton";
import { useToast } from "../../../shared/hooks/useToast";

function GestionDisciplinasPage() {
  const toast = useToast();
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
    try {
      const disciplinasData = await listarDisciplinas();
      setDisciplinas(disciplinasData);
    } catch (err) {
      toast.error("No se pudieron cargar las disciplinas.");
      console.error("Error cargando disciplinas:", err);
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
    try {
      if (disciplinaEditando) {
        await actualizarDisciplina(disciplinaEditando.id, data);
        toast.success("Disciplina actualizada correctamente.");
      } else {
        await crearDisciplina(data);
        toast.success("Disciplina creada correctamente.");
      }
      setModalAbierto(false);
      await cargarDatos();
    } catch (err) {
      toast.error("No se pudo guardar la disciplina.");
      console.error("Error guardando disciplina:", err);
    }
  };

  const handleCambiarEstado = async (disciplina: Disciplina) => {
    try {
      const nuevoEstado = disciplina.estado === "activa" ? "inactiva" : "activa";
      await cambiarEstadoDisciplina(disciplina.id, nuevoEstado);
      await cargarDatos();
      toast.success(`Disciplina ${nuevoEstado === "activa" ? "activada" : "desactivada"} correctamente.`);
    } catch (err) {
      toast.error("No se pudo cambiar el estado de la disciplina.");
      console.error("Error cambiando estado:", err);
    }
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Universidad Católica Boliviana"
        title="Gestión de disciplinas deportivas"
        description="Crear, editar y activar/desactivar disciplinas deportivas."
        actionLabel="+ Nueva disciplina"
        onAction={abrirCrear}
      />

      <div style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
        <ExportarReporteButton
          endpoint="/disciplinas/reporte"
          filtrosActuales={{ estado: filtroEstado }}
          nombreArchivoBase="Reporte_Disciplinas_Deportivas"
          filtrosConfig={[
            {
              name: "estado",
              label: "Estado",
              type: "select",
              options: [
                { value: "todas", label: "Todas" },
                { value: "activas", label: "Activas" },
                { value: "inactivas", label: "Inactivas" },
              ],
            },
          ]}
        />
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