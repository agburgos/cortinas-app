-- Migración 009: las instalaciones guardan fecha y hora (no solo fecha)
-- Ejecutar en Supabase: Project > SQL Editor > New query
-- Aplicar en AMBOS proyectos (cortinas-dev y producción)

alter table ventas
  alter column fecha_instalacion type timestamptz
  using fecha_instalacion::timestamptz;
