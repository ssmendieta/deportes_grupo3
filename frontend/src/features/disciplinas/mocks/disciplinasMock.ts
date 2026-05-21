import type { Disciplina } from "../types/disciplina.types";

export const disciplinasMock: Disciplina[] = [
  {
    id: 1,
    nombre: "Voleibol",
    descripcion: "Academia de voleibol para estudiantes.",
    categorias: "Sub-14, Mayores",
    mensualidad: 130,
    estado: "activa",
  },
  {
    id: 2,
    nombre: "Básquetbol",
    descripcion: "Entrenamiento competitivo.",
    categorias: "Mayores",
    mensualidad: 150,
    estado: "activa",
  },
  {
    id: 3,
    nombre: "Ajedrez",
    descripcion: "Clase libre para estudiantes.",
    categorias: "Todas",
    mensualidad: 80,
    estado: "inactiva",
  },
];
