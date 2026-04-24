import { useMemo, useState } from "react";
import AlertasCalendario from "../components/calendario/AlertasCalendario";
import EncabezadoCalendario from "../components/calendario/EncabezadoCalendario";
import GrillaCalendarioSemanal from "../components/calendario/GrillaCalendarioSemanal";
import LeyendaCalendario from "../components/calendario/LeyendaCalendario";
import NavegacionSemana from "../components/calendario/NavegacionSemana";

function obtenerLunes(fecha: Date) {
  const copia = new Date(fecha);
  const dia = copia.getDay();
  const ajuste = dia === 0 ? -6 : 1 - dia;
  copia.setDate(copia.getDate() + ajuste);
  return copia;
}

function sumarDias(fecha: Date, dias: number) {
  const copia = new Date(fecha);
  copia.setDate(copia.getDate() + dias);
  return copia;
}

function formatearFecha(fecha: Date) {
  return fecha.toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function CalendarioEstudiantePage() {
  const [semanaBase, setSemanaBase] = useState(obtenerLunes(new Date()));
  const [mensaje, setMensaje] = useState("");

  const etiquetaSemana = useMemo(() => {
    const finSemana = sumarDias(semanaBase, 5);
    return `${formatearFecha(semanaBase)} - ${formatearFecha(finSemana)}`;
  }, [semanaBase]);

  return (
    <div className="pagina-calendario">
      <EncabezadoCalendario
        titulo="Calendario Semanal - Estudiante"
        subtitulo="Consulta la disponibilidad de canchas. Las reservas se realizan de forma presencial."
      />

      <section className="resumen-calendario">
        <div className="tarjeta-resumen">
          <span>Horario visible</span>
          <strong>14:00 - 18:00</strong>
        </div>

        <div className="tarjeta-resumen">
          <span>Modo</span>
          <strong>Consulta</strong>
        </div>
      </section>

      <NavegacionSemana
        etiquetaSemana={etiquetaSemana}
        onSemanaAnterior={() => setSemanaBase((prev) => sumarDias(prev, -7))}
        onSemanaSiguiente={() => setSemanaBase((prev) => sumarDias(prev, 7))}
      />

      <LeyendaCalendario />

      <AlertasCalendario mensaje={mensaje} tipo="error" />

      <GrillaCalendarioSemanal
        modo="estudiante"
        semanaBase={semanaBase}
        onConflicto={(msg) => setMensaje(msg)}
      />
    </div>
  );
}

export default CalendarioEstudiantePage;
