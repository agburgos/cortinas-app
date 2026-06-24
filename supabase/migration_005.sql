-- Migración 005: catálogo público (sin costo_base) para la web pública
-- Ejecutar en Supabase: Project > SQL Editor > New query
-- Aplicar en AMBOS proyectos (cortinas-dev y producción)

create or replace function public.productos_publicos()
returns table (
  id uuid,
  nombre text,
  tipo text,
  marca text,
  precio_m2 numeric,
  precio_unidad numeric,
  descripcion text
)
language sql
security definer
set search_path = public
as $$
  select id, nombre, tipo, marca, precio_m2, precio_unidad, descripcion
  from productos
  order by created_at asc;
$$;

grant execute on function public.productos_publicos() to anon;
