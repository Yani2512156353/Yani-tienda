"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cerrarSesionAccion } from "@/app/acciones";
import { BotonTema } from "@/components/boton-tema";
import type { Rol } from "@/lib/sesion";

export function Navegacion({ nombre, rol }: { nombre: string; rol: Rol }) {
  const ruta = usePathname();
  const enlaces = [
    { href: "/tienda", texto: "Tienda" },
    { href: "/deudores", texto: rol === "admin" ? "Deudores" : "Mi cuenta" },
  ];

  return (
    <header className="sticky top-0 z-20 px-4 pt-4 sm:px-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full bg-white/85 py-2.5 pl-3 pr-2.5 ring-1 ring-slate-900/5 shadow-[0_12px_30px_-20px_rgba(15,23,42,0.35)] backdrop-blur">
        <Link href="/tienda" className="flex items-center gap-3 rounded-full pr-2">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-900 text-base font-extrabold text-white">
            Y
          </span>
          <span className="hidden text-base font-extrabold tracking-tight text-slate-900 sm:inline">
            Tienda de Yani
          </span>
        </Link>

        <nav aria-label="Principal" className="flex items-center gap-1 rounded-full bg-slate-100 p-1">
          {enlaces.map((enlace) => {
            const activo = ruta.startsWith(enlace.href);
            return (
              <Link
                key={enlace.href}
                href={enlace.href}
                aria-current={activo ? "page" : undefined}
                className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                  activo ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {enlace.texto}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden max-w-[12ch] truncate text-sm font-semibold text-slate-700 md:inline">
            {nombre}
          </span>
          <BotonTema />
          <Link
            href="/clave-nueva"
            className="hidden h-10 items-center rounded-full bg-slate-100 px-4 text-sm font-bold text-slate-800 transition hover:bg-slate-200 sm:inline-flex"
          >
            Mi clave
          </Link>
          <form action={cerrarSesionAccion}>
            <button
              type="submit"
              className="h-10 rounded-full bg-slate-900 px-4 text-sm font-bold text-white transition hover:bg-slate-800 active:scale-[0.98]"
            >
              Salir
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
