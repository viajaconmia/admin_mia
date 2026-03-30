import NavClient from "@/components/atom/NavClient";

export default function LayoutClient({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  return (
    <main className="flex flex-col gap-4 p-4">
      <NavClient id={params.id} />

      <div className="bg-white rounded-lg shadow-sm p-4">{children}</div>
    </main>
  );
}
