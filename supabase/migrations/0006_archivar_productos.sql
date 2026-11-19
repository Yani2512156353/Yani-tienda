-- =====================================================================
-- Archivar productos: se ocultan de la tienda para TODOS (compradores y admin),
-- pero sus compras se conservan en el historial de cuentas.
-- Ejecutar una vez, despues de 0005_indices.sql.
-- =====================================================================

alter table public.productos
  add column if not exists archivado boolean not null default false;

-- Productos duplicados que se dejan de mostrar.
update public.productos
   set archivado = true, actualizado_en = now()
 where (lower(nombre), precio) in (
   ('brownies', 1300), ('papas limón', 2200), ('plátanos', 2600), ('festival de fresa', 2500)
 );

-- Un producto archivado no se puede comprar aunque alguien tenga su id.
create or replace function public.comprar_producto(
  p_usuario uuid, p_producto uuid, p_cantidad integer
) returns void
language plpgsql
set search_path = public
as $$
declare
  v_precio     numeric(12,2);
  v_stock      integer;
  v_archivado  boolean;
begin
  if p_cantidad is null or p_cantidad < 1 then
    raise exception 'La cantidad debe ser al menos 1';
  end if;

  select precio, stock, archivado into v_precio, v_stock, v_archivado
  from productos where id = p_producto for update;

  if not found then
    raise exception 'El producto no existe';
  end if;

  if v_archivado then
    raise exception 'Este producto ya no esta disponible';
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
