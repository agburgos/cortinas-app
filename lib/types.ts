export type TipoProducto = 'roller' | 'screener' | 'cortina' | 'instalacion' | 'accesorio';

export interface Cliente {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  created_at: string;
}

export interface Usuario {
  id: string;
  email: string;
  nombre: string | null;
  rol: string;
  created_at: string;
}

export interface Instalador {
  id: string;
  nombre: string;
  telefono: string | null;
  costo_default: number;
  created_at: string;
}

export interface Producto {
  id: string;
  nombre: string;
  tipo: TipoProducto;
  marca: string | null;
  precio_m2: number;
  precio_unidad: number;
  costo_base: number;
  descripcion: string | null;
  created_at: string;
}

export interface CotizacionItem {
  productoId: string;
  nombre: string;
  tipo: TipoProducto;
  ancho?: number;
  alto?: number;
  metros?: number;
  cantidad: number;
  precioUnitario: number;
  costoUnitario: number;
  subtotal: number;
  costoSubtotal: number;
  nota: string;
  detalle: string;
}

export interface Cotizacion {
  id: string;
  numero: number;
  cliente_id: string | null;
  items: CotizacionItem[];
  total: number;
  notas: string | null;
  texto_ia: string | null;
  estado: string;
  fecha: string;
}

export type EstadoPago = 'pendiente' | 'parcial' | 'pagado';

export interface Venta {
  id: string;
  cotizacion_id: string | null;
  cliente_id: string | null;
  total: number;
  estado_pago: EstadoPago;
  monto_pagado: number;
  instalado: boolean;
  fecha_instalacion: string | null;
  instalador_id: string | null;
  costo_instalacion: number;
  notas: string | null;
  fecha: string;
}

export const TIPO_LABEL: Record<TipoProducto, string> = {
  roller: 'Roller',
  screener: 'Screener',
  cortina: 'Cortina tela',
  instalacion: 'Instalación',
  accesorio: 'Accesorio',
};

export const EMPRESA_NOMBRE = 'Cortinajes Claudia Burgos';
