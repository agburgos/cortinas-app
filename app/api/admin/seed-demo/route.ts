import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const TIPOS_DEFAULT = [
  { nombre: "roller", unidad: "m2" },
  { nombre: "sunscreen", unidad: "m2" },
  { nombre: "cortina", unidad: "m2" },
  { nombre: "instalacion", unidad: "unidad" },
  { nombre: "accesorio", unidad: "unidad" },
];

const PRODUCTOS_DEMO = [
  { nombre: "Roller Blackout (demo)", tipo: "roller", marca: "Mantex", precio_m2: 18000, precio_unidad: 0, costo_base: 10000, descripcion: "Oscurece 99%" },
  { nombre: "Roller Sunscreen 5% (demo)", tipo: "roller", marca: "Mantex", precio_m2: 15000, precio_unidad: 0, costo_base: 8500, descripcion: "Filtro solar, vista hacia afuera" },
  { nombre: "Sunscreen 3% (demo)", tipo: "sunscreen", marca: "Vescom", precio_m2: 20000, precio_unidad: 0, costo_base: 11500, descripcion: "Alta transparencia" },
  { nombre: "Cortina Lino (demo)", tipo: "cortina", marca: "Decotex", precio_m2: 22000, precio_unidad: 0, costo_base: 13000, descripcion: "Pliegues franceses" },
  { nombre: "Cortina Blackout Tela (demo)", tipo: "cortina", marca: "Decotex", precio_m2: 25000, precio_unidad: 0, costo_base: 15000, descripcion: "Forro oscurecedor" },
  { nombre: "Instalación básica (demo)", tipo: "instalacion", marca: null, precio_m2: 0, precio_unidad: 15000, costo_base: 10000, descripcion: "Por ventana" },
  { nombre: "Instalación premium (demo)", tipo: "instalacion", marca: null, precio_m2: 0, precio_unidad: 25000, costo_base: 16000, descripcion: "Incluye riel y accesorios" },
  { nombre: "Riel doble (demo)", tipo: "accesorio", marca: "Forma", precio_m2: 0, precio_unidad: 12000, costo_base: 7000, descripcion: "Para cortina + blackout" },
];

const INSTALADORES_DEMO = [
  { nombre: "Julio Guerra (demo)", telefono: "+56912345678", costo_default: 12000 },
  { nombre: "Marcelo Soto (demo)", telefono: "+56923456789", costo_default: 15000 },
  { nombre: "Patricia Vidal (demo)", telefono: "+56934567890", costo_default: 10000 },
];

const CLIENTES_DEMO = [
  { nombre: "María González (demo)", telefono: "+56945612378", email: "demo.maria@example.com", direccion: "Providencia, Santiago" },
  { nombre: "Roberto Fernández (demo)", telefono: "+56956723489", email: "demo.roberto@example.com", direccion: "Las Condes, Santiago" },
  { nombre: "Camila Rojas (demo)", telefono: "+56967834590", email: "demo.camila@example.com", direccion: "Ñuñoa, Santiago" },
  { nombre: "Diego Muñoz (demo)", telefono: "+56978945601", email: "demo.diego@example.com", direccion: "Vitacura, Santiago" },
  { nombre: "Francisca Torres (demo)", telefono: "+56989056712", email: "demo.francisca@example.com", direccion: "La Reina, Santiago" },
  { nombre: "Andrés Pizarro (demo)", telefono: "+56990167823", email: "demo.andres@example.com", direccion: "Maipú, Santiago" },
  { nombre: "Valentina Morales (demo)", telefono: "+56901278934", email: "demo.valentina@example.com", direccion: "San Miguel, Santiago" },
  { nombre: "Felipe Castro (demo)", telefono: "+56912389045", email: "demo.felipe@example.com", direccion: "Peñalolén, Santiago" },
];

const ESTADOS_PAGO = ["pendiente", "parcial", "pagado"] as const;

interface ProductoRow {
  id: string;
  nombre: string;
  tipo: string;
  precio_m2: number;
  precio_unidad: number;
  costo_base: number;
}

