export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

type RequestOptions = RequestInit & {
  requiresAdmin?: boolean;
};

function authHeaders(requiresAdmin: boolean): Record<string, string> {
  const base: Record<string, string> = { "Content-Type": "application/json" };
  if (!requiresAdmin) return base;
  const token = localStorage.getItem("ucb_auth_token");
  if (token) base["Authorization"] = `Bearer ${token}`;
  return base;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { requiresAdmin = false, headers, ...rest } = options;

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...rest,
    headers: {
      ...authHeaders(requiresAdmin),
      ...headers,
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message =
      data?.message || data?.error || "Error al consultar el servidor";
    throw new Error(Array.isArray(message) ? message.join(". ") : message);
  }

  return data as T;
}

export function toDateInputValue(date: Date) {
  return date.toISOString().split("T")[0];
}

export function formatFechaBO(date: Date | string) {
  const parsed = typeof date === "string" ? new Date(date) : date;
  const dia = String(parsed.getDate()).padStart(2, "0");
  const mes = String(parsed.getMonth() + 1).padStart(2, "0");
  const anio = parsed.getFullYear();
  return `${dia}/${mes}/${anio}`;
}
