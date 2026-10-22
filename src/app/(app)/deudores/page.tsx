import Link from "next/link";
import { redirect } from "next/navigation";
import { resolverPago } from "@/app/acciones";
import { Aviso, Boton, Encabezado, Insignia, Tarjeta } from "@/components/ui";
import { db } from "@/lib/db";
import { fechaCorta, pesos } from "@/lib/formato";
import { obtenerSesion } from "@/lib/sesion";

type Cuenta = {
  usuario_id: string;
  nombre: string;
  saldo: number;
  pago_pendiente: boolean;
};

type PagoPendiente = {
  id: string;
  usuario_id: string;
  monto: number;
  comprobante_path: string | null;
  creado_en: string;
};

// Regla de negocio: "debe" desde 1 peso. Por debajo de eso, la persona esta al dia.
const MINIMO_DEBE = 1;

export default async function PaginaDeudores() {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/");

  if (sesion.rol === "comprador") {
    // El comprador solo consulta su propia fila: el filtro por uid va en el servidor.
    const { data, error } = await db()
      .from("estado_cuentas")
      .select("usuario_id, nombre, saldo, pago_pendiente")
      .eq("usuario_id", sesion.uid)
      .maybeSingle();

    if (error || !data) {
      return <Aviso tono="error">No se pudo cargar tu cuenta. Intenta recargar.</Aviso>;
    }
    return <CuentaComprador cuenta={data as Cuenta} />;
  }

  return <PanelAdmin />;
}

function CuentaComprador({ cuenta }: { cuenta: Cuenta }) {
  const debe = cuenta.saldo >= MINIMO_DEBE;

  return (
    <div className="mx-auto grid max-w-md gap-6">
      <Encabezado titulo="Mi cuenta" />

      <Tarjeta className="entrar grid justify-items-center gap-6 text-center">
        <p className="text-2xl font-extrabold text-slate-900">{cuenta.nombre}</p>

        {debe ? (
          <>
            <div className="grid gap-1">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-600">Cantidad que debes</p>
              <p className="text-4xl font-extrabold tracking-tight text-rose-700">{pesos(cuenta.saldo)}</p>
            </div>

            {cuenta.pago_pendiente ? (
              <div className="grid w-full gap-4">
                <Insignia tono="pendiente">Pendiente de confirmacion</Insignia>
                <p className="text-sm text-slate-600">Ya avisaste tu pago. Yani lo revisara pronto.</p>
              </div>
            ) : (
              <Link
                href="/pagar"
                className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-naranja-500 text-lg font-bold text-sobre-naranja transition hover:bg-naranja-600 active:scale-[0.98]"
              >
                Pagar
              </Link>
            )}
          </>
        ) : (
          <div className="grid justify-items-center gap-4">
            <Insignia tono="al-dia">No debes nada</Insignia>
            <p className="text-slate-600">Estas al dia con la tienda. Gracias.</p>
          </div>
        )}
      </Tarjeta>
    </div>
  );
}

