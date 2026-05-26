import { createContext } from "react";

type Toast = {
  id: number;
  mensaje: string;
  tipo: "success" | "error" | "info";
};

export type ToastContextValue = {
  toasts: Toast[];
  success: (mensaje: string) => void;
  error: (mensaje: string) => void;
  info: (mensaje: string) => void;
  remover: (id: number) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);
