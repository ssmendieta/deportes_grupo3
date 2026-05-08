type Props = {
  etiquetaSemana: string;
  onSemanaAnterior: () => void;
  onSemanaSiguiente: () => void;
};

function NavegacionSemana({ etiquetaSemana, onSemanaAnterior, onSemanaSiguiente }: Props) {
  return (
    <section className="week-nav">
      <button className="icon-button" onClick={onSemanaAnterior}>←</button>
      <strong>{etiquetaSemana}</strong>
      <button className="icon-button" onClick={onSemanaSiguiente}>→</button>
    </section>
  );
}

export default NavegacionSemana;
