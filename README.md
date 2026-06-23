# Cortinas — Sistema de Cotizaciones

App de gestión de clientes, productos, cotizaciones y ventas para una empresa de cortinas. Migrada desde un prototipo HTML standalone a Next.js + Supabase.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- Supabase (Postgres + REST) como base de datos
- Cotizador basado en cálculo (m² × precio × cantidad, o precio unitario × cantidad), sin IA

## Setup

1. Instala dependencias:

   ```bash
   npm install
   ```

2. Crea un proyecto en [Supabase](https://supabase.com) y ejecuta `supabase/schema.sql` en el SQL Editor del proyecto (crea las tablas `clientes`, `productos`, `cotizaciones`, `ventas` con RLS abierto vía anon key, pensado para un solo usuario sin autenticación).

3. Copia `.env.example` a `.env.local` y completa:

   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ```

4. Corre en desarrollo:

   ```bash
   npm run dev
   ```

## Notas de seguridad

- Las políticas RLS están abiertas (`using (true)`) porque la app no tiene autenticación de usuarios — cualquiera con la anon key puede leer/escribir. Si se expone públicamente, agregar Supabase Auth y políticas por `auth.uid()`.
- La `SUPABASE_SERVICE_ROLE_KEY` nunca se usa en el código de la app (solo quedó documentada para tareas administrativas futuras) y no se commitea — vive en `.env.local`, ignorado por git.
