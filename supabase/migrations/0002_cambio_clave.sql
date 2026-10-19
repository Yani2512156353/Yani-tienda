-- =====================================================================
-- Cambio de clave en el primer ingreso.
-- Las personas nuevas nacen con debe_cambiar_clave = true.
-- Ejecutar una vez, despues de 0001_tienda_esquema.sql.
-- =====================================================================

alter table public.usuarios
  add column if not exists debe_cambiar_clave boolean not null default true;

-- Quienes todavia tienen la clave inicial 1234 deben cambiarla (incluida Yani).
-- bcrypt compara la clave contra el hash guardado: si coincide, sigue en 1234.
update public.usuarios
   set debe_cambiar_clave = true
 where clave_hash = extensions.crypt('1234', clave_hash);
