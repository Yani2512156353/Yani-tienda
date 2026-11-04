import { Tarjeta } from "@/components/ui";

// Esqueleto mientras cargan las paginas de la app.
export default function Cargando() {
  return (
    <div className="grid gap-8" role="status" aria-label="Cargando">
      <div className="h-10 w-48 animate-pulse rounded-2xl bg-slate-200 motion-reduce:animate-none" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((n) => (
          <Tarjeta key={n} className="grid gap-4">
            <div className="aspect-[4/3] animate-pulse rounded-2xl bg-slate-200 motion-reduce:animate-none" />
            <div className="h-5 w-2/3 animate-pulse rounded-xl bg-slate-200 motion-reduce:animate-none" />
            <div className="h-8 w-1/3 animate-pulse rounded-xl bg-slate-200 motion-reduce:animate-none" />
          </Tarjeta>
        ))}
      </div>
    </div>
  );
}
