import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente con service_role: solo vive en el servidor.
// Las reglas de acceso (quien ve que, quien puede comprar o aprobar) se aplican en las acciones.
let cliente: SupabaseClient | null = null;

export function db(): SupabaseClient {
  if (!cliente) {
    const url = process.env.SUPABASE_URL;
    const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !clave) {
      throw new Error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno");
    }
    cliente = createClient(url, clave, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cliente;
}
