"use client";

import { BookingsService } from "@/services/BookingService";
import { useEffect } from "react";

export default function VistaSolicitudes() {
  useEffect(() => {
    const book = new BookingsService();
    book
      .obtenerCotizaciones()
      .then((res) => console.log(res))
      .catch((err) => console.log("como te llama no se", err));
  }, []);
  return (
    <div className="bg-white">
      <h1>hol</h1>
    </div>
  );
}
