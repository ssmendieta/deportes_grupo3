type Props = {
  mensaje: string;
  tipo: "info" | "error" | "ok";
};

function AlertasCalendario({ mensaje, tipo }: Props) {
  if (!mensaje) return null;

  return <div className={`alerta-calendario ${tipo}`}>{mensaje}</div>;
}

export default AlertasCalendario;
