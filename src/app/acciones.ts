"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { cerrarSesion, iniciarSesion, obtenerSesion, type Sesion } from "@/lib/sesion";

export type Estado = { ok?: boolean; error?: string } | undefined;

const CLAVE_INICIAL = "1234";
const TIPOS_IMAGEN: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_BYTES = 5 * 1024 * 1024;

// ---------------------------------------------------------------------
// Ayudantes de permisos: cada accion vuelve a comprobar el rol en el servidor.
// Ocultar botones en la pantalla no basta; esto es lo que protege de verdad.
// ---------------------------------------------------------------------
async function exigirSesion(rol?: Sesion["rol"]): Promise<Sesion> {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/");
  if (rol && sesion.rol !== rol) throw new Error("No tienes permiso para esta accion");
  return sesion;
}

function nombreLimpio(valor: FormDataEntryValue | null): string {
  return String(valor ?? "").trim().replace(/\s+/g, " ");
}

function claveDeNombre(nombre: string): string {
  return nombre.toLowerCase();
}

function validarImagen(archivo: File): string | null {
  if (!TIPOS_IMAGEN[archivo.type]) return "La imagen debe ser JPG, PNG o WEBP";
  if (archivo.size > MAX_BYTES) return "La imagen no puede pesar mas de 5 MB";
  return null;
}

async function subirArchivo(bucket: string, ruta: string, archivo: File): Promise<void> {
  const { error } = await db()
    .storage.from(bucket)
    .upload(ruta, await archivo.arrayBuffer(), { contentType: archivo.type, upsert: false });
  if (error) throw new Error("No se pudo subir el archivo");
}

// ---------------------------------------------------------------------
// Cuenta: crear usuario, entrar y salir
// ---------------------------------------------------------------------
export async function crearUsuario(_prev: Estado, formData: FormData): Promise<Estado> {
  const nombre = nombreLimpio(formData.get("nombre"));
  if (nombre.length < 2 || nombre.length > 40) {
    return { error: "El nombre debe tener entre 2 y 40 caracteres" };
  }

  // Todo usuario nuevo es comprador con la clave inicial. Solo Yani es administradora (seed SQL).
  const hash = await bcrypt.hash(CLAVE_INICIAL, 10);
  const { error } = await db()
    .from("usuarios")
    .insert({ nombre, nombre_clave: claveDeNombre(nombre), clave_hash: hash, rol: "comprador" });

  if (error) {
    if (error.code === "23505") return { error: "Ese nombre ya existe, usa otro o inicia sesion" };
    // Se muestra el error real de Supabase para diagnosticar la configuracion.
    return { error: `No se pudo crear el usuario. Supabase dice: ${error.message}` };
  }
  return { ok: true };
}

export async function iniciarSesionAccion(_prev: Estado, formData: FormData): Promise<Estado> {
  const nombre = nombreLimpio(formData.get("nombre"));
  const clave = String(formData.get("clave") ?? "");
  if (!nombre || !clave) return { error: "Escribe tu nombre y tu clave" };

  const { data: usuario, error } = await db()
    .from("usuarios")
    .select("id, nombre, rol, clave_hash")
    .eq("nombre_clave", claveDeNombre(nombre))
    .maybeSingle();

  // Un error de consulta no es una clave incorrecta: se muestra para diagnosticar la conexion.
  if (error) return { error: `No se pudo consultar la base. Supabase dice: ${error.message}` };

  // Mismo mensaje si no existe o si la clave falla: no revelamos que nombres existen.
  if (!usuario || !(await bcrypt.compare(clave, usuario.clave_hash))) {
    return { error: "Nombre o clave incorrectos" };
  }

  await iniciarSesion({ uid: usuario.id, rol: usuario.rol, nombre: usuario.nombre });
  redirect("/tienda");
}

export async function cerrarSesionAccion(): Promise<void> {
  await cerrarSesion();
  redirect("/");
}

