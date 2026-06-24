import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { construirCotizacionPDF, nombreArchivoCotizacion } from "@/lib/pdf";
import { CotizacionItem, Producto } from "@/lib/types";
import { fmt } from "@/lib/format";

const NOTIFICAR_A = "claudia.burgosc@gmail.com";

interface ItemInput {
  productoId: string;
  ancho?: number;
  alto?: number;
  cantidad: number;
  nota?: string;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { nombre, email, telefono, notas, items } = body as {
    nombre: string;
    email: string;
    telefono?: string;
    notas?: string;
    items: ItemInput[];
  };

  if (!nombre?.trim() || !email?.trim() || !items?.length) {
    return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  const { data: productos, error: prodError } = await admin
    .from("productos")
    .select("*")
    .in(
      "id",
      items.map((it) => it.productoId)
    );
  if (prodError || !productos) {
    return NextResponse.json({ error: "No se pudo leer el catálogo" }, { status: 500 });
  }

  // Recalcula precios server-side: nunca confiar en montos enviados por el cliente.
  const itemsCalculados: CotizacionItem[] = [];
  for (const it of items) {
    const p = productos.find((x: Producto) => x.id === it.productoId);
    if (!p) continue;
    const esM2 = p.precio_m2 > 0;
    if (esM2) {
      const ancho = it.ancho || 0;
      const alto = it.alto || 0;
      const cant = it.cantidad || 1;
      const metros = ancho * alto;
      if (!metros) continue;
      const subtotal = metros * p.precio_m2 * cant;
      itemsCalculados.push({
        productoId: p.id,
        nombre: p.nombre,
        tipo: p.tipo,
        ancho,
        alto,
        metros,
        cantidad: cant,
        precioUnitario: p.precio_m2,
        costoUnitario: p.costo_base,
        subtotal,
        costoSubtotal: metros * p.costo_base * cant,
        nota: it.nota || "",
        detalle: `${ancho}m × ${alto}m × ${cant}u`,
      });
    } else {
      const cant = it.cantidad || 1;
      const subtotal = cant * p.precio_unidad;
      itemsCalculados.push({
        productoId: p.id,
        nombre: p.nombre,
        tipo: p.tipo,
        cantidad: cant,
        precioUnitario: p.precio_unidad,
        costoUnitario: p.costo_base,
        subtotal,
        costoSubtotal: cant * p.costo_base,
        nota: it.nota || "",
        detalle: `${cant} unidad(es)`,
      });
    }
  }

  if (!itemsCalculados.length) {
    return NextResponse.json({ error: "No hay items válidos" }, { status: 400 });
  }

  const total = itemsCalculados.reduce((a, it) => a + it.subtotal, 0);

  let { data: cliente } = await admin.from("clientes").select("*").eq("email", email.trim()).maybeSingle();
  if (!cliente) {
    const { data: nuevoCliente } = await admin
      .from("clientes")
      .insert({ nombre: nombre.trim(), email: email.trim(), telefono: telefono || null })
      .select()
      .single();
    cliente = nuevoCliente;
  }

  const { data: cotiz, error: cotizError } = await admin
    .from("cotizaciones")
    .insert({
      cliente_id: cliente?.id ?? null,
      items: itemsCalculados,
      total,
      notas: notas || "",
      texto_ia: "",
      estado: "Solicitud web",
    })
    .select()
    .single();

  if (cotizError || !cotiz) {
    return NextResponse.json({ error: "No se pudo guardar la cotización" }, { status: 500 });
  }

  const doc = construirCotizacionPDF({
    numero: cotiz.numero,
    fecha: cotiz.fecha,
    cliente,
    items: itemsCalculados,
    total,
    notas: notas || "",
  });
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  const filename = nombreArchivoCotizacion(cotiz.numero);

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const resend = new Resend(resendKey);
    const itemsTexto = itemsCalculados
      .map((it) => `- ${it.nombre} (${it.detalle}): ${fmt(it.subtotal)}`)
      .join("\n");

    const envioCliente = await resend.emails.send({
      from: "Cortinajes Claudia Burgos <onboarding@resend.dev>",
      to: email.trim(),
      subject: `Tu presupuesto N° ${String(cotiz.numero).padStart(4, "0")} — Cortinajes Claudia Burgos`,
      text: `Hola ${nombre},\n\nAdjuntamos tu presupuesto solicitado.\n\nTotal: ${fmt(total)}\n\nNos pondremos en contacto a la brevedad.\n\nCortinajes Claudia Burgos`,
      attachments: [{ filename, content: pdfBuffer }],
    });
    if (envioCliente.error) {
      console.error("Error enviando email al cliente:", envioCliente.error);
    }

    const envioNegocio = await resend.emails.send({
      from: "Cortinajes Claudia Burgos <onboarding@resend.dev>",
      to: NOTIFICAR_A,
      subject: `Nueva solicitud de presupuesto — ${nombre}`,
      text: `Nueva solicitud de presupuesto desde la web.\n\nCliente: ${nombre}\nEmail: ${email}\nTeléfono: ${telefono || "-"}\n\n${itemsTexto}\n\nTotal: ${fmt(total)}\n${notas ? "\nNotas: " + notas : ""}`,
      attachments: [{ filename, content: pdfBuffer }],
    });
    if (envioNegocio.error) {
      console.error("Error enviando email al negocio:", envioNegocio.error);
    }
  } else {
    console.error("RESEND_API_KEY no configurada: no se envió ningún correo");
  }

  return NextResponse.json({ ok: true, numero: cotiz.numero });
}
