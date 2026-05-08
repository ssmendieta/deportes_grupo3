import type { Disciplina, Entrenador } from "../types/disciplina.types";

export const entrenadoresMock: Entrenador[] = [
  { id: 1, nombre: "Prof. X" },
  { id: 2, nombre: "Coach Juan" },
  { id: 3, nombre: "Lic. Mariana" },
  { id: 4, nombre: "Entrenador por asignar" },
];

export const disciplinasMock: Disciplina[] = [
  {
    id: 1,
    nombre: "Voleibol",
    descripcion: "Academia de voleibol para estudiantes.",
    tipo: "academia",
    categorias: "Sub-14, Mayores",
    mensualidad: 130,
    estado: "activa",
    entrenadorId: 1,
    entrenador: { id: 1, nombre: "Prof. X" },
  },
  {
    id: 2,
    nombre: "Básquetbol",
    descripcion: "Entrenamiento competitivo.",
    tipo: "competitivo",
    categorias: "Mayores",
    mensualidad: 150,
    estado: "activa",
    entrenadorId: 2,
    entrenador: { id: 2, nombre: "Coach Juan" },
  },
  {
    id: 3,
    nombre: "Ajedrez",
    descripcion: "Clase libre para estudiantes.",
    tipo: "clase_libre",
    categorias: "Todas",
    mensualidad: 80,
    estado: "inactiva",
    entrenadorId: null,
    entrenador: null,
  },
];
