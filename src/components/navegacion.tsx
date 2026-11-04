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
    ...(rol === "admin" ? [{ href: "/usuarios", texto: "Usuarios" }] : []),
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
                className={`inline-flex min-h-11 items-center rounded-full px-3 text-sm sm:px-4 font-bold transition ${
                  activo ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {enlace.texto}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          <span className="hidden max-w-[12ch] truncate text-sm font-semibold text-slate-700 md:inline">
            {nombre}
          </span>
          <BotonTema />
          <Link
            href="/clave-nueva"
            className="inline-flex h-11 items-center rounded-full bg-slate-100 px-4 text-sm font-bold text-slate-800 transition hover:bg-slate-200"
          >
            Mi clave
          </Link>
          <form action={cerrarSesionAccion}>
            <button
              type="submit"
              className="h-11 rounded-full bg-slate-900 px-4 text-sm font-bold text-white transition hover:bg-slate-800 active:scale-[0.98]"
            >
              Salir
            </button>
          </form>
        </div>

        {/* En celular: tema, cambio de clave y salir viven en un menu. */}
        <details className="group relative sm:hidden">
          <summary
            aria-label={`Menu de ${nombre}`}
            className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-full bg-slate-900 text-base font-extrabold text-white [&::-webkit-details-marker]:hidden"
          >
            {nombre.charAt(0).toUpperCase()}
          </summary>
          <div className="absolute right-0 top-14 z-30 grid w-56 gap-2 rounded-3xl bg-white p-3 ring-1 ring-slate-900/10 shadow-[0_18px_40px_-20px_rgba(15,23,42,0.4)]">
            <p className="truncate px-3 py-1 text-sm font-bold text-slate-900">{nombre}</p>
            <BotonTema />
            <Link
              href="/clave-nueva"
              className="inline-flex h-11 items-center rounded-2xl bg-slate-100 px-4 text-sm font-bold text-slate-800 transition hover:bg-slate-200"
            >
              Mi clave
            </Link>
            <form action={cerrarSesionAccion}>
              <button
                type="submit"
                className="h-11 w-full rounded-2xl bg-slate-900 px-4 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Salir
              </button>
            </form>
          </div>
        </details>
      </div>
    </header>
  );
}
