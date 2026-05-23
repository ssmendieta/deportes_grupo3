import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { getUserFromToken } from "../../features/auth/authStore";

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

interface SidebarProps {
  onLogout: () => void;
}

function Sidebar({ onLogout }: SidebarProps) {
  const [open, setOpen] = useState(false);
  const user = getUserFromToken();

  return (
    <>
      <button className="sidebar-toggle" onClick={() => setOpen(!open)} aria-label="Menú">
        ☰
      </button>

      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} />}

      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-header">
          <span className="sidebar-logo">Deportes UCB</span>
          <button className="sidebar-close" onClick={() => setOpen(false)}>✕</button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/dashboard"}
              className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {user?.email ? (
            <Link to="/perfil" className="sidebar-user" onClick={() => setOpen(false)}>
              {user.email}
            </Link>
          ) : null}
          <button className="sidebar-logout" onClick={onLogout}>
            Salir
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
