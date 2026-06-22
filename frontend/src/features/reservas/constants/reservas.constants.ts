export const POR_PAGINA = 5;

export const MAX_RESERVA_MINUTOS = 180;
export const MAX_RESERVA_HORAS = 3;

export const SLOT_PASO_MINUTOS = 60;

export const FALLBACK_HORARIO_APERTURA = "14:00";
export const FALLBACK_HORARIO_CIERRE = "18:00";

export const FALLBACK_SLOTS_DESDE = "08:00";
export const FALLBACK_SLOTS_HASTA = "21:00";

export const CI_MAX_LENGTH = 8;
export const NOMBRE_MAX_LENGTH = 100;
export const EMAIL_MAX_LENGTH = 120;
export const COMPLEMENTO_MAX_LENGTH = 5;

export const DIAS_SEMANA = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
] as const;

export const DIA_ABREV: Record<string, string> = {
  Lunes: "LUN",
  Martes: "MAR",
  Miércoles: "MIÉ",
  Jueves: "JUE",
  Viernes: "VIE",
  Sábado: "SÁB",
};

export const DIAS_CALENDARIO = 6;

export const GRID_SLOT_PASO_MINUTOS = 60;

export const HORAS_GRID_FALLBACK = [
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
];

export const HORARIO_VISIBLE_DEFAULT = "14:00 - 18:00";

export const EDIT_TIME_STEP = 1800;

export const COMPLEMENTOS = [
  { value: "", label: "—" },
  { value: "LP", label: "LP (La Paz)" },
  { value: "CB", label: "CB (Cochabamba)" },
  { value: "SC", label: "SC (Santa Cruz)" },
  { value: "CO", label: "CO (Oruro)" },
  { value: "OR", label: "OR (Potosí)" },
  { value: "PT", label: "PT (Pot...)" },
  { value: "TJ", label: "TJ (Tarija)" },
  { value: "BE", label: "BE (Beni)" },
  { value: "PA", label: "PA (Pando)" },
];
