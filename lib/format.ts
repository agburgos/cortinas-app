export function fmt(n: number): string {
  return '$' + Math.round(n).toLocaleString('es-CL');
}

export function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
