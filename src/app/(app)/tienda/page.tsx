import { redirect } from "next/navigation";
import { agregarPaquete } from "@/app/acciones";
import { FormularioCompra, FormularioProducto } from "@/components/formularios";
import { ListaBuscable } from "@/components/lista-buscable";
import { Aviso, Boton, Encabezado, Insignia, Tarjeta } from "@/components/ui";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/sesion";
import { pesos } from "@/lib/formato";

type Producto = {
  id: string;
  nombre: string;
  precio: number;
  stock: number;
  imagen_url: string | null;
  agregado_rapido: boolean;
  unidades_por_paquete: number;
};

export default async function PaginaTienda() {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/");

  let consulta = db()
    .from("productos")
    .select("id, nombre, precio, stock, imagen_url, agregado_rapido, unidades_por_paquete")
    .eq("archivado", false)
    .order("creado_en", { ascending: false });

  // Regla de negocio: el comprador solo ve productos con stock. Al llegar a 0 desaparecen.
  if (sesion.rol === "comprador") consulta = consulta.gt("stock", 0);

  const { data, error } = await consulta;
  if (error) {
    return <Aviso tono="error">No se pudieron cargar los productos. Intenta recargar.</Aviso>;
  }
  const productos = (data ?? []) as Producto[];

  if (sesion.rol === "admin") {
    return (
      <div className="grid gap-8">
        <Encabezado
          titulo="Tienda"
          texto="Agrega productos, define el precio y controla el stock. Los productos sin stock quedan ocultos para los compradores."
        />

        <Tarjeta className="entrar">
          <h2 className="mb-6 text-xl font-bold text-slate-900">Nuevo producto</h2>
          <FormularioProducto />
        </Tarjeta>

        <section className="grid gap-5">
          <h2 className="text-xl font-bold text-slate-900">Productos ({productos.length})</h2>
          {productos.length === 0 && (
            <Tarjeta>
              <p className="text-slate-600">Todavía no hay productos. Agrega el primero arriba.</p>
            </Tarjeta>
          )}
          <ListaBuscable
            placeholder="Buscar producto"
            vacio="No hay productos con ese nombre."
            className="grid gap-5 md:grid-cols-2"
            items={productos.map((producto) => ({
              id: producto.id,
              texto: producto.nombre,
              nodo: (
                <Tarjeta className="entrar grid gap-6">
                <div className="flex gap-4">
                  <Miniatura producto={producto} />
                  <div className="grid min-w-0 gap-2">
                    <p className="truncate text-lg font-bold text-slate-900">{producto.nombre}</p>
                    <p className="text-base font-semibold text-slate-700">{pesos(producto.precio)}</p>
                    {producto.stock === 0 ? (
                      <Insignia tono="neutro">Sin stock</Insignia>
                    ) : (
                      <Insignia tono="al-dia">Stock: {producto.stock}</Insignia>
                    )}
                  </div>
                </div>
                <div className="grid gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    {producto.agregado_rapido && (
                      <form action={agregarPaquete}>
                        <input type="hidden" name="producto" value={producto.id} />
                        <Boton tono="exito" aria-label={`Agregar ${producto.unidades_por_paquete} unidades de ${producto.nombre}`}>
                          Agregado rápido +{producto.unidades_por_paquete}
                        </Boton>
                      </form>
                    )}
                    <details className="group rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-900/5">
                      <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-2xl bg-slate-100 px-5 text-sm font-bold text-slate-800 transition hover:bg-slate-200">
                        Editar producto
                      </summary>
                      <div className="mt-5">
                        <FormularioProducto producto={producto} />
                      </div>
                    </details>
                  </div>
                </div>
              </Tarjeta>
              ),
            }))}
          />
        </section>
      </div>
    );
  }

  return (
    <div className="grid gap-8">
      <Encabezado
        titulo="Tienda"
        texto="Elige lo que quieras llevar. La compra se suma a tu cuenta."
      />

      {productos.length === 0 && (
        <Tarjeta className="entrar">
          <p className="text-lg font-bold text-slate-900">Por ahora no hay productos disponibles</p>
          <p className="mt-2 text-slate-600">Vuelve más tarde, cuando Yani agregue nuevos productos.</p>
        </Tarjeta>
      )}

      {productos.length > 0 && (
        <ListaBuscable
          placeholder="Buscar producto"
          vacio="No hay productos con ese nombre."
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          items={productos.map((producto) => ({
            id: producto.id,
            texto: producto.nombre,
            nodo: (
              <Tarjeta className="entrar grid gap-5">
            <Miniatura producto={producto} grande />
            <div className="grid gap-1">
              <p className="text-lg font-bold text-slate-900">{producto.nombre}</p>
              <p className="text-2xl font-extrabold tracking-tight text-slate-900">{pesos(producto.precio)}</p>
              <p className="text-sm font-semibold text-slate-600">
                {producto.stock === 1 ? "Queda 1 unidad" : `Quedan ${producto.stock} unidades`}
                {producto.stock <= 3 && " · ¡Últimas!"}
              </p>
            </div>
            <FormularioCompra productoId={producto.id} stock={producto.stock} precio={Number(producto.precio)} />
          </Tarjeta>
            ),
          }))}
        />
      )}
    </div>
  );
}

function Miniatura({ producto, grande = false }: { producto: Producto; grande?: boolean }) {
  const tamano = grande ? "aspect-[4/3] w-full" : "h-20 w-20 shrink-0";
  if (producto.imagen_url) {
    return (
      <img
        src={producto.imagen_url}
        loading="lazy"
        alt={producto.nombre}
        className={`${tamano} rounded-2xl object-cover ring-1 ring-slate-900/5`}
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className={`${tamano} grid place-items-center rounded-2xl bg-linear-to-br from-teal-100 to-slate-200 text-2xl font-extrabold text-slate-700`}
    >
      {producto.nombre.charAt(0).toUpperCase()}
    </div>
  );
}
