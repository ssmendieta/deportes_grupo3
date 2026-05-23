import { useEffect, useMemo, useState } from "react";
import StatCard from "../../../shared/components/StatCard";
import { formatFechaBO } from "../../../shared/services/apiClient";
import { getEspacios } from "../../reservas/services/reservaService";
import type { Espacio } from "../../reservas/types/reserva.types";
import AlertasCalendario from "../components/AlertasCalendario";
import EncabezadoCalendario from "../components/EncabezadoCalendario";
import GrillaCalendarioSemanal, { clasePorEspacio } from "../components/GrillaCalendarioSemanal";
import LeyendaCalendario from "../components/LeyendaCalendario";
import NavegacionSemana from "../components/NavegacionSemana";

function obtenerLunes(fecha: Date) {
  const y = fecha.getFullYear();
  const m = fecha.getMonth();
  const d = fecha.getDate();
  const copia = new Date(y, m, d);
  const dia = copia.getDay();
  const ajuste = dia === 0 ? -6 : 1 - dia;
  copia.setDate(copia.getDate() + ajuste);
  return copia;
}

function sumarDias(fecha: Date, dias: number) {
  const y = fecha.getFullYear();
  const m = fecha.getMonth();
  const d = fecha.getDate();
  return new Date(y, m, d + dias);
}

function CalendarioEstudiantePage() {
  const [semanaBase, setSemanaBase] = useState(obtenerLunes(new Date()));
  const [mensaje, setMensaje] = useState("");
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [espacioSeleccionado, setEspacioSeleccionado] = useState<
    number | undefined
  >(undefined);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void getEspacios().then((data) => {
        setEspacios(data);
        setEspacioSeleccionado((actual) => actual ?? data[0]?.id);
      });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const etiquetaSemana = useMemo(() => {
    const finSemana = sumarDias(semanaBase, 5);
    return `${formatFechaBO(semanaBase)} - ${formatFechaBO(finSemana)}`;
  }, [semanaBase]);

  return (
    <div className="page-stack">
      <EncabezadoCalendario
        titulo="Calendario Semanal"
        subtitulo="Consulta disponibilidad de canchas. Las reservas se realizan de forma presencial."
      />

      <section className="stats-grid compact">
        <StatCard label="Horario visible" value="14:00 - 18:00" />
      </section>

      <div className="gc-toolbar">
        <NavegacionSemana
          etiquetaSemana={etiquetaSemana}
          onSemanaAnterior={() => setSemanaBase((prev) => sumarDias(prev, -7))}
          onSemanaSiguiente={() => setSemanaBase((prev) => sumarDias(prev, 7))}
        />

        <div className="gc-space-picker">
          {espacios.map((espacio) => (
            <button
              key={espacio.id}
              className={`gc-space-chip${espacioSeleccionado === espacio.id ? " active" : ""}`}
              onClick={() => setEspacioSeleccionado(espacio.id)}
            >
              <span className={`gc-space-dot ${clasePorEspacio(espacio.nombre)}`} />
              {espacio.nombre}
            </button>
          ))}
        </div>
      </div>

      <LeyendaCalendario espacios={espacios} />
      <AlertasCalendario mensaje={mensaje} tipo="error" />

      {espacioSeleccionado && (
        <GrillaCalendarioSemanal
          semanaBase={semanaBase}
          espacioId={espacioSeleccionado}
          onConflicto={(msg) => setMensaje(msg)}
        />
      )}
    </div>
  );
}

export default CalendarioEstudiantePage;
