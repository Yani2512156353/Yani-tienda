import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// Sesion firmada en una cookie httpOnly. No hay estado en el servidor:
// el token trae uid, rol y vencimiento, y la firma impide alterarlo.
const COOKIE = "tienda_sesion";
const DURACION_SEGUNDOS = 60 * 60 * 24 * 7; // 7 dias

export type Rol = "admin" | "comprador";

export type Sesion = {
  uid: string;
  rol: Rol;
  nombre: string;
  exp: number;
};

function secreto(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error("SESSION_SECRET debe tener al menos 32 caracteres");
  }
  return s;
}

function firmar(payload: string): string {
  return createHmac("sha256", secreto()).update(payload).digest("base64url");
}

function crearToken(datos: Omit<Sesion, "exp">): string {
  const exp = Math.floor(Date.now() / 1000) + DURACION_SEGUNDOS;
  const payload = Buffer.from(JSON.stringify({ ...datos, exp })).toString("base64url");
  return `${payload}.${firmar(payload)}`;
}

function leerToken(token: string | undefined): Sesion | null {
  if (!token) return null;
  const [payload, firma] = token.split(".");
  if (!payload || !firma) return null;

  const esperada = Buffer.from(firmar(payload));
  const recibida = Buffer.from(firma);
  if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) return null;

  const sesion = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Sesion;
  if (sesion.exp < Math.floor(Date.now() / 1000)) return null;
  return sesion;
}

export async function obtenerSesion(): Promise<Sesion | null> {
  const jar = await cookies();
  return leerToken(jar.get(COOKIE)?.value);
}

export async function iniciarSesion(datos: Omit<Sesion, "exp">): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, crearToken(datos), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACION_SEGUNDOS,
  });
}

export async function cerrarSesion(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}
