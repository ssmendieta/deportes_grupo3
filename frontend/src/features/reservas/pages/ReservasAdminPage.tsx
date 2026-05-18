import { useNavigate } from "react-router-dom";
import PageHeader from "../../../shared/components/PageHeader";
import AdminReserva from "../components/AdminReserva";

function ReservasAdminPage() {
  const navigate = useNavigate();

  return (
    <div className="page-stack">
      <div className="inline-actions">
        <button className="btn btn-ghost" onClick={() => navigate("/calendario")}>← Volver</button>
      </div>
      <PageHeader title="Panel de reservas" description="Revisa solicitudes, comprobantes y detalles de reservas deportivas." />
      <AdminReserva />
    </div>
  );
}

export default ReservasAdminPage;
