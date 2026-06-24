-- Migración 007: renombrar tipo de producto "screener" a "sunscreen"
-- Ejecutar en Supabase: Project > SQL Editor > New query
-- Aplicar en AMBOS proyectos (cortinas-dev y producción)

alter table productos drop constraint if exists productos_tipo_check;

update productos set tipo = 'sunscreen' where tipo = 'screener';

alter table productos add constraint productos_tipo_check
  check (tipo in ('roller','sunscreen','cortina','instalacion','accesorio'));
