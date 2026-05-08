import PageHeader from "../../../shared/components/PageHeader";
import StatCard from "../../../shared/components/StatCard";
import type { VistaPrincipal } from "../../../shared/types/navigation.types";

type Props = {
  onNavigate: (vista: VistaPrincipal) => void;
};

function DashboardAdminPage({ onNavigate }: Props) {
  const quickAccess: { label: string; helper: string; vista: VistaPrincipal }[] = [
    { label: "Registrar deportista", helper: "Alta de nuevos deportistas", vista: "deportistas" },
    { label: "Verificar pagos", helper: "Estado de pagos y cuentas", vista: "pagos" },
    { label: "Gestionar disciplinas", helper: "CRUD, estados y entrenadores", vista: "disciplinas" },
    { label: "Calendario", helper: "Vista admin y estudiante", vista: "calendario" },
  ];

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Panel administrativo"
        title="Departamento de Deportes"
        description="Respaldo frontal integrado para Sprint 2: calendario, deportistas, pagos y disciplinas."
      />

      <section className="stats-grid">
        <StatCard label="Deportistas registrados" value={42} helper="Demo visual" />
        <StatCard label="Pagos pendientes" value={18} tone="yellow" />
        <StatCard label="Morosos" value={9} tone="red" />
        <StatCard label="Disciplinas activas" value={12} tone="green" />
      </section>

      <section className="panel-card">
        <div className="section-heading">
          <span>Accesos rápidos</span>
          <h2>Ir directamente a una pantalla</h2>
        </div>

        <div className="quick-grid">
          {quickAccess.map((item) => (
            <button key={item.label} className="quick-card" onClick={() => onNavigate(item.vista)}>
              <strong>{item.label}</strong>
              <span>{item.helper}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export default DashboardAdminPage;
