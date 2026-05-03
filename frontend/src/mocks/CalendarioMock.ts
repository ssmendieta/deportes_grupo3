export type TipoEspacio = "coliseo" | "arquitectura";

export type BloqueCalendario = {
  id: string;
  espacio: TipoEspacio;
  dia: string;
  inicio: string;
  fin: string;
  titulo: string;
  estado: "ocupado" | "actividad";
};

export const DIAS_SEMANA = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export const HORAS_CALENDARIO = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
  "23:00",
];

// =========================
// MOCK TEMPORAL PARA FRONT
// Reemplazar este bloque por datos traídos desde los endpoints del backend.
// Endpoint esperado:
// GET /api/horarios-disponibles/:espacioId?fecha=YYYY-MM-DD
// =========================
export const BLOQUES_OCUPADOS_MOCK: BloqueCalendario[] = [
  {
    id: "1",
    espacio: "coliseo",
    dia: "Lunes",
    inicio: "08:00",
    fin: "10:00",
    titulo: "Reserva previa",
    estado: "ocupado",
  },
  {
    id: "2",
    espacio: "arquitectura",
    dia: "Martes",
    inicio: "10:00",
    fin: "12:00",
    titulo: "Actividad programada",
    estado: "actividad",
  },
  {
    id: "3",
    espacio: "coliseo",
    dia: "Miércoles",
    inicio: "16:00",
    fin: "18:00",
    titulo: "Reserva previa",
    estado: "ocupado",
  },
  {
    id: "4",
    espacio: "arquitectura",
    dia: "Viernes",
    inicio: "14:00",
    fin: "16:00",
    titulo: "Actividad deportiva",
    estado: "actividad",
  },
  {
    id: "5",
    espacio: "coliseo",
    dia: "Sábado",
    inicio: "09:00",
    fin: "11:00",
    titulo: "Reserva previa",
    estado: "ocupado",
  },
];
// =========================
// FIN MOCK TEMPORAL
// Cuando backend esté conectado, eliminar esta data local
// y usar la respuesta del servicio reservaService.ts
// =========================
