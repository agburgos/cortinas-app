-- Migración 010: permitir que cualquier usuario autenticado edite los datos
-- de otros usuarios (nombre/rol) desde Configuración, no solo los propios.
-- Ejecutar en Supabase: Project > SQL Editor > New query
-- Aplicar en AMBOS proyectos (cortinas-dev y producción)

drop policy if exists "auth_update_own_usuario" on usuarios;
create policy "auth_update_usuarios" on usuarios for update
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
