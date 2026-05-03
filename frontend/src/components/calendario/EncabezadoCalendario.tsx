type Props = {
  titulo: string;
  subtitulo: string;
  textoBoton?: string;
  onClickBoton?: () => void;
};

function EncabezadoCalendario({
  titulo,
  subtitulo,
  textoBoton,
  onClickBoton,
}: Props) {
  return (
    <header className="encabezado-calendario">
      <div className="encabezado-calendario__texto">
        <p className="encabezado-calendario__marca">
          Universidad Católica Boliviana
        </p>
        <h1>{titulo}</h1>
        <p className="encabezado-calendario__subtitulo">{subtitulo}</p>
      </div>

      {textoBoton && onClickBoton && (
        <div className="encabezado-calendario__acciones">
          <button className="boton-principal" onClick={onClickBoton}>
            {textoBoton}
          </button>
        </div>
      )}
    </header>
  );
}

export default EncabezadoCalendario;
