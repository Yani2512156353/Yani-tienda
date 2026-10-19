-- =====================================================================
-- Tienda de Yani: esquema inicial
-- Ejecutar una vez en el proyecto de Supabase (SQL Editor o supabase db push).
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------

-- Personas que usan la app. El nombre es unico sin importar mayusculas
-- ni espacios sobrantes, gracias a nombre_clave.
create table if not exists public.usuarios (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null check (length(btrim(nombre)) between 2 and 40),
  nombre_clave  text not null unique,
  clave_hash    text not null,
  rol           text not null default 'comprador' check (rol in ('admin', 'comprador')),
  creado_en     timestamptz not null default now()
);

-- Productos de la tienda. El stock baja con cada compra.
create table if not exists public.productos (
  id              uuid primary key default gen_random_uuid(),
  nombre          text not null check (length(btrim(nombre)) between 2 and 80),
  precio          numeric(12,2) not null check (precio > 0),
  imagen_url      text,
  stock           integer not null default 0 check (stock >= 0),
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now()
);

-- Cada compra guarda el precio del momento (si el precio cambia despues, la deuda no cambia).
create table if not exists public.compras (
  id               uuid primary key default gen_random_uuid(),
  usuario_id       uuid not null references public.usuarios(id) on delete restrict,
  producto_id      uuid not null references public.productos(id) on delete restrict,
  cantidad         integer not null check (cantidad > 0),
  precio_unitario  numeric(12,2) not null check (precio_unitario >= 0),
  total            numeric(12,2) generated always as (cantidad * precio_unitario) stored,
  creado_en        timestamptz not null default now()
);

-- Avisos de pago. Estado: pendiente -> aprobado | rechazado.
create table if not exists public.pagos (
  id                 uuid primary key default gen_random_uuid(),
  usuario_id         uuid not null references public.usuarios(id) on delete restrict,
  monto              numeric(12,2) not null check (monto > 0),
  estado             text not null default 'pendiente' check (estado in ('pendiente', 'aprobado', 'rechazado')),
  comprobante_path   text,
  creado_en          timestamptz not null default now(),
  resuelto_en        timestamptz
);

-- Regla de negocio: una persona solo puede tener un aviso de pago pendiente a la vez.
create unique index if not exists pagos_un_pendiente_por_usuario
  on public.pagos (usuario_id) where estado = 'pendiente';

-- ---------------------------------------------------------------------
-- Vista de estado de cuentas (solo compradores)
-- saldo  = compras - pagos aprobados
-- debe   = saldo >= 1 (regla de negocio: minimo 1 peso)
-- ---------------------------------------------------------------------
create or replace view public.estado_cuentas with (security_invoker = true) as
select
  u.id as usuario_id,
  u.nombre,
  coalesce((select sum(c.total) from public.compras c where c.usuario_id = u.id), 0)
    - coalesce((select sum(p.monto) from public.pagos p
                where p.usuario_id = u.id and p.estado = 'aprobado'), 0) as saldo,
  exists (select 1 from public.pagos p
          where p.usuario_id = u.id and p.estado = 'pendiente') as pago_pendiente
from public.usuarios u
where u.rol = 'comprador';

-- ---------------------------------------------------------------------
-- Funciones (la logica critica vive en la base, en una sola transaccion)
-- ---------------------------------------------------------------------

-- Compra: bloquea la fila del producto, valida stock y descuenta.
create or replace function public.comprar_producto(
  p_usuario uuid, p_producto uuid, p_cantidad integer
) returns void
language plpgsql
set search_path = public
as $$
declare
  v_precio numeric(12,2);
  v_stock  integer;
begin
  if p_cantidad is null or p_cantidad < 1 then
    raise exception 'La cantidad debe ser al menos 1';
  end if;

  select precio, stock into v_precio, v_stock
  from productos where id = p_producto for update;

  if not found then
    raise exception 'El producto no existe';
  end if;

  if v_stock < p_cantidad then
    raise exception 'Solo quedan % unidades de este producto', v_stock;
  end if;

  update productos
     set stock = stock - p_cantidad, actualizado_en = now()
   where id = p_producto;

  insert into compras (usuario_id, producto_id, cantidad, precio_unitario)
  values (p_usuario, p_producto, p_cantidad, v_precio);
end;
$$;

-- Aviso de pago: el monto es la deuda actual. Solo si hay saldo y no hay otro aviso pendiente.
create or replace function public.avisar_pago(p_usuario uuid, p_comprobante text default null)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_saldo numeric(12,2);
  v_id    uuid;
begin
  select saldo into v_saldo from estado_cuentas where usuario_id = p_usuario;

  if v_saldo is null or v_saldo < 1 then
    raise exception 'No tienes saldo pendiente por pagar';
  end if;

  insert into pagos (usuario_id, monto, comprobante_path)
  values (p_usuario, v_saldo, p_comprobante)
  returning id into v_id;

  return v_id;
exception
  when unique_violation then
    raise exception 'Ya avisaste un pago que esta pendiente de confirmacion';
end;
$$;

-- Yani aprueba o rechaza un aviso pendiente.
create or replace function public.resolver_pago(p_pago uuid, p_aprobar boolean)
returns void
language plpgsql
set search_path = public
as $$
begin
  update pagos
     set estado = case when p_aprobar then 'aprobado' else 'rechazado' end,
         resuelto_en = now()
   where id = p_pago and estado = 'pendiente';

  if not found then
    raise exception 'Ese pago ya no esta pendiente';
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- Seguridad
-- La app habla con Supabase solo desde el servidor, con la service_role key.
-- Aqui se cierra todo lo demas: la clave publica (anon) no puede leer ni escribir nada.
-- ---------------------------------------------------------------------
alter table public.usuarios enable row level security;
alter table public.productos enable row level security;
alter table public.compras   enable row level security;
alter table public.pagos     enable row level security;

revoke all on all tables    in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated, public;
revoke all on all sequences in schema public from anon, authenticated;

alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;

grant execute on function public.comprar_producto(uuid, uuid, integer) to service_role;
grant execute on function public.avisar_pago(uuid, text)               to service_role;
grant execute on function public.resolver_pago(uuid, boolean)          to service_role;

-- ---------------------------------------------------------------------
-- Storage: imagenes de productos (publicas) y comprobantes (privados)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('productos', 'productos', true),
       ('comprobantes', 'comprobantes', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Usuario inicial: Yani, administradora unica, clave 1234
-- Se guarda con bcrypt ($2a$), el mismo formato que verifica la app.
-- ---------------------------------------------------------------------
insert into public.usuarios (nombre, nombre_clave, clave_hash, rol)
values ('Yani', 'yani', extensions.crypt('1234', extensions.gen_salt('bf')), 'admin')
on conflict (nombre_clave) do nothing;
