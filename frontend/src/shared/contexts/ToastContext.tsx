import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";

type ToastType = "success" | "error" | "info";

type Toast = {
  id: number;
  mensaje: string;
  tipo: ToastType;
};

type ToastContextValue = {
  toasts: Toast[];
  success: (mensaje: string) => void;
  error: (mensaje: string) => void;
  info: (mensaje: string) => void;
  remover: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remover = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const agregar = useCallback(
    (mensaje: string, tipo: ToastType) => {
      const id = ++nextId;
      setToasts((prev) => [...prev, { id, mensaje, tipo }]);
      setTimeout(() => remover(id), 3500);
    },
    [remover],
  );

  const success = useCallback((mensaje: string) => agregar(mensaje, "success"), [agregar]);
  const error = useCallback((mensaje: string) => agregar(mensaje, "error"), [agregar]);
  const info = useCallback((mensaje: string) => agregar(mensaje, "info"), [agregar]);

  return (
    <ToastContext.Provider value={{ toasts, success, error, info, remover }}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.tipo}`} role="alert">
            <span>{t.mensaje}</span>
            <button className="toast-close" onClick={() => remover(t.id)} aria-label="Cerrar">×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}