// ---------------------------------------------------------------------
// Tienda (solo admin): crear y editar productos
// ---------------------------------------------------------------------
export async function guardarProducto(_prev: Estado, formData: FormData): Promise<Estado> {
  await exigirSesion("admin");

  const id = String(formData.get("id") ?? "") || null;
  const nombre = nombreLimpio(formData.get("nombre"));
  const precio = Number(formData.get("precio"));
  const stock = Number(formData.get("stock"));

  if (nombre.length < 2 || nombre.length > 80) return { error: "El nombre debe tener entre 2 y 80 caracteres" };
  if (!Number.isFinite(precio) || precio <= 0) return { error: "El precio debe ser mayor que cero" };
  if (!Number.isInteger(stock) || stock < 0) return { error: "El stock debe ser un numero entero, desde 0" };

  const datos: Record<string, unknown> = {
    nombre,
    precio,
    stock,
    actualizado_en: new Date().toISOString(),
  };

  // La imagen es opcional. Si no se sube una nueva al editar, se conserva la anterior.
  const imagen = formData.get("imagen");
  if (imagen instanceof File && imagen.size > 0) {
    const error = validarImagen(imagen);
    if (error) return { error };
    const ruta = `${randomUUID()}.${TIPOS_IMAGEN[imagen.type]}`;
    try {
      await subirArchivo("productos", ruta, imagen);
    } catch {
      return { error: "No se pudo subir la imagen, intenta de nuevo" };
    }
    datos.imagen_url = db().storage.from("productos").getPublicUrl(ruta).data.publicUrl;
  }

  const consulta = id
    ? db().from("productos").update(datos).eq("id", id)
    : db().from("productos").insert(datos);
  const { error } = await consulta;
  if (error) return { error: "No se pudo guardar el producto" };

  revalidatePath("/tienda");
  return { ok: true };
}

// ---------------------------------------------------------------------
// Compra (solo compradores): descuenta stock en la base, en una transaccion
// ---------------------------------------------------------------------
export async function comprarProducto(_prev: Estado, formData: FormData): Promise<Estado> {
  const sesion = await exigirSesion("comprador");

  const producto = String(formData.get("producto") ?? "");
  const cantidad = Number(formData.get("cantidad"));
  if (!producto || !Number.isInteger(cantidad) || cantidad < 1) {
    return { error: "Elige una cantidad valida" };
  }

  const { error } = await db().rpc("comprar_producto", {
    p_usuario: sesion.uid,
    p_producto: producto,
    p_cantidad: cantidad,
  });
  if (error) return { error: error.message };

  revalidatePath("/tienda");
  revalidatePath("/deudores");
  return { ok: true };
}

// ---------------------------------------------------------------------
// Pagos
// ---------------------------------------------------------------------
export async function avisarPago(_prev: Estado, formData: FormData): Promise<Estado> {
  const sesion = await exigirSesion("comprador");

  let ruta: string | null = null;
  const comprobante = formData.get("comprobante");
  if (comprobante instanceof File && comprobante.size > 0) {
    const error = validarImagen(comprobante);
    if (error) return { error };
    ruta = `${sesion.uid}/${randomUUID()}.${TIPOS_IMAGEN[comprobante.type]}`;
    try {
      await subirArchivo("comprobantes", ruta, comprobante);
    } catch {
      return { error: "No se pudo subir el comprobante, intenta de nuevo" };
    }
  }

  const { error } = await db().rpc("avisar_pago", { p_usuario: sesion.uid, p_comprobante: ruta });
  if (error) {
    // Si el aviso no se creo, el comprobante subido no sirve: se borra.
    if (ruta) await db().storage.from("comprobantes").remove([ruta]);
    return { error: error.message };
  }

  revalidatePath("/deudores");
  redirect("/deudores");
}

export async function resolverPago(formData: FormData): Promise<void> {
  await exigirSesion("admin");

  const pago = String(formData.get("pago") ?? "");
  const aprobar = formData.get("decision") === "aprobar";

  const { error } = await db().rpc("resolver_pago", { p_pago: pago, p_aprobar: aprobar });
  if (error) throw new Error(error.message);

  revalidatePath("/deudores");
}
