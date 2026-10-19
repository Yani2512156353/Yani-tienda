import Link from "next/link";
import { redirect } from "next/navigation";
import { FormularioClave } from "@/components/formularios";
import { Encabezado, Tarjeta } from "@/components/ui";
import { obtenerSesion } from "@/lib/sesion";

// Fuera del layout (app) a proposito: aqui no hay menu, y no debe redirigir en bucle.
export default async function PaginaClaveNueva() {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/");

  const obligatorio = sesion.cambiar;

  return (
    <div className="mx-auto grid min-h-[100dvh] w-full max-w-md content-center gap-6 px-4 py-12">
      <Encabezado
        titulo={obligatorio ? "Crea tu clave" : "Cambiar clave"}
        texto={
          obligatorio
            ? `Hola ${sesion.nombre}. Tu clave inicial es 1234. Cambiala ahora para proteger tu cuenta.`
            : "Escribe la clave nueva dos veces para cambiarla."
        }
      />

      <Tarjeta className="entrar">
        <FormularioClave obligatorio={obligatorio} />
      </Tarjeta>

      {!obligatorio && (
        <Link href="/tienda" className="text-center font-bold text-teal-800 underline-offset-4 hover:underline">
          Volver a la tienda
        </Link>
      )}
    </div>
  );
}
