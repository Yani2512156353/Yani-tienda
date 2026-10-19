import Link from "next/link";
import { redirect } from "next/navigation";
import { FormularioPago } from "@/components/formularios";
import { QrPago } from "@/components/qr-pago";
import { Aviso, Encabezado, Insignia, Tarjeta } from "@/components/ui";
import { db } from "@/lib/db";
import { pesos } from "@/lib/formato";
import { obtenerSesion } from "@/lib/sesion";

// Solo se llega aqui desde el boton Pagar de la cuenta. Sin deuda, no hay nada que pagar.
export default async function PaginaPagar() {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/");
  if (sesion.rol === "admin") redirect("/deudores");

  const { data, error } = await db()
    .from("estado_cuentas")
    .select("saldo, pago_pendiente")
    .eq("usuario_id", sesion.uid)
    .maybeSingle();

  if (error || !data) {
    return <Aviso tono="error">No se pudo cargar tu cuenta. Intenta recargar.</Aviso>;
  }

  const saldo = Number(data.saldo);
  const debe = saldo >= 1;

  return (
    <div className="mx-auto grid max-w-md gap-6">
      <Encabezado titulo="Pagar" />

      {!debe && (
        <Tarjeta className="entrar grid justify-items-start gap-4">
          <Insignia tono="al-dia">No debes nada</Insignia>
          <Link href="/deudores" className="font-bold text-teal-800 underline-offset-4 hover:underline">
            Volver a mi cuenta
          </Link>
        </Tarjeta>
      )}

      {debe && (
        <Tarjeta className="entrar grid justify-items-center gap-6 text-center">
          <div className="grid gap-1">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-600">Total a pagar</p>
            <p className="text-4xl font-extrabold tracking-tight text-rose-700">{pesos(saldo)}</p>
          </div>

          <QrPago />

          <p className="text-sm leading-relaxed text-slate-600">
            Escanea el codigo con tu app de pagos. Cuando termines, avisa aqui para que Yani lo confirme.
          </p>

          {data.pago_pendiente ? (
            <div className="grid w-full gap-4">
              <Aviso tono="info">Ya avisaste tu pago. Espera la confirmacion de Yani.</Aviso>
              <Link href="/deudores" className="font-bold text-teal-800 underline-offset-4 hover:underline">
                Volver a mi cuenta
              </Link>
            </div>
          ) : (
            <div className="grid w-full text-left">
              <FormularioPago />
            </div>
          )}
        </Tarjeta>
      )}
    </div>
  );
}
