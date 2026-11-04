import { redirect } from "next/navigation";
import { BotonRestablecer, FormularioRegistro } from "@/components/formularios";
import { ListaBuscable } from "@/components/lista-buscable";
import { Aviso, Encabezado, Insignia, Tarjeta } from "@/components/ui";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/sesion";

type Usuario = { id: string; nombre: string; rol: string; debe_cambiar_clave: boolean };

export default async function PaginaUsuarios() {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/");
  if (sesion.rol !== "admin") redirect("/tienda");

  const { data, error } = await db()
    .from("usuarios")
    .select("id, nombre, rol, debe_cambiar_clave")
    .eq("rol", "comprador")
    .order("nombre");
  if (error) return <Aviso tono="error">No se pudieron cargar los usuarios. Intenta recargar.</Aviso>;

  const usuarios = (data ?? []) as Usuario[];

  return (
    <div className="grid gap-8">
      <Encabezado
        titulo="Usuarios"
        texto="Solo tú puedes crear cuentas. Si alguien olvida su clave, restablécela aquí."
      />

      <Tarjeta className="entrar">
        <h2 className="mb-6 text-xl font-bold text-slate-900">Nuevo usuario</h2>
        <FormularioRegistro />
      </Tarjeta>

      <section className="grid gap-5">
        <h2 className="text-xl font-bold text-slate-900">Personas ({usuarios.length})</h2>
        <ListaBuscable
          placeholder="Buscar persona"
          vacio="No hay personas con ese nombre."
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          items={usuarios.map((u) => ({
            id: u.id,
            texto: u.nombre,
            nodo: (
              <Tarjeta className="grid content-start gap-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="truncate text-lg font-bold text-slate-900">{u.nombre}</p>
                  {u.debe_cambiar_clave && <Insignia tono="pendiente">Clave inicial</Insignia>}
                </div>
                <BotonRestablecer usuarioId={u.id} nombre={u.nombre} />
              </Tarjeta>
            ),
          }))}
        />
      </section>
    </div>
  );
}
