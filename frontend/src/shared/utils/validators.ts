const CI_REGEX = /^\d{5,10}(-[A-Z0-9]{1,2})?$/;
const TELEFONO_REGEX = /^\d{7,8}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarCI(ci: string): string | null {
  if (!ci.trim()) return "El CI es obligatorio.";
  if (!CI_REGEX.test(ci.trim())) return "Formato de CI inválido (ej. 1234567 o 1234567-1L).";
  return null;
}

export function validarTelefono(tel: string): string | null {
  if (!tel.trim()) return null;
  if (!TELEFONO_REGEX.test(tel.trim())) return "El teléfono debe tener 7 u 8 dígitos (ej. 71234567).";
  return null;
}

export function validarEmail(email: string): string | null {
  if (!email.trim()) return null;
  if (!EMAIL_REGEX.test(email.trim())) return "Correo electrónico inválido.";
  return null;
}

export function validarNombreCompleto(nombre: string, campo = "Nombre"): string | null {
  if (!nombre.trim()) return `${campo} es obligatorio.`;
  if (nombre.trim().length < 2) return `${campo} debe tener al menos 2 caracteres.`;
  return null;
}

export function validarRequerido(valor: string, campo: string): string | null {
  if (!valor.toString().trim()) return `${campo} es obligatorio.`;
  return null;
}

export type ErroresForm = Record<string, string | null>;

export function mostrarError(errores: ErroresForm, campo: string): string | null {
  return errores[campo] ?? null;
}
