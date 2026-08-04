export const EmptyState = ({
  message = "No se encontraron registros",
}: {
  message?: string;
}) => (
  <div className="px-6 py-4 w-full text-center text-sm text-gray-500 border rounded-sm bg-white">
    {message}
  </div>
);
