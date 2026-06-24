-- Migración 004: tabla de usuarios visible, sincronizada con Supabase Auth
-- Ejecutar en Supabase: Project > SQL Editor > New query
-- Aplicar en AMBOS proyectos (cortinas-dev y producción)
-- Requiere haber corrido antes migration_003.sql

create table if not exists usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nombre text,
  rol text not null default 'admin',
  created_at timestamptz not null default now()
);

alter table usuarios enable row level security;

create policy "auth_select_usuarios" on usuarios for select
  using (auth.role() = 'authenticated');
create policy "auth_update_own_usuario" on usuarios for update
  using (auth.uid() = id) with check (auth.uid() = id);

-- Cuando se crea un usuario en Supabase Auth (Authentication > Users > Add user,
-- o por signup), se inserta automáticamente una fila en "usuarios".
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usuarios (id, email, nombre)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Sincroniza retroactivamente cualquier usuario de Auth que ya exista
-- y todavía no tenga fila en "usuarios".
insert into public.usuarios (id, email, nombre)
select id, email, split_part(email, '@', 1)
from auth.users
on conflict (id) do nothing;
