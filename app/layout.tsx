import { environment } from "@/lib/constants";
import "./globals.css";
import { Providers } from "@/context/providers";
import ProtectedRoute from "@/components/ProtectedLogin";

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
        {!!environment && (
          <div className="fixed top-0 w-[20vw] left-0 text-center text-xl font-bold text-white bg-red-700 z-[900]">
            {environment.toUpperCase()}
          </div>
        )}
        <Providers>
          <ProtectedRoute>{children}</ProtectedRoute>
        </Providers>
      </body>
    </html>
  );
}
