-- Migración 006: configuración del negocio (logos, colores, textos del PDF)
-- Ejecutar en Supabase: Project > SQL Editor > New query
-- Aplicar en AMBOS proyectos (cortinas-dev y producción)

create table if not exists configuracion (
  id int primary key default 1,
  empresa_nombre text not null default 'Cortinajes Claudia Burgos',
  logo_web_url text,
  logo_pdf_url text,
  color_accent text not null default '#C1452A',
  color_gold text not null default '#C8932A',
  color_teal text not null default '#1F7A6C',
  pdf_condiciones text not null default 'Cotización válida por 15 días. Condiciones sugeridas: 50% anticipo, 50% contra instalación.',
  pdf_pie text,
  updated_at timestamptz not null default now(),
  constraint configuracion_singleton check (id = 1)
);

insert into configuracion (id) values (1) on conflict (id) do nothing;

alter table configuracion enable row level security;

create policy "public_select_configuracion" on configuracion for select
  using (true);
create policy "auth_update_configuracion" on configuracion for update
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Bucket de Storage para los logos (público de lectura)
insert into storage.buckets (id, name, public)
values ('branding', 'branding', true)
on conflict (id) do nothing;

create policy "public_read_branding" on storage.objects for select
  using (bucket_id = 'branding');
create policy "auth_write_branding" on storage.objects for insert
  with check (bucket_id = 'branding' and auth.role() = 'authenticated');
create policy "auth_update_branding" on storage.objects for update
  using (bucket_id = 'branding' and auth.role() = 'authenticated');
create policy "auth_delete_branding" on storage.objects for delete
  using (bucket_id = 'branding' and auth.role() = 'authenticated');
