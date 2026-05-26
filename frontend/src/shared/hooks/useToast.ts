import { useContext } from "react";
import { ToastContext, type ToastContextValue } from "../contexts/ToastContextCore";

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}
