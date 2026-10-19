"use client";

import { useEffect, useState } from "react";

// Alterna entre tema claro (por defecto) y oscuro. La preferencia queda en este navegador.
export function BotonTema() {
  const [oscuro, setOscuro] = useState(false);

  useEffect(() => {
    setOscuro(document.documentElement.classList.contains("dark"));
  }, []);

  function cambiar() {
    const siguiente = !oscuro;
    setOscuro(siguiente);
    document.documentElement.classList.toggle("dark", siguiente);
    try {
      localStorage.setItem("tema", siguiente ? "oscuro" : "claro");
    } catch {
      // Sin almacenamiento disponible (modo privado, por ejemplo): el cambio dura lo que la pagina.
    }
  }

  return (
    <button
      type="button"
      onClick={cambiar}
      aria-pressed={oscuro}
      className="h-10 whitespace-nowrap rounded-full bg-slate-100 px-4 text-sm font-bold text-slate-800 transition hover:bg-slate-200 active:scale-[0.98]"
    >
      {oscuro ? "Modo claro" : "Modo oscuro"}
    </button>
  );
}
