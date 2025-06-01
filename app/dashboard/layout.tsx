export const metadata = {
  title: "MIA - Operaciones",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-fit bg-transparent">
      <main className="p-8 bg-transparent">{children}</main>
    </div>
  );
}
