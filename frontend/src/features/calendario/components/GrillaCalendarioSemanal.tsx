import { useEffect, useMemo, useState } from "react";
import Spinner from "../../../shared/components/Spinner";
import {
  DIAS_SEMANA,
  fechaParaAPI,
  getDisponibilidad,
  getEspacios,
} from "../../reservas/services/reservaService";
import type {
  BloqueOcupado,
  Espacio,
} from "../../reservas/types/reserva.types";

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

function calcularBloquesConFilas(bloques: BloqueOcupado[]): BloqueConFilas[] {
  return bloques.flatMap((bloque) => {
    const inicioB = horaAMinutos(bloque.hora_inicio);
    const finB = horaAMinutos(bloque.hora_fin);

    let startRow = -1;
    let endRow = -1;

    HORAS_GRID.forEach((hora, idx) => {
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

const HORAS_GRID = [
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
];

const DIA_ABREV: Record<string, string> = {
  Lunes: "LUN",
  Martes: "MAR",
  Miércoles: "MIÉ",
  Jueves: "JUE",
  Viernes: "VIE",
  Sábado: "SÁB",
};

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

                {HORAS_GRID.map((hora, rowIdx) => (
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
                      const bloquesConFilas = calcularBloquesConFilas(bloques);
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
