import { useEffect, useMemo, useState } from "react";
import Spinner from "../../../shared/components/Spinner";
import {
  fechaParaAPI,
  getDisponibilidad,
  getEspacios,
} from "../../reservas/services/reservaService";
import { apiRequest } from "../../../shared/services/apiClient";
import type {
  BloqueOcupado,
  Espacio,
} from "../../reservas/types/reserva.types";
import {
  DIAS_SEMANA,
  DIA_ABREV,
  HORAS_GRID_FALLBACK,
  GRID_SLOT_PASO_MINUTOS,
} from "../../reservas/constants/reservas.constants";

type Props = {
  semanaBase: Date;
  espacioId?: number;
  onBloqueLibreClick?: (dia: string, hora: string) => void;
  onConflicto?: (mensaje: string) => void;
};

function horaAMinutos(hora: string) {
  const [h, m] = hora.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

export function clasePorEspacio(nombre: string) {
  return nombre.toLowerCase().includes("arquitect")
    ? "arquitectura"
    : "coliseo";
}

function normalizarHora(hora: string) {
  return hora.slice(0, 5);
}

function sumarDias(fecha: Date, dias: number) {
  return new Date(
    fecha.getFullYear(),
    fecha.getMonth(),
    fecha.getDate() + dias,
  );
}

function esMismoDia(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

type BloqueConFilas = {
  bloque: BloqueOcupado;
  startRow: number;
  spanRows: number;
};

function calcularBloquesConFilas(bloques: BloqueOcupado[], horasGrid: string[]): BloqueConFilas[] {
  return bloques.flatMap((bloque) => {
    const inicioB = horaAMinutos(bloque.hora_inicio);
    const finB = horaAMinutos(bloque.hora_fin);

    let startRow = -1;
    let endRow = -1;

    horasGrid.forEach((hora, idx) => {
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



function generarSlotsGrid(desde: string, hasta: string, pasoMin = GRID_SLOT_PASO_MINUTOS): string[] {
  const [h0, m0] = desde.split(":").map(Number);
  const [h1, m1] = hasta.split(":").map(Number);
  const inicio = h0 * 60 + m0;
  const fin = h1 * 60 + m1;
  const slots: string[] = [];
  for (let t = inicio; t <= fin; t += pasoMin) {
    const hh = String(Math.floor(t / 60)).padStart(2, "0");
    const mm = String(t % 60).padStart(2, "0");
    slots.push(`${hh}:${mm}`);
  }
  return slots.length > 1 ? slots : HORAS_GRID_FALLBACK;
}



function GrillaCalendarioSemanal({
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
  const [horasGrid, setHorasGrid] = useState<string[]>(HORAS_GRID_FALLBACK);

  useEffect(() => {
    apiRequest<{ min: string; max: string }>("/api/espacios/rango-horario")
      .then((r) => {
        const generados = generarSlotsGrid(r.min, r.max, 60);
        if (generados.length > 1) setHorasGrid(generados);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const cargarDatos = async () => {
        setCargando(true);
        try {
          const espaciosData = await getEspacios();
          setEspacios(espaciosData);

          const espaciosACargar = espacioId
            ? espaciosData.filter((e) => e.id === espacioId)
            : espaciosData;

          const resultados = await Promise.all(
            DIAS_SEMANA.flatMap((_, i) => {
              const fecha = fechaParaAPI(semanaBase, i);
              return espaciosACargar.map((espacio) =>
                getDisponibilidad(espacio.id, fecha).then((disp) => ({
                  key: `${espacio.id}-${DIAS_SEMANA[i]}`,
                  bloques: disp.bloques_ocupados || [],
                })),
              );
            }),
          );

          const nuevosBloques: Record<string, BloqueOcupado[]> = {};
          for (const { key, bloques } of resultados) {
            nuevosBloques[key] = bloques;
          }
          setBloquesOcupados(nuevosBloques);
        } finally {
          setCargando(false);
        }
      };
      void cargarDatos();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [semanaBase, espacioId]);

  const espaciosMostrados = useMemo(
    () => (espacioId ? espacios.filter((e) => e.id === espacioId) : espacios),
    [espacioId, espacios],
  );

  const obtenerBloquesDeDia = (id: number, dia: string) =>
    bloquesOcupados[`${id}-${dia}`] || [];

  return (
    <section className="gc-container">
      {cargando && <Spinner texto="Cargando disponibilidad..." />}

      {espaciosMostrados.map((espacio) => {
        const espacioClase = clasePorEspacio(espacio.nombre);
        return (
          <div key={espacio.id} className="gc-wrapper">
            <div className="gc-scroll">
              <div className="gc-grid">
                <div
                  className="gc-corner"
                  style={{ gridColumn: 1, gridRow: 1 }}
                />

                {DIAS_SEMANA.map((dia, colIdx) => {
                  const fecha = sumarDias(semanaBase, colIdx);
                  const hoy = esMismoDia(fecha, new Date());
                  return (
                    <div
                      key={dia}
                      className={`gc-day-header${hoy ? " gc-today" : ""}`}
                      style={{ gridColumn: colIdx + 2, gridRow: 1 }}
                    >
                      <div className="gc-day-name">
                        {DIA_ABREV[dia] || dia.slice(0, 3).toUpperCase()}
                      </div>
                      <div className="gc-day-number">{fecha.getDate()}</div>
                    </div>
                  );
                })}

                {horasGrid.map((hora, rowIdx) => (
                  <div key={hora} style={{ display: "contents" }}>
                    <div
                      className="gc-time"
                      style={{ gridColumn: 1, gridRow: rowIdx + 2 }}
                    >
                      {hora}
                    </div>
                    {DIAS_SEMANA.map((dia, colIdx) => {
                      const col = colIdx + 2;
                      const row = rowIdx + 2;
                      const bloques = obtenerBloquesDeDia(espacio.id, dia);
                      const bloquesConFilas = calcularBloquesConFilas(bloques, horasGrid);
                      const filasOcupadas = new Set(
                        bloquesConFilas.flatMap(({ startRow, spanRows }) =>
                          Array.from(
                            { length: spanRows },
                            (_, i) => startRow + i,
                          ),
                        ),
                      );

                      const bloqueInfo = bloquesConFilas.find(
                        (b) => b.startRow === rowIdx,
                      );
                      if (bloqueInfo) {
                        const { bloque, spanRows } = bloqueInfo;
                        return (
                          <button
                            key={`${espacio.id}-${dia}-${hora}`}
                            className="gc-cell"
                            style={{
                              gridColumn: col,
                              gridRow: `${row} / span ${spanRows}`,
                              padding: 0,
                              cursor: "pointer",
                            }}
                            onClick={() =>
                              onConflicto?.(
                                `El horario del ${dia} a las ${normalizarHora(bloque.hora_inicio)} ya está ocupado.`,
                              )
                            }
                          >
                            <div className={`gc-event ${espacioClase}`}>
                              <div className="gc-event-title">
                                {bloque.tipo === "clase"
                                  ? "Clase"
                                  : bloque.motivo || "Reserva"}
                              </div>
                              <div className="gc-event-time">
                                {normalizarHora(bloque.hora_inicio)} –{" "}
                                {normalizarHora(bloque.hora_fin)}
                              </div>
                            </div>
                          </button>
                        );
                      }

                      if (filasOcupadas.has(rowIdx)) return null;

                      return (
                        <button
                          key={`${espacio.id}-${dia}-${hora}`}
                          className="gc-cell"
                          style={{ gridColumn: col, gridRow: row }}
                          onClick={() => onBloqueLibreClick?.(dia, hora)}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}

export default GrillaCalendarioSemanal;
