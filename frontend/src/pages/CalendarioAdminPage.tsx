import { useEffect, useMemo, useState } from "react";
import AlertasCalendario from "../components/calendario/AlertasCalendario";
import EncabezadoCalendario from "../components/calendario/EncabezadoCalendario";
import GrillaCalendarioSemanal from "../components/calendario/GrillaCalendarioSemanal";
import LeyendaCalendario from "../components/calendario/LeyendaCalendario";
import NavegacionSemana from "../components/calendario/NavegacionSemana";
import { getReservas } from "../services/reservaService";

type Props = {
  onVerReservas: () => void;
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

function CalendarioAdminPage({ onVerReservas }: Props) {
  const [semanaBase, setSemanaBase] = useState(obtenerLunes(new Date()));
  const [mensaje, setMensaje] = useState("");
  const [totalReservas, setTotalReservas] = useState(0);

  useEffect(() => {
    getReservas()
      .then((reservas) => setTotalReservas(reservas.length))
      .catch(() => setTotalReservas(0));
  }, []);

  const etiquetaSemana = useMemo(() => {
    const finSemana = sumarDias(semanaBase, 5);
    return `${semanaBase.toLocaleDateString()} - ${finSemana.toLocaleDateString()}`;
  }, [semanaBase]);

  return (
    <div className="pagina-calendario">
      <EncabezadoCalendario
        titulo="Calendario Semanal - Administración"
        subtitulo="Control semanal de reservas, clases y entrenamientos"
        textoBoton="Ver reservas"
        onClickBoton={onVerReservas}
      />

      <section className="resumen-calendario">
        <div className="tarjeta-resumen">
          <span>Fuente de datos</span>
          <strong>{totalReservas > 0 ? totalReservas : "Mock"}</strong>
        </div>

        <div className="tarjeta-resumen">
          <span>Horario visible</span>
          <strong>14:00 - 18:00</strong>
        </div>

        <div className="tarjeta-resumen">
          <span>Modo</span>
          <strong>Administrador</strong>
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
        modo="admin"
        semanaBase={semanaBase}
        onConflicto={(msg) => setMensaje(msg)}
      />
    </div>
  );
}

export default CalendarioAdminPage;
