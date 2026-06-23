-- Migración 002: instaladores, costos, numeración de cotizaciones
-- Ejecutar en Supabase: Project > SQL Editor > New query
-- Aplicar en AMBOS proyectos (cortinas-dev y producción)

create table if not exists instaladores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  telefono text,
  costo_default numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table instaladores enable row level security;
create policy "anon_all_instaladores" on instaladores for all using (true) with check (true);

alter table productos add column if not exists marca text;
alter table productos add column if not exists costo_base numeric not null default 0;

alter table ventas add column if not exists instalador_id uuid references instaladores(id) on delete set null;
alter table ventas add column if not exists costo_instalacion numeric not null default 0;
alter table ventas drop column if exists instalador;

-- Numeración única y correlativa de cotizaciones (ej: COT-0001)
create sequence if not exists cotizaciones_numero_seq;
alter table cotizaciones add column if not exists numero integer unique default nextval('cotizaciones_numero_seq');
alter sequence cotizaciones_numero_seq owned by cotizaciones.numero;
update cotizaciones set numero = nextval('cotizaciones_numero_seq') where numero is null;
