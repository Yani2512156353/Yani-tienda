import { redirect } from "next/navigation";
import { FormularioLogin, FormularioRegistro } from "@/components/formularios";
import { BotonTema } from "@/components/boton-tema";
import { Tarjeta } from "@/components/ui";
import { obtenerSesion } from "@/lib/sesion";

export default async function Inicio() {
  if (await obtenerSesion()) redirect("/tienda");

  return (
    <div className="mx-auto grid min-h-[100dvh] w-full max-w-5xl content-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-14">
      <div className="entrar grid gap-5">
        <div className="justify-self-start">
          <BotonTema />
        </div>
        <span className="grid h-14 w-14 place-items-center rounded-3xl bg-slate-900 text-xl font-extrabold text-white">
          Y
        </span>
        <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl">
          Tienda de Yani
        </h1>
        <p className="max-w-[40ch] text-lg leading-relaxed text-slate-600">
          Compra, revisa tu cuenta y avisa tus pagos desde un solo lugar.
        </p>
      </div>

      <div className="entrar entrar-2 grid gap-5">
        <Tarjeta>
          <h2 className="mb-6 text-xl font-bold text-slate-900">Entrar</h2>
          <FormularioLogin />
        </Tarjeta>

        <Tarjeta className="bg-white/70">
          <h2 className="mb-6 text-xl font-bold text-slate-900">Crear usuario</h2>
          <FormularioRegistro />
        </Tarjeta>
      </div>
    </div>
  );
}
