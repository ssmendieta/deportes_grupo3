import { useEffect, useState } from "react";
import {
  DIAS_SEMANA,
  HORAS_CALENDARIO,
  getDisponibilidad,
  getEspacios,
  fechaParaAPI,
  type BloqueOcupado,
  type Espacio,
} from "../../services/reservaService";

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

const MINUTOS_POR_FILA = 30;

function calcularSpan(bloque: BloqueOcupado) {
  const duracion =
    horaAMinutos(bloque.hora_fin) - horaAMinutos(bloque.hora_inicio);
  return Math.max(1, Math.round(duracion / MINUTOS_POR_FILA));
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
    const cargarDatos = async () => {
      setCargando(true);
      try {
        const espaciosData = await getEspacios();
        setEspacios(espaciosData);

        const nuevosBloques: Record<string, BloqueOcupado[]> = {};
        for (let i = 0; i < DIAS_SEMANA.length; i++) {
          const fecha = fechaParaAPI(semanaBase, i);
          for (const espacio of espaciosData) {
            const disponibilidad = await getDisponibilidad(espacio.id, fecha);
            nuevosBloques[`${espacio.id}-${DIAS_SEMANA[i]}`] =
              disponibilidad.bloques_ocupados || [];
          }
        }
        setBloquesOcupados(nuevosBloques);
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
  }, [semanaBase]);

  const obtenerBloquesDeDia = (id: number, dia: string) =>
    bloquesOcupados[`${id}-${dia}`] || [];

  const espaciosMostrados = espacioId
    ? espacios.filter((e) => e.id === espacioId)
    : espacios;

  return (
    <section className="contenedor-grilla-calendario">
      {cargando && (
        <div className="aviso-carga">Cargando disponibilidad...</div>
      )}

      {espaciosMostrados.map((espacio) => (
        <div key={espacio.id} className="grilla-espacio">
          <div className="grilla-calendario">
            {/* ── Encabezado ── */}
            <div className="celda-hora encabezado-vacio" />
            {DIAS_SEMANA.map((dia) => (
              <div key={dia} className="encabezado-dia">
                {dia}
              </div>
            ))}

            {/* ── Filas ── */}
            {HORAS_CALENDARIO.map((hora) => (
              <div key={`${espacio.id}-${hora}`} className="fila-calendario">
                <div className="celda-hora">{hora}</div>

                {DIAS_SEMANA.map((dia) => {
                  const bloquesDia = obtenerBloquesDeDia(espacio.id, dia);
                  const horaActualMin = horaAMinutos(hora);

                  const bloqueInicia = bloquesDia.find(
                    (b) => b.hora_inicio.slice(0, 5) === hora,
                  );

                  const estaPisada = bloquesDia.some((b) => {
                    const ini = horaAMinutos(b.hora_inicio);
                    const fin = horaAMinutos(b.hora_fin);
                    return horaActualMin > ini && horaActualMin < fin;
                  });

                  if (estaPisada) return null;

                  if (bloqueInicia) {
                    const span = calcularSpan(bloqueInicia);
                    const tipo = clasePorEspacio(espacio.nombre);

                    return (
                      <div
                        key={`${espacio.id}-${dia}-${hora}`}
                        style={{ gridRow: `span ${span}` }}
                        className={`celda-calendario bloque-reserva ${tipo}`}
                        onClick={() =>
                          onConflicto?.(
                            `El horario del ${dia} a las ${hora} ya está ocupado.`,
                          )
                        }
                      >
                        <strong>
                          {bloqueInicia.tipo === "clase"
                            ? "Clase"
                            : bloqueInicia.motivo || "Reserva"}
                        </strong>
                        <small>
                          {bloqueInicia.hora_inicio.slice(0, 5)} –{" "}
                          {bloqueInicia.hora_fin.slice(0, 5)}
                        </small>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={`${espacio.id}-${dia}-${hora}`}
                      className="celda-calendario libre"
                      onClick={() => onBloqueLibreClick?.(dia, hora)}
                    >
                      <div className="bloque-libre">
                        {modo === "admin" ? "Libre" : "Disponible"}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

export default GrillaCalendarioSemanal;
