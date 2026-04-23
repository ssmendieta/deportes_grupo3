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

function GrillaCalendarioSemanal({
  modo,
  semanaBase,
  onBloqueLibreClick,
  onConflicto,
}: Props) {
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [bloquesOcupados, setBloquesOcupados] = useState<
    Record<string, BloqueOcupado[]>
  >({});
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      setCargando(true);
      try {
        const espaciosData = await getEspacios();
        setEspacios(espaciosData);

        // Cargar disponibilidad para cada espacio y cada día de la semana
        const nuevosBloques: Record<string, BloqueOcupado[]> = {};

        for (let i = 0; i < 6; i++) {
          const fecha = fechaParaAPI(semanaBase, i);
          for (const espacio of espaciosData) {
            const disponibilidad = await getDisponibilidad(espacio.id, fecha);
            const key = `${espacio.id}-${DIAS_SEMANA[i]}`;
            nuevosBloques[key] = disponibilidad.bloques_ocupados;
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

  const obtenerBloque = (
    espacioId: number,
    dia: string,
    hora: string,
  ): BloqueOcupado | undefined => {
    const key = `${espacioId}-${dia}`;
    const bloques = bloquesOcupados[key] || [];
    return bloques.find((b: { hora_inicio: string }) => b.hora_inicio === hora);
  };

  const handleClickCelda = (espacioId: number, dia: string, hora: string) => {
    const bloque = obtenerBloque(espacioId, dia, hora);

    if (bloque) {
      onConflicto?.(
        `El horario del ${dia} a las ${hora} ya tiene una ${bloque.tipo === "clase" ? "clase programada" : "reserva"}.`,
      );
      return;
    }

    onBloqueLibreClick?.(dia, hora);
  };

  if (cargando) {
    return <div className="cargando">Cargando calendario...</div>;
  }

  return (
    <section className="contenedor-grilla-calendario">
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
              <div key={hora} className="fila-calendario">
                <div className="celda-hora">{hora}</div>

                {DIAS_SEMANA.map((dia) => {
                  const bloque = obtenerBloque(espacio.id, dia, hora);

                  return (
                    <button
                      key={`${dia}-${hora}`}
                      className={`celda-calendario ${bloque ? "ocupada" : "libre"}`}
                      onClick={() => handleClickCelda(espacio.id, dia, hora)}
                    >
                      {bloque ? (
                        <div
                          className={`bloque-reserva ${bloque.tipo === "clase" ? "clase" : "reserva"}`}
                        >
                          <strong>{espacio.nombre}</strong>
                          <span>
                            {bloque.tipo === "clase"
                              ? "Clase programada"
                              : bloque.motivo}
                          </span>
                          <small>
                            {bloque.hora_inicio} - {bloque.hora_fin}
                          </small>
                        </div>
                      ) : (
                        <div className="bloque-libre">
                          {modo === "estudiante" ? "Disponible" : "Libre"}
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
