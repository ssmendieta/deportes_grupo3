import type { VistaPrincipal } from "../types/navigation.types";

type NavItem = {
  id: VistaPrincipal;
  label: string;
};

type Props = {
  vistaActual: VistaPrincipal;
  onNavigate: (vista: VistaPrincipal) => void;
};

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "calendario", label: "Calendario" },
  { id: "deportistas", label: "Deportistas" },
  { id: "pagos", label: "Pagos" },
  { id: "disciplinas", label: "Disciplinas" },
];

function AppNavigation({ vistaActual, onNavigate }: Props) {
  return (
    <nav className="app-nav" aria-label="Navegación principal">
      {navItems.map((item) => (
        <button
          key={item.id}
          className={vistaActual === item.id ? "nav-pill active" : "nav-pill"}
          onClick={() => onNavigate(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}

export default AppNavigation;
