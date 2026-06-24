import { supabase } from "./supabase";
import { Configuracion } from "./types";

export async function getConfiguracion(): Promise<Configuracion | null> {
  const { data } = await supabase.from("configuracion").select("*").eq("id", 1).maybeSingle();
  return data ?? null;
}

export function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace("#", "").match(/.{1,2}/g);
  if (!m) return [0, 0, 0];
  return [parseInt(m[0], 16), parseInt(m[1], 16), parseInt(m[2], 16)];
}
