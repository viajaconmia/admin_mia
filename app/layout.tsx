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
      <body className="bg-[#f0f7ff] h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
