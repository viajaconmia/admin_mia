import "./globals.css";
import { Providers } from "@/context/providers";

export const metadata = {
  title: "MIA Admin",
  description: "administrando tu vida",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-gradient-to-br from-sky-200 to-sky-400 h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
