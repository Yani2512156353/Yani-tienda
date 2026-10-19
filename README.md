# Tienda de Yani

Tienda interna con cuentas por persona, stock, deudas y avisos de pago.
Next.js (App Router) + Supabase (Postgres y Storage) + Vercel.

## Roles

- **Yani (admin):** agrega y edita productos, ve todas las cuentas, aprueba o rechaza pagos.
- **Compradores:** ven solo los productos con stock, compran, ven solo su cuenta y avisan pagos.

## Puesta en marcha

1. Crear un proyecto en Supabase.
2. En el SQL Editor, ejecutar `supabase/migrations/0001_tienda_esquema.sql`.
3. Copiar `.env.example` a `.env.local` y llenar `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y `SESSION_SECRET`.
4. Poner el QR de pago en `public/qr-pago.png`.
5. `npm install` y `npm run dev`.

Usuario inicial: **Yani**, clave **1234**. Los usuarios nuevos se crean desde la portada con clave 1234.

## Seguridad

- La `service_role` key solo vive en el servidor (variables de entorno). Nunca va al navegador ni al repositorio.
- La base tiene RLS activo y sin permisos para la clave publica: sin la service_role no se lee nada.
- Cada accion del servidor vuelve a comprobar el rol antes de actuar.
- La sesion es una cookie `httpOnly` firmada con `SESSION_SECRET`.

## Reglas de negocio (en la base de datos)

- Compra: descuenta stock en una transaccion. Si el stock llega a 0 el producto deja de verse para compradores.
- Debe: saldo de 1 peso o mas. Por debajo, la cuenta aparece como "no debe".
- Aviso de pago: solo una persona puede tener un aviso pendiente a la vez.
