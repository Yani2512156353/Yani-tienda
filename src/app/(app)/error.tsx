"use client";

import { Boton, Tarjeta } from "@/components/ui";

export default function ErrorApp({ reset }: { error: Error; reset: () => void }) {
  return (
    <Tarjeta className="mx-auto grid max-w-md justify-items-start gap-4">
      <h1 className="text-xl font-bold text-slate-900">Algo salió mal</h1>
      <p className="text-slate-600">No pudimos completar la acción. Intenta de nuevo.</p>
      <Boton type="button" onClick={reset}>
        Reintentar
      </Boton>
    </Tarjeta>
  );
}
