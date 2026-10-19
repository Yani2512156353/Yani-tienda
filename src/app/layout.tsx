import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

// Nunito: redondeada y amable, pensada para leer cifras y nombres sin cansar.
const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tienda de Yani",
  description: "Tienda interna: compra, revisa tu cuenta y avisa tus pagos.",
};

// Aplica el tema guardado antes de pintar la pagina, para evitar un parpadeo.
// Sin preferencia guardada, la app abre en claro.
const scriptTema = `try{if(localStorage.getItem("tema")==="oscuro")document.documentElement.classList.add("dark")}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${nunito.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptTema }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
