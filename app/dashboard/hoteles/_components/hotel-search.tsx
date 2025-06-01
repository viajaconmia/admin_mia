"use client";

import { Input } from "@/components/ui/input";
import { useState } from "react";
interface HotelSearchProps {
  onSearch: (value: string) => void;
  initialValue?: string; 
  isLoading?: boolean;   
}

export function HotelSearch({ onSearch, initialValue = '', isLoading = false }: HotelSearchProps) {
  return (
    <Input
      placeholder="Buscar hotel..."
      value={initialValue}
      onChange={(e) => onSearch(e.target.value)}
    />
  );
}