function fechaEnMesAtras(mesesAtras: number): Date {
  const hoy = new Date();
  const base = new Date(hoy.getFullYear(), hoy.getMonth() - mesesAtras, 1);
  const dia = 1 + Math.floor(Math.random() * 26);
  base.setDate(dia);
  return base;
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const admin = getSupabaseAdmin();
  const { data: requester, error: authError } = await admin.auth.getUser(token);
  if (authError || !requester?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let { data: tipos } = await admin.from("tipos_producto").select("*");
  if (!tipos?.length) {
    await admin.from("tipos_producto").insert(TIPOS_DEFAULT);
  }

  const { data: existentes } = await admin.from("productos").select("nombre");
  const nombresExistentes = new Set((existentes ?? []).map((p) => p.nombre));
  const faltantes = PRODUCTOS_DEMO.filter((p) => !nombresExistentes.has(p.nombre));
  let productosDemo: ProductoRow[] = [];
  if (faltantes.length) {
    const { data: nuevos, error: errorProductos } = await admin.from("productos").insert(faltantes).select();
    if (errorProductos) {
      return NextResponse.json({ error: "No se pudieron crear productos de prueba: " + errorProductos.message }, { status: 500 });
    }
    productosDemo = nuevos ?? [];
  }

  const { data: todosProductos } = await admin.from("productos").select("*");
  const productosTyped = (todosProductos ?? []) as ProductoRow[];
  if (!productosTyped.length) {
    return NextResponse.json({ error: "No hay productos para generar cotizaciones de prueba" }, { status: 400 });
  }

  const { data: instaladoresExistentes } = await admin.from("instaladores").select("*");
  const nombresInstaladores = new Set((instaladoresExistentes ?? []).map((i) => i.nombre));
  const instaladoresFaltantes = INSTALADORES_DEMO.filter((i) => !nombresInstaladores.has(i.nombre));
  const { data: instaladoresNuevos } = instaladoresFaltantes.length
    ? await admin.from("instaladores").insert(instaladoresFaltantes).select()
    : { data: [] };
  const instaladores = [...(instaladoresExistentes ?? []).filter((i) => i.nombre.endsWith("(demo)")), ...(instaladoresNuevos ?? [])];

  const { data: clientesExistentes } = await admin.from("clientes").select("*");
  const nombresClientes = new Set((clientesExistentes ?? []).map((c) => c.nombre));
  const clientesFaltantes = CLIENTES_DEMO.filter((c) => !nombresClientes.has(c.nombre));
  const { data: clientesNuevos } = clientesFaltantes.length
    ? await admin.from("clientes").insert(clientesFaltantes).select()
    : { data: [] };
  const clientes = [...(clientesExistentes ?? []).filter((c) => c.nombre.endsWith("(demo)")), ...(clientesNuevos ?? [])];
  if (!clientes.length) return NextResponse.json({ error: "No se pudieron crear clientes de prueba" }, { status: 500 });

  let creadas = 0;
  for (let i = 0; i < 16; i++) {
    const mesesAtras = Math.floor(Math.random() * 6);
    const fecha = fechaEnMesAtras(mesesAtras);
    const cliente = clientes[Math.floor(Math.random() * clientes.length)];
    const nItems = 1 + Math.floor(Math.random() * 3);
    const items = [];
    let total = 0;

    for (let j = 0; j < nItems; j++) {
      const p = productosTyped[Math.floor(Math.random() * productosTyped.length)];
      const esM2 = p.precio_m2 > 0;
      if (esM2) {
        const ancho = Math.round((0.8 + Math.random() * 1.7) * 100) / 100;
        const alto = Math.round((1.2 + Math.random() * 1.4) * 100) / 100;
        const cant = 1 + Math.floor(Math.random() * 2);
        const metros = Math.round(ancho * alto * 100) / 100;
        const subtotal = Math.round(metros * p.precio_m2 * cant);
        items.push({
          productoId: p.id, nombre: p.nombre, tipo: p.tipo,
          ancho, alto, metros, cantidad: cant,
          precioUnitario: p.precio_m2, costoUnitario: p.costo_base,
          subtotal, costoSubtotal: Math.round(metros * p.costo_base * cant),
          nota: "", detalle: `${ancho}m x ${alto}m x ${cant}u`,
        });
        total += subtotal;
      } else {
        const cant = 1 + Math.floor(Math.random() * 3);
        const subtotal = cant * p.precio_unidad;
        items.push({
          productoId: p.id, nombre: p.nombre, tipo: p.tipo,
          cantidad: cant, precioUnitario: p.precio_unidad, costoUnitario: p.costo_base,
          subtotal, costoSubtotal: cant * p.costo_base,
          nota: "", detalle: `${cant} unidad(es)`,
        });
        total += subtotal;
      }
    }

    const { data: cotiz } = await admin
      .from("cotizaciones")
      .insert({
        cliente_id: cliente.id, items, total, notas: "", texto_ia: "", estado: "Enviada",
        fecha: fecha.toISOString(),
      })
      .select()
      .single();
    if (!cotiz) continue;

    const estadoPago = ESTADOS_PAGO[Math.floor(Math.random() * ESTADOS_PAGO.length)];
    const montoPagado = estadoPago === "pagado" ? total : estadoPago === "parcial" ? Math.round(total * 0.5) : 0;
    const instalado = Math.random() > 0.3;
    const asignarInstalador = instalado || Math.random() > 0.5;
    const instalador = asignarInstalador && instaladores?.length ? instaladores[Math.floor(Math.random() * instaladores.length)] : null;
    const fechaInstalacion = instalador
      ? new Date(fecha.getTime() + (3 + Math.floor(Math.random() * 12)) * 86400000 + (9 + Math.floor(Math.random() * 8)) * 3600000)
      : null;
    const costoInstalacion = instalador ? [0, 8000, 10000, 12000, 15000][Math.floor(Math.random() * 5)] : 0;

    await admin.from("ventas").insert({
      cotizacion_id: cotiz.id, cliente_id: cliente.id, total,
      estado_pago: estadoPago, monto_pagado: montoPagado,
      instalado, fecha_instalacion: fechaInstalacion?.toISOString() ?? null,
      instalador_id: instalador?.id ?? null, costo_instalacion: costoInstalacion, notas: "",
      fecha: fecha.toISOString(),
    });
    creadas++;
  }

  return NextResponse.json({
    ok: true,
    productos: productosDemo.length,
    instaladores: instaladores?.length ?? 0,
    clientes: clientes.length,
    ventas: creadas,
  });
}
