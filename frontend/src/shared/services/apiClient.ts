export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const ADMIN_HEADERS = {
  "Content-Type": "application/json",
  "x-rol": "admin",
};

type RequestOptions = RequestInit & {
  requiresAdmin?: boolean;
};

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { requiresAdmin = false, headers, ...rest } = options;

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...rest,
    headers: {
      ...(requiresAdmin ? ADMIN_HEADERS : { "Content-Type": "application/json" }),
      ...headers,
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.message || data?.error || "Error al consultar el servidor";
    throw new Error(Array.isArray(message) ? message.join(". ") : message);
  }

  return data as T;
}

export function toDateInputValue(date: Date) {
  return date.toISOString().split("T")[0];
}

export function formatFechaBO(date: Date | string) {
  const parsed = typeof date === "string" ? new Date(date) : date;
  return parsed.toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
