import { useEffect, useMemo, useState } from "react";
import AlertasCalendario from "../components/calendario/AlertasCalendario";
import EncabezadoCalendario from "../components/calendario/EncabezadoCalendario";
import GrillaCalendarioSemanal from "../components/calendario/GrillaCalendarioSemanal";
import LeyendaCalendario from "../components/calendario/LeyendaCalendario";
import NavegacionSemana from "../components/calendario/NavegacionSemana";
import {
  getEspacios,
  getReservas,
  type Espacio,
} from "../services/reservaService";

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
  const [, setTotalReservas] = useState(0);
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [espacioSeleccionado, setEspacioSeleccionado] = useState<
    number | undefined
  >(undefined);

  useEffect(() => {
    getEspacios()
      .then((data) => {
        setEspacios(data);
        // Selecciona el primero por defecto
        if (data.length > 0) setEspacioSeleccionado(data[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    getReservas()
      .then((reservas) => setTotalReservas(reservas.length))
      .catch(() => setTotalReservas(0));
  }, []);

  const etiquetaSemana = useMemo(() => {
    const finSemana = sumarDias(semanaBase, 5);
    return `${semanaBase.toLocaleDateString()} - ${finSemana.toLocaleDateString()}`;
  }, [semanaBase]);

  const nombreEspacioActual =
    espacios.find((e) => e.id === espacioSeleccionado)?.nombre ?? "";

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
          <span>Horario visible</span>
          <strong>14:00 - 18:00</strong>
        </div>
      </section>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <NavegacionSemana
          etiquetaSemana={etiquetaSemana}
          onSemanaAnterior={() => setSemanaBase((prev) => sumarDias(prev, -7))}
          onSemanaSiguiente={() => setSemanaBase((prev) => sumarDias(prev, 7))}
        />

        <div className="navegacion-semana">
          <span
            style={{
              fontWeight: 800,
              color: "var(--azul-oceano)",
              whiteSpace: "nowrap",
            }}
          >
            Cancha:
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            {espacios.map((espacio) => (
              <button
                key={espacio.id}
                onClick={() => setEspacioSeleccionado(espacio.id)}
                className={`boton-secundario-chico ${espacioSeleccionado === espacio.id ? "activo" : ""}`}
                style={{
                  width: "auto",
                  padding: "8px 14px",
                  borderRadius: "999px",
                  fontWeight: 800,
                  fontSize: "13px",
                  whiteSpace: "nowrap",
                  backgroundColor:
                    espacioSeleccionado === espacio.id
                      ? "var(--azul-oceano)"
                      : "var(--azul-suave)",
                  color:
                    espacioSeleccionado === espacio.id
                      ? "var(--blanco)"
                      : "var(--azul-oceano)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {espacio.nombre}
              </button>
            ))}
          </div>
        </div>
      </div>

      <LeyendaCalendario />

      <AlertasCalendario mensaje={mensaje} tipo="error" />

      {espacioSeleccionado !== undefined && (
        <>
          <h3
            style={{
              margin: "0 0 -8px",
              color: "var(--azul-oceano)",
              fontWeight: 900,
              fontSize: "1.1rem",
            }}
          >
            {nombreEspacioActual}
          </h3>
          <GrillaCalendarioSemanal
            modo="admin"
            semanaBase={semanaBase}
            espacioId={espacioSeleccionado}
            onConflicto={(msg) => setMensaje(msg)}
          />
        </>
      )}
    </div>
  );
}

export default CalendarioAdminPage;
