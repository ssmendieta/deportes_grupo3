import { API_URL } from "./apiClient";

const TOKEN_KEY = "ucb_auth_token";

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export const descargarReporte = async (
  endpoint: string,
  formato: "pdf" | "excel",
  filtros: Record<string, unknown> = {},
  nombreArchivo: string,
): Promise<void> => {
  const params = new URLSearchParams({ formato });
  for (const [key, value] of Object.entries(filtros)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }

  const url = `${API_URL}/api${endpoint}?${params.toString()}`;
  const response = await fetch(url, { headers: authHeaders() });

  if (!response.ok) {
    throw new Error("Error al descargar el reporte");
  }

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = `${nombreArchivo}.${formato === "pdf" ? "pdf" : "xlsx"}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
};