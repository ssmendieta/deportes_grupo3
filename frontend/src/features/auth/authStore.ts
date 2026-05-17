const TOKEN_KEY = "ucb_auth_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;
  try {
    const payload = parsePayload(token);
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      clearToken();
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function parsePayload(token: string): Record<string, unknown> {
  const base64 = token.split(".")[1];
  const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(json);
}

export function getUserFromToken(): { nombre?: string; email?: string; rol?: string } | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = parsePayload(token);
    return {
      nombre: (payload.nombre ?? payload.name ?? payload.sub) as string | undefined,
      email: payload.email as string | undefined,
      rol: (payload.rol ?? payload.role) as string | undefined,
    };
  } catch {
    return null;
  }
}
