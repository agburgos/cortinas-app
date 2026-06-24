import jsPDF from "jspdf";
import { Cliente, CotizacionItem, Configuracion, EMPRESA_NOMBRE } from "./types";
import { fmt, fmtDate } from "./format";
import { hexToRgb } from "./configuracion";

const CHARCOAL: [number, number, number] = [42, 29, 20];
const MID: [number, number, number] = [122, 106, 92];
const CONDICIONES_DEFAULT = "Cotización válida por 15 días. Condiciones sugeridas: 50% anticipo, 50% contra instalación.";

export function construirCotizacionPDF(params: {
  numero: number;
  fecha: string;
  cliente: Cliente | null;
  items: CotizacionItem[];
  total: number;
  notas: string;
  config?: Configuracion | null;
  logoDataUrl?: string | null;
}): jsPDF {
  const { numero, fecha, cliente, items, total, notas, config, logoDataUrl } = params;
  const ACCENT = hexToRgb(config?.color_accent || "#C1452A");
  const GOLD = hexToRgb(config?.color_gold || "#C8932A");
  const empresaNombre = config?.empresa_nombre || EMPRESA_NOMBRE;
  const [nombreLinea1, ...resto] = empresaNombre.split(" ");
  const nombreLinea2 = resto.join(" ");

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = 56;

  doc.setFillColor(...ACCENT);
  doc.rect(0, 0, pageWidth, 90, "F");
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, margin, 18, 54, 54);
    } catch {
      // si el logo no se puede decodificar, se omite sin interrumpir el PDF
    }
  }
  const textX = logoDataUrl ? margin + 64 : margin;
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(nombreLinea1, textX, 42);
  doc.setFontSize(13);
  doc.setFont("helvetica", "normal");
  if (nombreLinea2) doc.text(nombreLinea2, textX, 62);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  const numLabel = `COTIZACIÓN N° ${String(numero).padStart(4, "0")}`;
  doc.text(numLabel, pageWidth - margin, 42, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(fmtDate(fecha), pageWidth - margin, 58, { align: "right" });

  y = 120;
  doc.setTextColor(...CHARCOAL);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Cliente", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  y += 16;
  doc.text(cliente ? cliente.nombre : "Cliente sin registrar", margin, y);
  if (cliente?.telefono) {
    y += 14;
    doc.setTextColor(...MID);
    doc.setFontSize(10);
    doc.text(`Tel: ${cliente.telefono}`, margin, y);
  }
  if (cliente?.direccion) {
    y += 14;
    doc.setTextColor(...MID);
    doc.setFontSize(10);
    doc.text(cliente.direccion, margin, y);
  }

  y += 30;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1.2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 22;

  doc.setTextColor(...CHARCOAL);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Detalle", margin, y);
  doc.text("Subtotal", pageWidth - margin, y, { align: "right" });
  y += 10;
  doc.setDrawColor(230, 220, 205);
  doc.line(margin, y, pageWidth - margin, y);
  y += 18;

  doc.setFont("helvetica", "normal");
  items.forEach((it) => {
    if (y > 720) {
      doc.addPage();
      y = 60;
    }
    doc.setFontSize(11);
    doc.setTextColor(...CHARCOAL);
    doc.text(it.nombre, margin, y);
    doc.setFontSize(11);
    doc.text(fmt(it.subtotal), pageWidth - margin, y, { align: "right" });
    y += 14;
    doc.setFontSize(9.5);
    doc.setTextColor(...MID);
    const detalleTexto = it.nota ? `${it.detalle} — ${it.nota}` : it.detalle;
    doc.text(detalleTexto, margin, y);
    y += 18;
  });

  y += 6;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1.2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 26;

  doc.setFillColor(...CHARCOAL);
  doc.roundedRect(pageWidth - margin - 200, y - 20, 200, 36, 6, 6, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("TOTAL", pageWidth - margin - 188, y + 2);
  doc.setFontSize(15);
  doc.text(fmt(total), pageWidth - margin - 12, y + 3, { align: "right" });

  if (notas) {
    y += 50;
    doc.setTextColor(...CHARCOAL);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text("Notas", margin, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...MID);
    const lines = doc.splitTextToSize(notas, pageWidth - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * 13;
  }

  y += 40;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9.5);
  doc.setTextColor(...MID);
  const condicionesLines = doc.splitTextToSize(config?.pdf_condiciones || CONDICIONES_DEFAULT, pageWidth - margin * 2);
  doc.text(condicionesLines, margin, Math.min(y, 760));

  if (config?.pdf_pie) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(config.pdf_pie, margin, Math.min(y + condicionesLines.length * 12 + 10, 786));
  }

  return doc;
}

export function nombreArchivoCotizacion(numero: number, empresaNombre?: string): string {
  return `Cotizacion-${(empresaNombre || EMPRESA_NOMBRE).replace(/\s+/g, "")}-${String(numero).padStart(4, "0")}.pdf`;
}

export function generarCotizacionPDF(params: {
  numero: number;
  fecha: string;
  cliente: Cliente | null;
  items: CotizacionItem[];
  total: number;
  notas: string;
  config?: Configuracion | null;
  logoDataUrl?: string | null;
}) {
  const doc = construirCotizacionPDF(params);
  doc.save(nombreArchivoCotizacion(params.numero, params.config?.empresa_nombre));
}
