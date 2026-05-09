import { useEffect, useMemo, useState } from "react";
import {
  DIAS_SEMANA,
  HORAS_CALENDARIO,
  fechaParaAPI,
  getDisponibilidad,
  getEspacios,
} from "../../reservas/services/reservaService";
import type {
  BloqueOcupado,
  Espacio,
} from "../../reservas/types/reserva.types";

type Props = {
  modo: "admin" | "estudiante";
  semanaBase: Date;
  espacioId?: number;
  onBloqueLibreClick?: (dia: string, hora: string) => void;
  onConflicto?: (mensaje: string) => void;
};

function horaAMinutos(hora: string) {
  const [h, m] = hora.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

function clasePorEspacio(nombre: string) {
  return nombre.toLowerCase().includes("arquitect")
    ? "arquitectura"
    : "coliseo";
}

function normalizarHora(hora: string) {
  return hora.slice(0, 5);
}

function obtenerBloqueEnCelda(bloques: BloqueOcupado[], horaCelda: string) {
  const inicioCelda = horaAMinutos(horaCelda);
  const finCelda = inicioCelda + 30;

  return bloques.find((bloque) => {
    const inicioBloque = horaAMinutos(bloque.hora_inicio);
    const finBloque = horaAMinutos(bloque.hora_fin);
    return inicioBloque < finCelda && finBloque > inicioCelda;
  });
}

function GrillaCalendarioSemanal({
  modo,
  semanaBase,
  espacioId,
  onBloqueLibreClick,
  onConflicto,
}: Props) {
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [bloquesOcupados, setBloquesOcupados] = useState<
    Record<string, BloqueOcupado[]>
  >({});
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const cargarDatos = async () => {
        setCargando(true);
        try {
          const espaciosData = await getEspacios();
          setEspacios(espaciosData);

          const nuevosBloques: Record<string, BloqueOcupado[]> = {};
          for (let i = 0; i < DIAS_SEMANA.length; i += 1) {
            const fecha = fechaParaAPI(semanaBase, i);
            for (const espacio of espaciosData) {
              const disponibilidad = await getDisponibilidad(espacio.id, fecha);
              nuevosBloques[`${espacio.id}-${DIAS_SEMANA[i]}`] =
                disponibilidad.bloques_ocupados || [];
            }
          }
          setBloquesOcupados(nuevosBloques);
        } finally {
          setCargando(false);
        }
      };

      void cargarDatos();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [semanaBase]);

  const espaciosMostrados = useMemo(
    () =>
      espacioId
        ? espacios.filter((espacio) => espacio.id === espacioId)
        : espacios,
    [espacioId, espacios],
  );

  const obtenerBloquesDeDia = (id: number, dia: string) =>
    bloquesOcupados[`${id}-${dia}`] || [];

  return (
    <section className="calendar-stack">
      {cargando && <div className="soft-alert">Cargando disponibilidad...</div>}

      {espaciosMostrados.map((espacio) => (
        <article key={espacio.id} className="calendar-space-card">
          <h3>{espacio.nombre}</h3>

          <div className="calendar-scroll">
            <div className="calendar-grid">
              <div className="calendar-time empty" />

              {DIAS_SEMANA.map((dia) => (
                <div key={dia} className="calendar-day-header">
                  {dia}
                </div>
              ))}

              {HORAS_CALENDARIO.map((hora) => (
                <div key={`${espacio.id}-${hora}`} className="calendar-row">
                  <div className="calendar-time">{hora}</div>

                  {DIAS_SEMANA.map((dia) => {
                    const bloque = obtenerBloqueEnCelda(
                      obtenerBloquesDeDia(espacio.id, dia),
                      hora,
                    );

                    return (
                      <button
                        key={`${espacio.id}-${dia}-${hora}`}
                        className={`calendar-cell ${bloque ? "busy" : "free"}`}
                        onClick={() => {
                          if (bloque) {
                            onConflicto?.(
                              `El horario del ${dia} a las ${hora} ya está ocupado.`,
                            );
                          } else {
                            onBloqueLibreClick?.(dia, hora);
                          }
                        }}
                      >
                        {bloque ? (
                          <div
                            className={`booking-block ${clasePorEspacio(espacio.nombre)}`}
                          >
                            <strong>{espacio.nombre}</strong>
                            <span>
                              {bloque.tipo === "clase"
                                ? "Clase / entrenamiento"
                                : bloque.motivo || "Reserva"}
                            </span>
                            <small>
                              {normalizarHora(bloque.hora_inicio)} -{" "}
                              {normalizarHora(bloque.hora_fin)}
                            </small>
                          </div>
                        ) : (
                          <span className="free-label">
                            {modo === "admin" ? "Libre" : "Disponible"}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

export default GrillaCalendarioSemanal;
