import StatusBadge from "../../../shared/components/StatusBadge";
import type { EstadoDisciplina } from "../types/disciplina.types";

type Props = { estado: EstadoDisciplina };

function EstadoDisciplinaBadge({ estado }: Props) {
  return <StatusBadge tone={estado === "activa" ? "success" : "muted"}>{estado === "activa" ? "Activa" : "Inactiva"}</StatusBadge>;
}

export default EstadoDisciplinaBadge;
