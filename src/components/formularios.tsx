"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import {
  avisarPago,
  cambiarClave,
  comprarProducto,
  crearUsuario,
  guardarProducto,
  iniciarSesionAccion,
  restablecerClave,
  type Estado,
} from "@/app/acciones";
import { Aviso, Boton, Campo, CampoArchivo } from "@/components/ui";
import { pesos } from "@/lib/formato";

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
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (estado?.ok) formRef.current?.reset();
  }, [estado]);
  return (
    <form ref={formRef} action={accion} className="grid gap-5">
      <Campo
        etiqueta="Nombre de la persona"
        name="nombre"
        maxLength={40}
        ayuda="La clave inicial es 1234; la persona debe cambiarla al entrar. El nombre no se puede repetir."
        required
      />
      {estado?.error && <Aviso tono="error">{estado.error}</Aviso>}
      {estado?.ok && (
        <Aviso tono="ok">Usuario creado. Dile que entre con su nombre y la clave 1234.</Aviso>
      )}
      <Boton tono="principal" pendiente={pendiente} className="w-full">
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
  agregado_rapido: boolean;
  unidades_por_paquete: number;
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
      {producto && <input type="hidden" name="stock_original" value={producto.stock} />}
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
      <div className="grid gap-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-900/5 sm:col-span-2">
        <label className="flex items-center gap-3 text-sm font-semibold text-slate-800">
          <input
            type="checkbox"
            name="agregado_rapido"
            defaultChecked={producto?.agregado_rapido ?? false}
            className="h-5 w-5 accent-teal-700"
          />
          Habilitar agregado rápido
        </label>
        <Campo
          id={`${uid}-unidades`}
          etiqueta="Unidades por paquete"
          name="unidades_por_paquete"
          type="number"
          min="1"
          max="1000"
          step="1"
          defaultValue={producto?.unidades_por_paquete ?? 12}
          ayuda="Cuánto suma cada pulsación del botón de agregado rápido."
        />
      </div>
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
  precio,
}: {
  productoId: string;
  stock: number;
  precio: number;
}) {
  const [estado, accion, pendiente] = useActionState(comprarProducto, undefined as Estado);
  const [cantidad, setCantidad] = useState(1);
  const uid = useId();

  // Tras comprar, la cantidad vuelve a 1 (y no puede pasar del stock que queda).
  useEffect(() => {
    if (estado?.ok) setCantidad(1);
  }, [estado]);

  const ajustar = (valor: number) => setCantidad(Math.min(Math.max(1, valor || 1), stock));
  const botonPaso =
    "grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-100 text-xl font-bold text-slate-800 transition hover:bg-slate-200 active:scale-[0.98] disabled:opacity-40";

  return (
    <form action={accion} className="grid gap-3">
      <input type="hidden" name="producto" value={productoId} />
      <label htmlFor={`${uid}-cantidad`} className="text-sm font-semibold text-slate-700">
        Cantidad
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Quitar una unidad"
          disabled={cantidad <= 1}
          onClick={() => ajustar(cantidad - 1)}
          className={botonPaso}
        >
          −
        </button>
        <input
          id={`${uid}-cantidad`}
          name="cantidad"
          type="number"
          inputMode="numeric"
          min={1}
          max={stock}
          value={cantidad}
          onChange={(e) => ajustar(Number(e.target.value))}
          required
          className="h-12 w-full min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-2 text-center text-base text-slate-900 outline-none focus:border-teal-700 focus:bg-white focus:ring-2 focus:ring-teal-700"
        />
        <button
          type="button"
          aria-label="Agregar una unidad"
          disabled={cantidad >= stock}
          onClick={() => ajustar(cantidad + 1)}
          className={botonPaso}
        >
          +
        </button>
      </div>
      <p aria-live="polite" className="text-sm font-semibold text-slate-600">
        Total: <span className="font-extrabold text-slate-900">{pesos(precio * cantidad)}</span>
      </p>
      <Boton tono="exito" pendiente={pendiente} className="w-full">
        Comprar
      </Boton>
      {estado?.error && <Aviso tono="error">{estado.error}</Aviso>}
      {estado?.ok && <Aviso tono="ok">Compra registrada. Se sumó a tu cuenta.</Aviso>}
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

export function FormularioClave({ obligatorio }: { obligatorio: boolean }) {
  const [estado, accion, pendiente] = useActionState(cambiarClave, undefined as Estado);
  return (
    <form action={accion} className="grid gap-5">
      <Campo
        etiqueta="Clave nueva"
        name="nueva"
        type="password"
        inputMode="text"
        autoComplete="new-password"
        minLength={4}
        maxLength={12}
        ayuda="Entre 4 y 12 caracteres, sin espacios."
        required
      />
      <Campo
        etiqueta="Repite la clave nueva"
        name="repetir"
        type="password"
        autoComplete="new-password"
        minLength={4}
        maxLength={12}
        required
      />
      {estado?.error && <Aviso tono="error">{estado.error}</Aviso>}
      <Boton tono="exito" pendiente={pendiente} className="w-full">
        {obligatorio ? "Guardar mi clave" : "Cambiar clave"}
      </Boton>
    </form>
  );
}

export function BotonRestablecer({ usuarioId, nombre }: { usuarioId: string; nombre: string }) {
  const [estado, accion, pendiente] = useActionState(restablecerClave, undefined as Estado);
  return (
    <form
      action={accion}
      className="grid gap-2"
      onSubmit={(e) => {
        if (!window.confirm(`¿Restablecer la clave de ${nombre} a 1234?`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="usuario" value={usuarioId} />
      <Boton tono="suave" pendiente={pendiente} className="w-full">
        Restablecer clave
      </Boton>
      {estado?.error && <Aviso tono="error">{estado.error}</Aviso>}
      {estado?.ok && <Aviso tono="ok">Listo: ahora su clave es 1234.</Aviso>}
    </form>
  );
}
