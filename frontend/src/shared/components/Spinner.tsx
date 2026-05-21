type Props = {
  texto?: string;
  tamanio?: "sm" | "md" | "lg";
};

function Spinner({ texto, tamanio = "md" }: Props) {
  return (
    <div className={`spinner-container spinner-${tamanio}`} role="status" aria-label="Cargando">
      <div className="spinner" />
      {texto && <p className="spinner-text">{texto}</p>}
    </div>
  );
}

export default Spinner;
