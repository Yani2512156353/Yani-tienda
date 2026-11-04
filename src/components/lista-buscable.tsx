"use client";

import { useState, type ReactNode } from "react";

export type ItemBuscable = { id: string; texto: string; nodo: ReactNode };

function normalizar(valor: string): string {
  return valor.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

// Filtra tarjetas ya renderizadas por texto, sin tildes ni mayusculas.
export function ListaBuscable({
  items,
  placeholder,
  vacio,
  className,
}: {
  items: ItemBuscable[];
  placeholder: string;
  vacio: string;
  className: string;
}) {
  const [consulta, setConsulta] = useState("");
  const q = normalizar(consulta);
  const visibles = q ? items.filter((i) => normalizar(i.texto).includes(q)) : items;

  return (
    <div className="grid gap-5">
      <input
        type="search"
        value={consulta}
        onChange={(e) => setConsulta(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none placeholder:text-slate-500 focus:border-teal-700 focus:ring-2 focus:ring-teal-700"
      />
      {visibles.length === 0 ? (
        <p className="text-slate-600">{vacio}</p>
      ) : (
        <div className={className}>
          {visibles.map((i) => (
            <div key={i.id} className="contents">
              {i.nodo}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
