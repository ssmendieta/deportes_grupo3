export type RouteConfig = {
  path: string;
  label: string;
  iconKey: string;
  allowedRoles: string[];
};

export const ROUTES: RouteConfig[] = [
  { path: "/dashboard", label: "Dashboard", iconKey: "dashboard", allowedRoles: ["admin"] },
  { path: "/calendario", label: "Calendario", iconKey: "calendario", allowedRoles: ["admin", "entrenador", "delegado", "deportista"] },
  { path: "/deportistas", label: "Deportistas", iconKey: "deportistas", allowedRoles: ["admin", "entrenador"] },
  { path: "/pagos", label: "Pagos", iconKey: "pagos", allowedRoles: ["admin", "entrenador"] },
  { path: "/disciplinas", label: "Disciplinas", iconKey: "disciplinas", allowedRoles: ["admin", "entrenador"] },
  { path: "/reservas", label: "Reservas", iconKey: "reservas", allowedRoles: ["admin", "entrenador"] },
];

export const DEFAULT_ROUTE_BY_ROLE: Record<string, string> = {
  admin: "/dashboard",
  entrenador: "/calendario",
  delegado: "/calendario",
  deportista: "/calendario",
};

export function canAccessRoute(rol: string | undefined, path: string): boolean {
  if (!rol) return false;
  const route = ROUTES.find((r) => r.path === path);
  if (!route) return true;
  return route.allowedRoles.includes(rol);
}

export function getVisibleRoutes(rol: string | undefined): RouteConfig[] {
  if (!rol) return [];
  return ROUTES.filter((r) => r.allowedRoles.includes(rol));
}

export function getDefaultRouteForRole(rol: string | undefined): string {
  if (!rol) return "/calendario";
  return DEFAULT_ROUTE_BY_ROLE[rol] || "/calendario";
}
