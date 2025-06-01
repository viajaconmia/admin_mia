"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface CreditSearchProps {
  onSearch: (term: string) => void;
}

export function CreditSearch({ onSearch }: CreditSearchProps) {
  return (
    <div className="flex items-center space-x-2">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre de agente o empresa..."
          className="pl-8"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
    </div>
  );
}
