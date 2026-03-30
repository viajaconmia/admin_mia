"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  id: string;
};

export default function ClientNav({ id }: Props) {
  const pathname = usePathname();

  const routes = [
    {
      name: "Perfil",
      href: `/dashboard/client/${id}`,
    },
    {
      name: "Reservas",
      href: `/dashboard/client/${id}/reservas`,
    },
    {
      name: "Hoteles",
      href: `/dashboard/client/${id}/hoteles`,
    },
  ];

  return (
    <nav className="flex gap-2 items-center bg-gray-100 rounded-lg p-2">
      {routes.map((route) => {
        const isActive =
          pathname === route.href ||
          (route.href !== `/dashboard/client/${id}` &&
            pathname.startsWith(route.href));

        return (
          <Link
            key={route.href}
            href={route.href}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? "bg-blue-500 text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
            }`}
          >
            {route.name}
          </Link>
        );
      })}
    </nav>
  );
}
