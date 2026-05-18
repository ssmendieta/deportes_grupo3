import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../shared/components/PageHeader";
import StatCard from "../../../shared/components/StatCard";
import { apiRequest } from "../../../shared/services/apiClient";
import { listarDeportistas } from "../../deportistas/services/deportistaService";

type Stats = {
  totalDeportistas: number;
  pagosPendientes: number;
  noAplica: number;
  disciplinasActivas: number;
};

function DashboardAdminPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalDeportistas: 0,
    pagosPendientes: 0,
    noAplica: 0,
    disciplinasActivas: 0,
  });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarStats = async () => {
      try {
        const [deportistas, disciplinas] = await Promise.all([
          listarDeportistas(),
          apiRequest<{ id: number; activo: boolean }[]>(
            "/api/disciplinas?activo=true",
            { requiresAdmin: true },
          ),
        ]);

        setStats({
          totalDeportistas: deportistas.length,
          pagosPendientes: deportistas.filter(
            (d) => d.estadoCuenta === "pendiente",
          ).length,
          noAplica: deportistas.filter((d) => d.estadoCuenta === "no_aplica")
            .length,
          disciplinasActivas: disciplinas.length,
        });
      } catch (e) {
        console.error("Error cargando stats del dashboard", e);
      } finally {
        setCargando(false);
      }
    };

    const timeoutId = window.setTimeout(() => {
      void cargarStats();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const quickAccess: { label: string; helper: string; path: string }[] = [
    {
      label: "Registrar deportista",
      helper: "Alta de nuevos deportistas",
      path: "/deportistas",
    },
    {
      label: "Verificar pagos",
      helper: "Estado de pagos y cuentas",
      path: "/pagos",
    },
    {
      label: "Gestionar disciplinas",
      helper: "CRUD y estados de disciplinas",
      path: "/disciplinas",
    },
    {
      label: "Calendario",
      helper: "Vista admin y estudiante",
      path: "/calendario",
    },
  ];

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Panel administrativo"
        title="Departamento de Deportes"
        description="Gestión de deportistas, pagos, disciplinas y calendario."
      />

      <section className="stats-grid">
        <StatCard
          label="Deportistas registrados"
          value={cargando ? "..." : stats.totalDeportistas}
          helper="en el sistema"
        />
        <StatCard
          label="Pagos pendientes"
          value={cargando ? "..." : stats.pagosPendientes}
          tone="yellow"
          helper="academia"
        />
        <StatCard
          label="No aplica pago"
          value={cargando ? "..." : stats.noAplica}
          tone="green"
          helper="UCB y competitivos"
        />
        <StatCard
          label="Disciplinas activas"
          value={cargando ? "..." : stats.disciplinasActivas}
          tone="green"
          helper="disciplinas"
        />
      </section>

      <section className="panel-card">
        <div className="section-heading">
          <span>Accesos rápidos</span>
          <h2>Ir directamente a una pantalla</h2>
        </div>

        <div className="quick-grid">
          {quickAccess.map((item) => (
            <button
              key={item.label}
              className="quick-card"
              onClick={() => navigate(item.path)}
            >
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
