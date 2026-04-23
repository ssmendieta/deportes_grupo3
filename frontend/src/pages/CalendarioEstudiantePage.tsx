import { useMemo, useState } from "react";
import AlertasCalendario from "../components/calendario/AlertasCalendario";
import EncabezadoCalendario from "../components/calendario/EncabezadoCalendario";
import GrillaCalendarioSemanal from "../components/calendario/GrillaCalendarioSemanal";
import LeyendaCalendario from "../components/calendario/LeyendaCalendario";
import NavegacionSemana from "../components/calendario/NavegacionSemana";
import { BLOQUES_OCUPADOS_MOCK } from "../mocks/CalendarioMock";

type Props = {
  onReservar: () => void;
};

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

function CalendarioEstudiantePage({ onReservar }: Props) {
  const [semanaBase, setSemanaBase] = useState(obtenerLunes(new Date()));
  const [mensaje, setMensaje] = useState("");
  const [seleccion, setSeleccion] = useState("");

  const etiquetaSemana = useMemo(() => {
    const finSemana = sumarDias(semanaBase, 6);
    return `${semanaBase.toLocaleDateString()} - ${finSemana.toLocaleDateString()}`;
  }, [semanaBase]);

  return (
    <div className="pagina-calendario">
      <EncabezadoCalendario
        titulo="Calendario Semanal - Estudiante"
        subtitulo="Consulta disponibilidad y selecciona un horario para reservar"
        textoBoton="Reservar"
        onClickBoton={onReservar}
      />

      <section className="resumen-calendario">
        <div className="tarjeta-resumen">
          <span>Bloques ocupados</span>
          <strong>{BLOQUES_OCUPADOS_MOCK.length}</strong>
        </div>

        <div className="tarjeta-resumen">
          <span>Selección actual</span>
          <strong>{seleccion || "Ninguna"}</strong>
        </div>
      </section>

      <NavegacionSemana
        etiquetaSemana={etiquetaSemana}
        onSemanaAnterior={() => setSemanaBase((prev) => sumarDias(prev, -7))}
        onSemanaSiguiente={() => setSemanaBase((prev) => sumarDias(prev, 7))}
      />

      <LeyendaCalendario />

      <AlertasCalendario
        mensaje={mensaje}
        tipo={mensaje.includes("seleccionado") ? "ok" : "error"}
      />

      <GrillaCalendarioSemanal
        modo="estudiante"
        onConflicto={(msg) => {
          setMensaje(msg);
          setSeleccion("");
        }}
        onBloqueLibreClick={(dia, hora) => {
          const texto = `${dia} ${hora}`;
          setSeleccion(texto);
          setMensaje(`Horario seleccionado: ${texto}`);
        }}
      />
    </div>
  );
}

export default CalendarioEstudiantePage;
