import { clasePorEspacio } from "../components/GrillaCalendarioSemanal.js";

type Props = {
  espacios: { id: number; nombre: string }[];
};

function LeyendaCalendario({ espacios }: Props) {
  return (
    <div className="gc-legend">
      {espacios.map((esp) => (
        <div key={esp.id} className="gc-legend-item">
          <span className={`gc-legend-dot ${clasePorEspacio(esp.nombre)}`} />
          {esp.nombre}
        </div>
      ))}
    </div>
  );
}

export default LeyendaCalendario;
