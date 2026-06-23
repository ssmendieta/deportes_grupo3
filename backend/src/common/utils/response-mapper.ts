export function renameFields<T>(raw: any, mapping: Record<string, string>): T {
  const result: any = {};
  for (const [target, source] of Object.entries(mapping)) {
    result[target] = raw[source];
  }
  return result as T;
}

export function nombreCompleto(nombres: string, apePaterno: string, apeMaterno?: string): string {
  return `${nombres ?? ''} ${apePaterno ?? ''} ${apeMaterno ?? ''}`.trim();
}

export function formatTime(dt: Date | null | undefined): string {
  if (!dt) return '';
  const h = dt.getUTCHours().toString().padStart(2, '0');
  const m = dt.getUTCMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

const MESES_BO = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export function formatFechaBO(fecha: Date | string | null | undefined): string {
  if (!fecha) return 'N/A';
  const d = typeof fecha === 'string' ? new Date(`${fecha}T12:00:00.000Z`) : fecha;
  if (Number.isNaN(d.getTime())) return 'N/A';
  const dia = d.getUTCDate();
  const mes = MESES_BO[d.getUTCMonth()];
  const anio = d.getUTCFullYear();
  return `${dia} de ${mes} de ${anio}`;
}