async function PanelAdmin() {
  const [{ data: cuentasData, error: errorCuentas }, { data: pagosData, error: errorPagos }] =
    await Promise.all([
      db().from("estado_cuentas").select("usuario_id, nombre, saldo, pago_pendiente").order("nombre"),
      db()
        .from("pagos")
        .select("id, usuario_id, monto, comprobante_path, creado_en")
        .eq("estado", "pendiente")
        .order("creado_en"),
    ]);

  if (errorCuentas || errorPagos) {
    return <Aviso tono="error">No se pudieron cargar las cuentas. Intenta recargar.</Aviso>;
  }

  const cuentas = (cuentasData ?? []) as Cuenta[];
  const pendientes = (pagosData ?? []) as PagoPendiente[];
  const nombres = new Map(cuentas.map((c) => [c.usuario_id, c.nombre]));

  // Comprobantes en bucket privado: enlaces firmados que duran 10 minutos.
  const comprobantes = new Map<string, string>();
  await Promise.all(
    pendientes
      .filter((p): p is PagoPendiente & { comprobante_path: string } => Boolean(p.comprobante_path))
      .map(async (p) => {
        const { data } = await db()
          .storage.from("comprobantes")
          .createSignedUrl(p.comprobante_path, 600);
        if (data?.signedUrl) comprobantes.set(p.id, data.signedUrl);
      }),
  );

  const deudores = cuentas.filter((c) => c.saldo >= MINIMO_DEBE);
  const totalDebe = deudores.reduce((suma, c) => suma + Number(c.saldo), 0);

  return (
    <div className="grid gap-8">
      <Encabezado
        titulo="Deudores"
        texto="Cuentas de todas las personas. Confirma los pagos que te avisen."
      />

      <div className="grid gap-5 sm:grid-cols-3">
        <Tarjeta className="entrar">
          <p className="text-sm font-semibold text-slate-600">Total por cobrar</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-rose-700">{pesos(totalDebe)}</p>
        </Tarjeta>
        <Tarjeta className="entrar entrar-2">
          <p className="text-sm font-semibold text-slate-600">Personas que deben</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{deudores.length}</p>
        </Tarjeta>
        <Tarjeta className="entrar entrar-3">
          <p className="text-sm font-semibold text-slate-600">Pagos por confirmar</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-amber-700">{pendientes.length}</p>
        </Tarjeta>
      </div>

      {pendientes.length > 0 && (
        <section className="grid gap-5">
          <h2 className="text-xl font-bold text-slate-900">Pagos por confirmar</h2>
          <div className="grid gap-5 md:grid-cols-2">
            {pendientes.map((pago) => (
              <Tarjeta key={pago.id} className="entrar grid gap-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="grid gap-1">
                    <p className="text-lg font-bold text-slate-900">{nombres.get(pago.usuario_id) ?? "Persona"}</p>
                    <p className="text-sm text-slate-600">Avisado el {fechaCorta(pago.creado_en)}</p>
                  </div>
                  <Insignia tono="pendiente">Pendiente de confirmacion</Insignia>
                </div>

                <p className="text-2xl font-extrabold tracking-tight text-slate-900">{pesos(pago.monto)}</p>

                {comprobantes.get(pago.id) ? (
                  <a
                    href={comprobantes.get(pago.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-fit items-center rounded-2xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-800 transition hover:bg-slate-200"
                  >
                    Ver comprobante
                  </a>
                ) : (
                  <p className="text-sm text-slate-600">Sin comprobante adjunto</p>
                )}

                <form action={resolverPago} className="grid grid-cols-2 gap-3">
                  <input type="hidden" name="pago" value={pago.id} />
                  <Boton name="decision" value="aprobar" tono="exito">
                    Aprobar
                  </Boton>
                  <Boton name="decision" value="rechazar" tono="peligro">
                    Rechazar
                  </Boton>
                </form>
              </Tarjeta>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-5">
        <h2 className="text-xl font-bold text-slate-900">Cuentas</h2>
        {cuentas.length === 0 && (
          <Tarjeta>
            <p className="text-slate-600">Todavia no hay compradores registrados.</p>
          </Tarjeta>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cuentas.map((cuenta) => {
            const debe = cuenta.saldo >= MINIMO_DEBE;
            return (
              <Tarjeta key={cuenta.usuario_id} className="entrar grid gap-4 p-6">
                <div className="flex items-start justify-between gap-3">
                  <p className="truncate text-lg font-bold text-slate-900">{cuenta.nombre}</p>
                  {cuenta.pago_pendiente ? (
                    <Insignia tono="pendiente">Pendiente de confirmacion</Insignia>
                  ) : debe ? (
                    <Insignia tono="debe">Debe</Insignia>
                  ) : (
                    <Insignia tono="al-dia">No debe</Insignia>
                  )}
                </div>
                <p className={`text-2xl font-extrabold tracking-tight ${debe ? "text-rose-700" : "text-slate-500"}`}>
                  {pesos(Math.max(cuenta.saldo, 0))}
                </p>
              </Tarjeta>
            );
          })}
        </div>
      </section>
    </div>
  );
}
