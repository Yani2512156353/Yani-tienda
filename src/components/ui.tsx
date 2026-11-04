// Piezas visuales sin estado. Pueden usarse desde Server y Client Components.
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export function Tarjeta({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-3xl bg-white p-5 ring-1 ring-slate-900/5 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.22)] sm:p-8 ${className}`}
    >
      {children}
    </section>
  );
}

export function Encabezado({
  titulo,
  texto,
  accion,
}: {
  titulo: string;
  texto?: string;
  accion?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="grid gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          {titulo}
        </h1>
        {texto && <p className="max-w-[60ch] text-base leading-relaxed text-slate-600">{texto}</p>}
      </div>
      {accion}
    </div>
  );
}

type CampoProps = InputHTMLAttributes<HTMLInputElement> & {
  etiqueta: string;
  ayuda?: string;
};

export function Campo({ etiqueta, ayuda, id, ...resto }: CampoProps) {
  const idCampo = id ?? resto.name ?? undefined;
  return (
    <div className="grid gap-2">
      <label htmlFor={idCampo} className="text-sm font-semibold text-slate-700">
        {etiqueta}
      </label>
      <input
        id={idCampo}
        className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-teal-700 focus:bg-white focus:ring-2 focus:ring-teal-700"
        {...resto}
      />
      {ayuda && <p className="text-sm text-slate-600">{ayuda}</p>}
    </div>
  );
}

export function CampoArchivo({
  etiqueta,
  ayuda,
  id,
  ...resto
}: InputHTMLAttributes<HTMLInputElement> & { etiqueta: string; ayuda?: string }) {
  const idCampo = id ?? resto.name ?? undefined;
  return (
    <div className="grid gap-2">
      <label htmlFor={idCampo} className="text-sm font-semibold text-slate-700">
        {etiqueta}
      </label>
      <input
        id={idCampo}
        type="file"
        className="block w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2.5 file:font-semibold file:text-white hover:file:bg-slate-800 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        {...resto}
      />
      {ayuda && <p className="text-sm text-slate-600">{ayuda}</p>}
    </div>
  );
}

type TonoAviso = "error" | "ok" | "info";

const estilosAviso: Record<TonoAviso, string> = {
  error: "bg-rose-50 text-rose-800 ring-rose-200",
  ok: "bg-teal-50 text-teal-900 ring-teal-200",
  info: "bg-amber-50 text-amber-900 ring-amber-200",
};

const iconosAviso: Record<TonoAviso, string> = { error: "!", ok: "✓", info: "i" };

export function Aviso({ tono, children }: { tono: TonoAviso; children: ReactNode }) {
  return (
    <p
      role={tono === "error" ? "alert" : "status"}
      className={`flex items-start gap-2 rounded-2xl px-4 py-3 text-sm font-semibold ring-1 ${estilosAviso[tono]}`}
    >
      <span aria-hidden="true" className="font-extrabold">
        {iconosAviso[tono]}
      </span>
      <span>{children}</span>
    </p>
  );
}

type TonoBoton = "principal" | "exito" | "suave" | "peligro";

const estilosBoton: Record<TonoBoton, string> = {
  principal: "bg-slate-900 text-white hover:bg-slate-800",
  exito: "bg-teal-700 text-white hover:bg-teal-800",
  suave: "bg-slate-100 text-slate-800 hover:bg-slate-200",
  peligro: "bg-rose-50 text-rose-800 ring-1 ring-rose-200 hover:bg-rose-100",
};

export function Boton({
  tono = "principal",
  pendiente = false,
  className = "",
  children,
  disabled,
  ...resto
}: ButtonHTMLAttributes<HTMLButtonElement> & { tono?: TonoBoton; pendiente?: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled || pendiente}
      aria-busy={pendiente || undefined}
      className={`inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-2xl px-6 text-base font-bold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${estilosBoton[tono]} ${className}`}
      {...resto}
    >
      {pendiente && (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
        />
      )}
      {pendiente ? "Un momento..." : children}
    </button>
  );
}

export type TonoInsignia = "debe" | "al-dia" | "pendiente" | "neutro";

const estilosInsignia: Record<TonoInsignia, string> = {
  debe: "bg-rose-50 text-rose-800 ring-rose-200",
  "al-dia": "bg-teal-50 text-teal-900 ring-teal-200",
  pendiente: "bg-amber-50 text-amber-900 ring-amber-200",
  neutro: "bg-slate-100 text-slate-700 ring-slate-200",
};

export function Insignia({ tono, children }: { tono: TonoInsignia; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[13px] font-bold ring-1 ${estilosInsignia[tono]}`}
    >
      {children}
    </span>
  );
}
