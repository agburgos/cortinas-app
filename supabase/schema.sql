-- Esquema para la app de cotizaciones de cortinas
-- Ejecutar en Supabase: Project > SQL Editor > New query

create extension if not exists "pgcrypto";

create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  telefono text,
  email text,
  direccion text,
  created_at timestamptz not null default now()
);

create table if not exists productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo text not null check (tipo in ('roller','screener','cortina','instalacion','accesorio')),
  precio_m2 numeric not null default 0,
  precio_unidad numeric not null default 0,
  descripcion text,
  created_at timestamptz not null default now()
);

create table if not exists cotizaciones (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id) on delete set null,
  items jsonb not null default '[]',
  total numeric not null default 0,
  notas text,
  texto_ia text,
  estado text not null default 'Borrador',
  fecha timestamptz not null default now()
);

create table if not exists ventas (
  id uuid primary key default gen_random_uuid(),
  cotizacion_id uuid references cotizaciones(id) on delete set null,
  cliente_id uuid references clientes(id) on delete set null,
  total numeric not null default 0,
  estado_pago text not null default 'pendiente' check (estado_pago in ('pendiente','parcial','pagado')),
  monto_pagado numeric not null default 0,
  instalado boolean not null default false,
  fecha_instalacion date,
  instalador text,
  notas text,
  fecha timestamptz not null default now()
);

-- RLS: app de un solo usuario (sin login), se habilita acceso anónimo de lectura/escritura
-- mediante la anon key. Si en el futuro agregas autenticación, reemplaza estas
-- políticas por reglas basadas en auth.uid().
alter table clientes enable row level security;
alter table productos enable row level security;
alter table cotizaciones enable row level security;
alter table ventas enable row level security;

create policy "anon_all_clientes" on clientes for all using (true) with check (true);
create policy "anon_all_productos" on productos for all using (true) with check (true);
create policy "anon_all_cotizaciones" on cotizaciones for all using (true) with check (true);
create policy "anon_all_ventas" on ventas for all using (true) with check (true);
