import { useNavigate } from "react-router-dom";
import PageHeader from "../../../shared/components/PageHeader";
import ReservaForm from "../components/ReservaForm";

function NuevaReservaPage() {
  const navigate = useNavigate();

  const handleReservaCreada = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="page-stack">
      <div className="inline-actions">
        <button className="btn btn-ghost" onClick={() => navigate("/reservas")}>
          ← Volver al panel
        </button>
      </div>

      <PageHeader
        title="Nueva reserva"
        description="Registra una reserva deportiva y genera automáticamente su comprobante PDF."
      />

      <ReservaForm onReservaCreada={handleReservaCreada} />
    </div>
  );
}

export default NuevaReservaPage;