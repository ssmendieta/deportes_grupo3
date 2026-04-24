import { useEffect, useMemo, useState } from "react";
import AlertasCalendario from "../components/calendario/AlertasCalendario";
import EncabezadoCalendario from "../components/calendario/EncabezadoCalendario";
import GrillaCalendarioSemanal from "../components/calendario/GrillaCalendarioSemanal";
import LeyendaCalendario from "../components/calendario/LeyendaCalendario";
import NavegacionSemana from "../components/calendario/NavegacionSemana";
import { getEspacios, type Espacio } from "../services/reservaService";

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
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [espacioSeleccionado, setEspacioSeleccionado] = useState<
    number | undefined
  >(undefined);

  useEffect(() => {
    getEspacios()
      .then((data) => {
        setEspacios(data);
        if (data.length > 0) setEspacioSeleccionado(data[0].id);
      })
      .catch(() => {});
  }, []);

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

        {/* ── Selector de espacio ── */}
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
        <GrillaCalendarioSemanal
          modo="estudiante"
          semanaBase={semanaBase}
          espacioId={espacioSeleccionado}
          onConflicto={(msg) => setMensaje(msg)}
        />
      )}
    </div>
  );
}

export default CalendarioEstudiantePage;
