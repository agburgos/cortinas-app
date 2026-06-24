import { supabase } from "./supabase";

export const ESTADO_SOLICITUD_WEB = "Solicitud web";

export interface CotizacionPendiente {
  id: string;
  numero: number;
  total: number;
  fecha: string;
  clienteNombre: string;
}

export async function obtenerCotizacionesWebPendientes(): Promise<CotizacionPendiente[]> {
  const [{ data: cotizaciones }, { data: ventas }] = await Promise.all([
    supabase
      .from("cotizaciones")
      .select("id,numero,total,fecha,cliente_id")
      .eq("estado", ESTADO_SOLICITUD_WEB)
      .order("fecha", { ascending: false }),
    supabase.from("ventas").select("cotizacion_id"),
  ]);
  if (!cotizaciones?.length) return [];

  const conVenta = new Set((ventas ?? []).map((v) => v.cotizacion_id));
  const pendientes = cotizaciones.filter((c) => !conVenta.has(c.id));
  if (!pendientes.length) return [];

  const clienteIds = [...new Set(pendientes.map((c) => c.cliente_id).filter(Boolean))] as string[];
  const nombrePorId = new Map<string, string>();
  if (clienteIds.length) {
    const { data: clientes } = await supabase.from("clientes").select("id,nombre").in("id", clienteIds);
    (clientes ?? []).forEach((c) => nombrePorId.set(c.id, c.nombre));
  }

  return pendientes.map((c) => ({
    id: c.id,
    numero: c.numero,
    total: c.total,
    fecha: c.fecha,
    clienteNombre: c.cliente_id ? nombrePorId.get(c.cliente_id) ?? "Cliente" : "Sin cliente",
  }));
}
