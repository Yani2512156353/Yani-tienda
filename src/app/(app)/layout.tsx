import { redirect } from "next/navigation";
import { Navegacion } from "@/components/navegacion";
import { obtenerSesion } from "@/lib/sesion";

// Todo lo que esta dentro de (app) exige sesion. Sin cookie valida, vuelve al inicio.
export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/");
  // Con la clave inicial, solo puede cambiarla antes de usar la tienda.
  if (sesion.cambiar) redirect("/clave-nueva");

  return (
    <div className="min-h-[100dvh]">
      <Navegacion nombre={sesion.nombre} rol={sesion.rol} />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6">{children}</main>
    </div>
  );
}
