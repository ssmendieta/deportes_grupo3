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
