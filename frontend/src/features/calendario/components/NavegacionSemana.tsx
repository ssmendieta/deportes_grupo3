type Props = {
  etiquetaSemana: string;
  onSemanaAnterior: () => void;
  onSemanaSiguiente: () => void;
};

function NavegacionSemana({ etiquetaSemana, onSemanaAnterior, onSemanaSiguiente }: Props) {
  return (
    <div className="gc-week-nav">
      <button onClick={onSemanaAnterior} aria-label="Semana anterior">‹</button>
      <span className="gc-week-label">{etiquetaSemana}</span>
      <button onClick={onSemanaSiguiente} aria-label="Semana siguiente">›</button>
    </div>
  );
}

export default NavegacionSemana;
