-- Migración 003: requerir sesión autenticada para leer/escribir
-- Ejecutar en Supabase: Project > SQL Editor > New query
-- Aplicar en AMBOS proyectos (cortinas-dev y producción)
-- Antes de correr esto, asegúrate de tener un usuario creado en
-- Authentication > Users, o quedarás sin acceso a tus propios datos.

drop policy if exists "anon_all_clientes" on clientes;
drop policy if exists "anon_all_instaladores" on instaladores;
drop policy if exists "anon_all_productos" on productos;
drop policy if exists "anon_all_cotizaciones" on cotizaciones;
drop policy if exists "anon_all_ventas" on ventas;

create policy "auth_all_clientes" on clientes for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth_all_instaladores" on instaladores for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth_all_productos" on productos for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth_all_cotizaciones" on cotizaciones for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth_all_ventas" on ventas for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
