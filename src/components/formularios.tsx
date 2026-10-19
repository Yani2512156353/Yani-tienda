"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import {
  avisarPago,
  comprarProducto,
  crearUsuario,
  guardarProducto,
  iniciarSesionAccion,
  type Estado,
} from "@/app/acciones";
import { Aviso, Boton, Campo, CampoArchivo } from "@/components/ui";

export function FormularioLogin() {
  const [estado, accion, pendiente] = useActionState(iniciarSesionAccion, undefined as Estado);
  return (
    <form action={accion} className="grid gap-5">
      <Campo
        etiqueta="Tu nombre"
        name="nombre"
        autoComplete="username"
        maxLength={40}
        required
      />
      <Campo
        etiqueta="Tu clave"
        name="clave"
        type="password"
        inputMode="numeric"
        autoComplete="current-password"
        required
      />
      {estado?.error && <Aviso tono="error">{estado.error}</Aviso>}
      <Boton tono="principal" pendiente={pendiente} className="w-full">
        Entrar
      </Boton>
    </form>
  );
}

export function FormularioRegistro() {
  const [estado, accion, pendiente] = useActionState(crearUsuario, undefined as Estado);
  return (
    <form action={accion} className="grid gap-5">
      <Campo
        etiqueta="Nombre de la persona"
        name="nombre"
        maxLength={40}
        ayuda="Tu clave inicial es 1234. El nombre no se puede repetir."
        required
      />
      {estado?.error && <Aviso tono="error">{estado.error}</Aviso>}
      {estado?.ok && (
        <Aviso tono="ok">Usuario creado. Ya puedes entrar con tu nombre y la clave 1234.</Aviso>
      )}
      <Boton tono="suave" pendiente={pendiente} className="w-full">
        Crear usuario
      </Boton>
    </form>
  );
}

export type ProductoEditable = {
  id: string;
  nombre: string;
  precio: number;
  stock: number;
};

export function FormularioProducto({ producto }: { producto?: ProductoEditable }) {
  const [estado, accion, pendiente] = useActionState(guardarProducto, undefined as Estado);
  const editando = Boolean(producto);
  // Varios formularios conviven en la misma pagina: cada campo necesita un id propio.
  const uid = useId();
  const formRef = useRef<HTMLFormElement>(null);

  // Al crear un producto, el formulario se limpia despues de guardar.
  useEffect(() => {
    if (estado?.ok && !editando) formRef.current?.reset();
  }, [estado, editando]);

  return (
    <form ref={formRef} action={accion} className="grid gap-5 sm:grid-cols-2">
      {producto && <input type="hidden" name="id" value={producto.id} />}
      <div className="sm:col-span-2">
        <Campo
          id={`${uid}-nombre`}
          etiqueta="Nombre del producto"
          name="nombre"
          defaultValue={producto?.nombre}
          maxLength={80}
          required
        />
      </div>
      <Campo
        id={`${uid}-precio`}
        etiqueta="Precio (COP)"
        name="precio"
        type="number"
        min="1"
        step="1"
        defaultValue={producto?.precio}
        required
      />
      <Campo
        id={`${uid}-stock`}
        etiqueta="Stock actual"
        name="stock"
        type="number"
        min="0"
        step="1"
        defaultValue={producto?.stock ?? 0}
        required
      />
      <div className="sm:col-span-2">
        <CampoArchivo
          id={`${uid}-imagen`}
          etiqueta="Imagen (opcional)"
          name="imagen"
          accept="image/jpeg,image/png,image/webp"
          ayuda={
            editando
              ? "Déjalo vacío para conservar la imagen actual. Máximo 5 MB."
              : "JPG, PNG o WEBP. Máximo 5 MB."
          }
        />
      </div>
      {estado?.error && (
        <div className="sm:col-span-2">
          <Aviso tono="error">{estado.error}</Aviso>
        </div>
      )}
      {estado?.ok && (
        <div className="sm:col-span-2">
          <Aviso tono="ok">Producto guardado.</Aviso>
        </div>
      )}
      <div className="sm:col-span-2">
        <Boton tono="principal" pendiente={pendiente} className="w-full sm:w-auto">
          {editando ? "Guardar cambios" : "Agregar producto"}
        </Boton>
      </div>
    </form>
  );
}

export function FormularioCompra({
  productoId,
  stock,
}: {
  productoId: string;
  stock: number;
}) {
  const [estado, accion, pendiente] = useActionState(comprarProducto, undefined as Estado);
  return (
    <form action={accion} className="grid gap-3">
      <input type="hidden" name="producto" value={productoId} />
      <div className="flex items-end gap-3">
        <label className="grid flex-1 gap-2">
          <span className="text-sm font-semibold text-slate-700">Cantidad</span>
          <input
            name="cantidad"
            type="number"
            min={1}
            max={stock}
            defaultValue={1}
            required
            className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-900 outline-none focus:border-teal-700 focus:bg-white focus:ring-4 focus:ring-teal-700/15"
          />
        </label>
        <Boton tono="exito" pendiente={pendiente} className="flex-1">
          Comprar
        </Boton>
      </div>
      {estado?.error && <Aviso tono="error">{estado.error}</Aviso>}
      {estado?.ok && <Aviso tono="ok">Compra registrada. Se sumo a tu cuenta.</Aviso>}
    </form>
  );
}

export function FormularioPago() {
  const [estado, accion, pendiente] = useActionState(avisarPago, undefined as Estado);
  return (
    <form action={accion} className="grid gap-5">
      <CampoArchivo
        etiqueta="Foto del comprobante (opcional)"
        name="comprobante"
        accept="image/jpeg,image/png,image/webp"
        ayuda="Si la tienes, sube la captura. Puedes avisar sin foto."
      />
      {estado?.error && <Aviso tono="error">{estado.error}</Aviso>}
      <Boton tono="exito" pendiente={pendiente} className="w-full">
        Avisar de pago
      </Boton>
    </form>
  );
}
