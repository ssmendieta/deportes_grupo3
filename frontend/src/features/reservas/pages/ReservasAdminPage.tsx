import PageHeader from "../../../shared/components/PageHeader";
import AdminReserva from "../components/AdminReserva";

type Props = {
  onVolver: () => void;
  onCrearReserva: () => void;
};

function ReservasAdminPage({ onVolver, onCrearReserva }: Props) {
  return (
    <div className="page-stack">
      <div className="inline-actions">
        <button className="btn btn-ghost" onClick={onVolver}>← Volver</button>
      </div>
      <PageHeader title="Panel de reservas" description="Revisa solicitudes, comprobantes y detalles de reservas deportivas." />
      <AdminReserva onCrearReserva={onCrearReserva} />
    </div>
  );
}

export default ReservasAdminPage;
