"use client";

import { useState } from "react";

// Muestra el QR desde /public/qr-pago.png. Si el archivo aun no existe,
// se ve un marco de espera en vez de una imagen rota.
export function QrPago() {
  const [falla, setFalla] = useState(false);

  return (
    // Fondo blanco fijo en ambos temas: el QR necesita contraste para poder escanearse.
    <div className="grid aspect-square w-full max-w-[280px] place-items-center rounded-[24px] bg-[#ffffff] p-4 ring-1 ring-slate-900/5">
      {falla ? (
        <p className="px-4 text-center text-sm font-semibold text-slate-600">
          El codigo QR de pago se mostrara aqui
        </p>
      ) : (
        <img
          src="/qr-pago.png"
          alt="Codigo QR para pagar"
          onError={() => setFalla(true)}
          className="h-full w-full rounded-2xl object-contain"
        />
      )}
    </div>
  );
}
