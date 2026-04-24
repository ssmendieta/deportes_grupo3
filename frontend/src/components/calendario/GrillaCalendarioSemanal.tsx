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
  onBloqueLibreClick?: (dia: string, hora: string) => void;
  onConflicto?: (mensaje: string) => void;
};

const ESPACIOS_MOCK: Espacio[] = [
  {
    id: 1,
    nombre: "Coliseo Polideportivo",
    ubicacion: "UCB",
    capacidad: 40,
    horario_apertura: "14:00",
    horario_cierre: "18:00",
    activo: true,
  },
  {
    id: 2,
    nombre: "Cancha de Arquitectura",
    ubicacion: "Arquitectura",
    capacidad: 20,
    horario_apertura: "14:00",
    horario_cierre: "18:00",
    activo: true,
  },
];

// =========================================================
//ver lo del docker pls
// =========================================================
const BLOQUES_MOCK: Record<string, BloqueOcupado[]> = {
  "1-Lunes": [
    {
      hora_inicio: "14:00",
      hora_fin: "15:30",
      tipo: "clase",
      motivo: "Clase / entrenamiento",
    },
  ],
  "2-Martes": [
    {
      hora_inicio: "15:00",
      hora_fin: "16:30",
      tipo: "clase",
      motivo: "Clase / entrenamiento",
    },
  ],
  "1-Jueves": [
    {
      hora_inicio: "16:00",
      hora_fin: "17:00",
      tipo: "reserva",
      motivo: "Reserva previa",
    },
  ],
  "2-Viernes": [
    {
      hora_inicio: "14:30",
      hora_fin: "16:00",
      tipo: "reserva",
      motivo: "Reserva previa",
    },
  ],
};
// =========================================================
// FIN MOCK TEMPORAL
// =========================================================

function normalizarHora(hora: string) {
  return hora.slice(0, 5);
}

function horaAMinutos(hora: string) {
  const [h, m] = normalizarHora(hora).split(":").map(Number);
  return h * 60 + m;
}

function clasePorEspacio(nombre: string) {
  return nombre.toLowerCase().includes("arquitect")
    ? "arquitectura"
    : "coliseo";
}

function obtenerBloqueEnCelda(
  bloques: BloqueOcupado[],
  horaCelda: string,
): BloqueOcupado | undefined {
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
  onBloqueLibreClick,
  onConflicto,
}: Props) {
  const [espacios, setEspacios] = useState<Espacio[]>(ESPACIOS_MOCK);
  const [bloquesOcupados, setBloquesOcupados] =
    useState<Record<string, BloqueOcupado[]>>(BLOQUES_MOCK);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      setCargando(true);

      try {
        const espaciosData = await getEspacios();
        const espaciosValidos = espaciosData.length
          ? espaciosData
          : ESPACIOS_MOCK;

        setEspacios(espaciosValidos);

        const nuevosBloques: Record<string, BloqueOcupado[]> = {};

        for (let i = 0; i < DIAS_SEMANA.length; i++) {
          const fecha = fechaParaAPI(semanaBase, i);

          for (const espacio of espaciosValidos) {
            const disponibilidad = await getDisponibilidad(espacio.id, fecha);
            const key = `${espacio.id}-${DIAS_SEMANA[i]}`;
            nuevosBloques[key] = disponibilidad.bloques_ocupados || [];
          }
        }

        const hayDatosBackend = Object.values(nuevosBloques).some(
          (bloques) => bloques.length > 0,
        );

        setBloquesOcupados(hayDatosBackend ? nuevosBloques : BLOQUES_MOCK);
      } catch (error) {
        console.warn(
          "No se pudo cargar backend. Se usa mock temporal del calendario.",
          error,
        );
        setEspacios(ESPACIOS_MOCK);
        setBloquesOcupados(BLOQUES_MOCK);
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, [semanaBase]);

  const obtenerBloquesDeDia = (espacioId: number, dia: string) => {
    const key = `${espacioId}-${dia}`;
    return bloquesOcupados[key] || [];
  };

  const handleClickCelda = (espacioId: number, dia: string, hora: string) => {
    const bloquesDia = obtenerBloquesDeDia(espacioId, dia);
    const bloque = obtenerBloqueEnCelda(bloquesDia, hora);

    if (bloque) {
      onConflicto?.(
        `El horario del ${dia} a las ${hora} ya tiene una ${
          bloque.tipo === "clase" ? "clase o entrenamiento" : "reserva"
        } programada.`,
      );
      return;
    }

    onBloqueLibreClick?.(dia, hora);
  };

  return (
    <section className="contenedor-grilla-calendario">
      {cargando && (
        <div className="aviso-carga">Cargando disponibilidad...</div>
      )}

      {espacios.map((espacio) => (
        <div key={espacio.id} className="grilla-espacio">
          <h3>{espacio.nombre}</h3>

          <div className="grilla-calendario">
            <div className="celda-hora encabezado-vacio"></div>

            {DIAS_SEMANA.map((dia) => (
              <div key={dia} className="encabezado-dia">
                {dia}
              </div>
            ))}

            {HORAS_CALENDARIO.map((hora) => (
              <div key={`${espacio.id}-${hora}`} className="fila-calendario">
                <div className="celda-hora">{hora}</div>

                {DIAS_SEMANA.map((dia) => {
                  const bloquesDia = obtenerBloquesDeDia(espacio.id, dia);
                  const bloque = obtenerBloqueEnCelda(bloquesDia, hora);

                  return (
                    <button
                      key={`${espacio.id}-${dia}-${hora}`}
                      className={`celda-calendario ${
                        bloque ? "ocupada" : "libre"
                      }`}
                      onClick={() => handleClickCelda(espacio.id, dia, hora)}
                    >
                      {bloque ? (
                        <div
                          className={`bloque-reserva ${clasePorEspacio(
                            espacio.nombre,
                          )}`}
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
                        <div className="bloque-libre">
                          {modo === "admin" ? "Libre" : "Disponible"}
                        </div>
                      )}
                    </button>
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
