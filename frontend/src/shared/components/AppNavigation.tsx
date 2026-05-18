import { NavLink } from "react-router-dom";

type NavItem = {
  path: string;
  label: string;
};

const navItems: NavItem[] = [
  { path: "/dashboard", label: "Dashboard" },
  { path: "/calendario", label: "Calendario" },
  { path: "/deportistas", label: "Deportistas" },
  { path: "/pagos", label: "Pagos" },
  { path: "/disciplinas", label: "Disciplinas" },
];

function AppNavigation() {
  return (
    <nav className="app-nav" aria-label="Navegación principal">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }: { isActive: boolean }) => isActive ? "nav-pill active" : "nav-pill"}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default AppNavigation;
