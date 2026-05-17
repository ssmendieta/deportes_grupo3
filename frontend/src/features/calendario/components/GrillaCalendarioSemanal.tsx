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
  return nombre.toLowerCase().includes("arquitect") ? "arquitectura" : "coliseo";
}

function normalizarHora(hora: string) {
  return hora.slice(0, 5);
}

type BloqueConFilas = {
  bloque: BloqueOcupado;
  startRow: number;
  spanRows: number;
};

function calcularBloquesConFilas(bloques: BloqueOcupado[]): BloqueConFilas[] {
  return bloques.flatMap((bloque) => {
    const inicioB = horaAMinutos(bloque.hora_inicio);
    const finB = horaAMinutos(bloque.hora_fin);

    let startRow = -1;
    let endRow = -1;

    HORAS_CALENDARIO.forEach((hora, idx) => {
      const inicioSlot = horaAMinutos(hora);
      const finSlot = inicioSlot + 30;
      if (inicioB < finSlot && finB > inicioSlot) {
        if (startRow === -1) startRow = idx;
        endRow = idx;
      }
    });

    if (startRow === -1) return [];
    return [{ bloque, startRow, spanRows: endRow - startRow + 1 }];
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
  const [bloquesOcupados, setBloquesOcupados] = useState<Record<string, BloqueOcupado[]>>({});
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
    () => (espacioId ? espacios.filter((e) => e.id === espacioId) : espacios),
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
            <div className="calendar-grid calendar-grid-explicit">
              {/* Corner */}
              <div className="calendar-time empty" style={{ gridColumn: 1, gridRow: 1 }} />

              {/* Day headers — row 1 */}
              {DIAS_SEMANA.map((dia, colIdx) => (
                <div
                  key={dia}
                  className="calendar-day-header"
                  style={{ gridColumn: colIdx + 2, gridRow: 1 }}
                >
                  {dia}
                </div>
              ))}

              {/* Time labels — column 1, rows 2…N+1 */}
              {HORAS_CALENDARIO.map((hora, rowIdx) => (
                <div
                  key={hora}
                  className="calendar-time"
                  style={{ gridColumn: 1, gridRow: rowIdx + 2 }}
                >
                  {hora}
                </div>
              ))}

              {/* Day columns: one spanning cell per block, free cells elsewhere */}
              {DIAS_SEMANA.map((dia, colIdx) => {
                const bloques = obtenerBloquesDeDia(espacio.id, dia);
                const bloquesConFilas = calcularBloquesConFilas(bloques);
                const filasOcupadas = new Set(
                  bloquesConFilas.flatMap(({ startRow, spanRows }) =>
                    Array.from({ length: spanRows }, (_, i) => startRow + i),
                  ),
                );

                return HORAS_CALENDARIO.map((hora, rowIdx) => {
                  const col = colIdx + 2;
                  const row = rowIdx + 2;

                  // Spanning block that starts at this row
                  const bloqueInfo = bloquesConFilas.find((b) => b.startRow === rowIdx);
                  if (bloqueInfo) {
                    const { bloque, spanRows } = bloqueInfo;
                    return (
                      <button
                        key={`${espacio.id}-${dia}-${hora}-bloque`}
                        className="calendar-cell busy"
                        style={{ gridColumn: col, gridRow: `${row} / span ${spanRows}` }}
                        onClick={() =>
                          onConflicto?.(
                            `El horario del ${dia} a las ${normalizarHora(bloque.hora_inicio)} ya está ocupado.`,
                          )
                        }
                      >
                        <div className={`booking-block ${clasePorEspacio(espacio.nombre)}`}>
                          <strong>
                            {bloque.tipo === "clase" ? "Clase / entrenamiento" : bloque.motivo || "Reserva"}
                          </strong>
                          <small>
                            {normalizarHora(bloque.hora_inicio)} – {normalizarHora(bloque.hora_fin)}
                          </small>
                        </div>
                      </button>
                    );
                  }

                  // Row consumed by a spanning block — skip (no cell rendered)
                  if (filasOcupadas.has(rowIdx)) return null;

                  // Free cell
                  return (
                    <button
                      key={`${espacio.id}-${dia}-${hora}-libre`}
                      className="calendar-cell free"
                      style={{ gridColumn: col, gridRow: row }}
                      onClick={() => onBloqueLibreClick?.(dia, hora)}
                    >
                      <span className="free-label">
                        {modo === "admin" ? "Libre" : "Disponible"}
                      </span>
                    </button>
                  );
                });
              })}
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

export default GrillaCalendarioSemanal;
