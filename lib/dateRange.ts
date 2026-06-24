export interface RangoFechas {
  desde: string;
  hasta: string;
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function rangoUltimosMeses(meses: number): RangoFechas {
  const hoy = new Date();
  const desde = new Date(hoy.getFullYear(), hoy.getMonth() - (meses - 1), 1);
  return { desde: ymd(desde), hasta: ymd(hoy) };
}

export function rangoEsteMes(): RangoFechas {
  const hoy = new Date();
  return { desde: ymd(new Date(hoy.getFullYear(), hoy.getMonth(), 1)), hasta: ymd(hoy) };
}

export function rangoEsteAnio(): RangoFechas {
  const hoy = new Date();
  return { desde: ymd(new Date(hoy.getFullYear(), 0, 1)), hasta: ymd(hoy) };
}

export function fechaEnRango(fecha: string, rango: RangoFechas): boolean {
  const f = fecha.slice(0, 10);
  if (rango.desde && f < rango.desde) return false;
  if (rango.hasta && f > rango.hasta) return false;
  return true;
}

export function mesesEntre(desde: string, hasta: string): { key: string; label: string; year: number; month: number }[] {
  const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const start = new Date(desde + "T00:00:00");
  const end = new Date(hasta + "T00:00:00");
  const meses: { key: string; label: string; year: number; month: number }[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const limite = new Date(end.getFullYear(), end.getMonth(), 1);
  let guard = 0;
  while (cursor <= limite && guard < 36) {
    meses.push({
      key: `${cursor.getFullYear()}-${cursor.getMonth()}`,
      label: `${MESES_CORTOS[cursor.getMonth()]} ${String(cursor.getFullYear()).slice(2)}`,
      year: cursor.getFullYear(),
      month: cursor.getMonth(),
    });
    cursor.setMonth(cursor.getMonth() + 1);
    guard++;
  }
  return meses;
}
