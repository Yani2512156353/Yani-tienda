-- =====================================================================
-- Agregado rapido: un boton que suma un paquete completo al stock.
-- Ejecutar una vez, despues de 0002_cambio_clave.sql.
-- =====================================================================

alter table public.productos
  add column if not exists agregado_rapido boolean not null default false,
  add column if not exists unidades_por_paquete integer not null default 12
    check (unidades_por_paquete between 1 and 1000);

-- Suma un paquete en una sola instruccion: no se pierde ninguna pulsacion aunque sean dos a la vez.
create or replace function public.agregar_paquete(p_producto uuid)
returns integer
language plpgsql
set search_path = public
as $$
declare
  v_stock integer;
begin
  update productos
     set stock = stock + unidades_por_paquete,
         actualizado_en = now()
   where id = p_producto and agregado_rapido
  returning stock into v_stock;

  if not found then
    raise exception 'Este producto no tiene agregado rapido habilitado';
  end if;

  return v_stock;
end;
$$;

revoke all on function public.agregar_paquete(uuid) from public, anon, authenticated;
grant execute on function public.agregar_paquete(uuid) to service_role;
