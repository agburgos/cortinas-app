-- Migración 008: mantenedor de tipos de producto (m² vs unidad)
-- Ejecutar en Supabase: Project > SQL Editor > New query
-- Aplicar en AMBOS proyectos (cortinas-dev y producción)

create table if not exists tipos_producto (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  unidad text not null check (unidad in ('m2', 'unidad')),
  created_at timestamptz not null default now()
);

insert into tipos_producto (nombre, unidad) values
  ('roller', 'm2'),
  ('sunscreen', 'm2'),
  ('cortina', 'm2'),
  ('instalacion', 'unidad'),
  ('accesorio', 'unidad')
on conflict (nombre) do nothing;

alter table productos drop constraint if exists productos_tipo_check;
alter table productos drop constraint if exists productos_tipo_fkey;
alter table productos add constraint productos_tipo_fkey
  foreign key (tipo) references tipos_producto(nombre) on update cascade;

alter table tipos_producto enable row level security;
create policy "public_select_tipos_producto" on tipos_producto for select
  using (true);
create policy "auth_write_tipos_producto" on tipos_producto for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
