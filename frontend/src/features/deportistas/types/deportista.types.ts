export type EstadoCuenta = "al_dia" | "pendiente" | "no_aplica";

export type TipoDeportista = "estudiante_ucb" | "academia" | "competitivo" | "exonerado";

export type DisciplinaRaw = {
  id: number;
  nombre: string;
  activo: boolean;
};

export type InscripcionRaw = {
  id: number;
  deportista_id: number;
  disciplina_id: number;
  categoria?: string | null;
  fecha_inscripcion: string;
  estado: "activo" | "inactivo";
  disciplina?: DisciplinaRaw | null;
};

export type DeportistaRaw = {
  id: number;
  tipo: string;
  nombres: string | null;
  ape_paterno: string | null;
  ape_materno: string | null;
  ci: number;
  complemento?: string | null;
  celular: string;
  fecha_nacimiento?: string | null;
  email?: string | null;
  talla_ropa?: string | null;
  id_carrera?: number | null;
  carrera?: string | null;
  semestre?: number | null;
  colegio_instituto?: string | null;
  curso?: string | null;
  activo: boolean;
  inscripciones?: InscripcionRaw[];
  estado_cuenta?: EstadoCuenta;
  deuda?: number;
};

export type DeportistasRawResponse = {
  data: DeportistaRaw[];
  total: number;
  page: number;
  limit: number;
};

export type Disciplina = {
  id: number;
  nombre: string;
  activo: boolean;
};

export type Inscripcion = {
  id: number;
  deportistaId: number;
  disciplinaId: number;
  categoria?: string | null;
  fechaInscripcion: string;
  activo: boolean;
  disciplina?: Disciplina | null;
};

export type Deportista = {
  id: number;
  tipo: TipoDeportista;
  nombreCompleto: string;
  nombres?: string | null;
  apePaterno?: string | null;
  apeMaterno?: string | null;
  ci: string;
  complemento?: string | null;
  celular: string;
  fechaNacimiento?: string | null;
  email?: string | null;
  tallaRopa?: string | null;
  idCarrera?: number | null;
  carrera?: string | null;
  semestre?: number | null;
  colegioInstituto?: string | null;
  curso?: string | null;
  activo: boolean;
  inscripciones?: Inscripcion[];
  estadoCuenta?: EstadoCuenta;
  deuda?: number;
};

export type DeportistaFormData = {
  nombres: string;
  ape_paterno: string;
  ape_materno: string;
  ci: string;
  complemento?: string;
  celular: string;
  fechaNacimiento?: string;
  email?: string;
  tipo: TipoDeportista;
  tallaRopa?: string;
  idCarrera?: number;
  carrera?: string;
  semestre?: string;
  colegioInstituto?: string;
  curso?: string;
  activo: boolean;
  disciplinaId?: number;
  categoria?: string;
};

export type PagoRaw = {
  id: number;
  deportista_id: number;
  concepto_id: number;
  monto: number | string;
  mes: number | null;
  anio: number | null;
  fecha_pago: string;
  comprobante: string | null;
  origen: string;
  estado: "confirmado" | "anulado";
  observaciones: string | null;
  concepto: {
    id: number;
    nombre: string;
    monto: number | string;
    periodicidad: string | null;
  };
};

export type PagoHistorial = {
  id: number;
  mes: string;
  anio: number;
  concepto: string;
  monto: number;
  estado: "confirmado" | "anulado";
  fechaPago?: string;
  observaciones?: string;
  anulado: boolean;
};
