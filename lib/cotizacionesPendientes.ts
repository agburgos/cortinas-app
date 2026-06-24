import { supabase } from "./supabase";

export const ESTADO_SOLICITUD_WEB = "Solicitud web";

export async function contarCotizacionesWebPendientes(): Promise<number> {
  const [{ data: cotizaciones }, { data: ventas }] = await Promise.all([
    supabase.from("cotizaciones").select("id").eq("estado", ESTADO_SOLICITUD_WEB),
    supabase.from("ventas").select("cotizacion_id"),
  ]);
  if (!cotizaciones) return 0;
  const conVenta = new Set((ventas ?? []).map((v) => v.cotizacion_id));
  return cotizaciones.filter((c) => !conVenta.has(c.id)).length;
}
