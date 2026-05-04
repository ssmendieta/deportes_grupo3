type Props = {
  etiquetaSemana: string;
  onSemanaAnterior: () => void;
  onSemanaSiguiente: () => void;
};

function NavegacionSemana({
  etiquetaSemana,
  onSemanaAnterior,
  onSemanaSiguiente,
}: Props) {
  return (
    <section className="navegacion-semana">
      <button className="boton-secundario-chico" onClick={onSemanaAnterior}>
        ←
      </button>

      <div className="navegacion-semana__etiqueta">{etiquetaSemana}</div>

      <button className="boton-secundario-chico" onClick={onSemanaSiguiente}>
        →
      </button>
    </section>
  );
}

export default NavegacionSemana;
