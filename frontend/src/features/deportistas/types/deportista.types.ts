export type EstadoCuenta = "al_dia" | "pendiente" | "moroso" | "exonerado";
export type TipoDeportista = "academia" | "clase_libre" | "competitivo";

export type PagoHistorial = {
  id: number;
  mes: string;
  anio: number;
  concepto: string;
  monto: number;
  estado: EstadoCuenta;
  fechaPago?: string;
  observaciones?: string;
};

export type Deportista = {
  id: number;
  nombreCompleto: string;
  ci: string;
  fechaNacimiento: string;
  genero: string;
  telefono: string;
  email: string;
  direccion: string;
  carrera: string;
  semestre: number;
  tipo: TipoDeportista;
  disciplina: string;
  categoria: string;
  nivel: string;
  matriculaActiva: boolean;
  tallaCamiseta: string;
  activo: boolean;
  mesActual: string;
  estadoCuenta: EstadoCuenta;
  deuda: number;
  historialPagos: PagoHistorial[];
};

export type DeportistaFormData = {
  nombreCompleto: string;
  ci: string;
  fechaNacimiento: string;
  genero: string;
  telefono: string;
  email: string;
  direccion: string;
  carrera: string;
  semestre: string;
  tipo: TipoDeportista;
  disciplina: string;
  categoria: string;
  nivel: string;
  matriculaActiva: boolean;
  tallaCamiseta: string;
  activo: boolean;
};
