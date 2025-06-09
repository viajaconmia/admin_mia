export const metadata = {
  title: "MIA - Operaciones",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen bg-transparent overflow-y-auto bg-gradient-to-br from-sky-200 to-sky-400">
      <main className="p-8 pt-0 bg-transparent">{children}</main>
    </div>
  );
}
