import { obtenerIniciales } from "@/helpers/formater";

export const UserProfileImage = ({ name }: { name: string }) => {
  return (
    <div className="rounded-full w-9 h-9 bg-[#ffc64f] border-2 border-blue-700  flex justify-center items-center">
      <p className="text-base">{obtenerIniciales(name || "")}</p>
    </div>
  );
};
