import {
  BLOQUES_OCUPADOS_MOCK,
  DIAS_SEMANA,
  HORAS_CALENDARIO,
  type BloqueCalendario,
} from "../../mocks/CalendarioMock";

type Props = {
  modo: "admin" | "estudiante";
  onBloqueLibreClick?: (dia: string, hora: string) => void;
  onConflicto?: (mensaje: string) => void;
};

function obtenerBloque(
  dia: string,
  hora: string,
): BloqueCalendario | undefined {
  return BLOQUES_OCUPADOS_MOCK.find(
    (bloque) => bloque.dia === dia && bloque.inicio === hora,
  );
}

function GrillaCalendarioSemanal({
  modo,
  onBloqueLibreClick,
  onConflicto,
}: Props) {
  const handleClickCelda = (dia: string, hora: string) => {
    const bloque = obtenerBloque(dia, hora);

    if (bloque) {
      onConflicto?.(
        `El horario de ${dia} a las ${hora} ya tiene una reserva o actividad programada.`,
      );
      return;
    }

    onBloqueLibreClick?.(dia, hora);
  };

  return (
    <section className="contenedor-grilla-calendario">
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
              const bloque = obtenerBloque(dia, hora);

              return (
                <button
                  key={`${dia}-${hora}`}
                  className={`celda-calendario ${bloque ? "ocupada" : "libre"}`}
                  onClick={() => handleClickCelda(dia, hora)}
                >
                  {bloque ? (
                    <div className={`bloque-reserva ${bloque.espacio}`}>
                      <strong>
                        {bloque.espacio === "coliseo"
                          ? "Coliseo"
                          : "Arquitectura"}
                      </strong>
                      <span>{bloque.titulo}</span>
                      <small>
                        {bloque.inicio} - {bloque.fin}
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
    </section>
  );
}

export default GrillaCalendarioSemanal;
