import { getUserFromToken } from "../features/auth/authStore";
import { canAccessRoute, getDefaultRouteForRole } from "../config/routes.config";

export function useRole() {
  const user = getUserFromToken();
  const rol = user?.rol ?? null;

  return {
    rol,
    nombre: user?.nombre,
    email: user?.email,
    isAdmin: rol === "admin",
    isEntrenador: rol === "entrenador",
    isDelegado: rol === "delegado",
    isDeportista: rol === "deportista",
    canAccess: (path: string) => canAccessRoute(rol ?? undefined, path),
    defaultRoute: getDefaultRouteForRole(rol ?? undefined),
  };
}
