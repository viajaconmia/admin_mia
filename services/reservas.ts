import { EdicionForm, ReservaForm, Viajero } from "@/types";
import { URL, API_KEY } from "@/lib/constants";

export async function updateReserva(
  reserva: EdicionForm & {
    nuevo_incluye_desayuno: boolean | null;
    acompanantes: Viajero[];
  },
  id_booking: string,
  callback?: (data: any) => void
) {
  try {
    const response = await fetch(`${URL}/mia/reservas?id=${id_booking}`, {
      method: "PUT",
      headers: {
        "x-api-key": API_KEY || "",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reserva),
      cache: "no-store",
    }).then((res) => res.json());
    if (callback) {
      callback(response);
    }
    console.log(response);
    if (response.error) {
      throw new Error("Error al cargar los datos en reservas");
    }
    return response;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function fetchCreateReservaOperaciones(
  reserva,
  callback?: (data: any) => void
) {
  try {
    const response = await fetch(`${URL}/mia/reservas/operaciones`, {
      method: "POST",
      headers: {
        "x-api-key": API_KEY || "",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reserva),
      cache: "no-store",
    }).then((res) => res.json());

    console.log(response);

    if (response.error) {
      throw new Error("Error al cargar los datos en reservas");
    }
    if (callback) {
      callback(response);
    }

    return response;
  } catch (error) {
    console.log(error);
    throw error;
  }
}
export async function fetchCreateReserva(reserva) {
  try {
    const response = await fetch(`${URL}/mia/reservas/operaciones`, {
      method: "POST",
      headers: {
        "x-api-key": API_KEY || "",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reserva),
      cache: "no-store",
    }).then((res) => res.json());

    console.log(response);

    if (response.error) {
      throw new Error("Error al cargar los datos en reservas");
    }

    return response;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function fetchCreateReservaFromSolicitud(
  reserva: ReservaForm & {
    nuevo_incluye_desayuno: boolean | null;
    acompanantes: Viajero[];
  },
  callback?: (data: any) => void
) {
  try {
    const response = await fetch(`${URL}/mia/reservas`, {
      method: "POST",
      headers: {
        "x-api-key": API_KEY || "",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reserva }),
      cache: "no-store",
    }).then((res) => res.json());

    console.log(response);

    if (response.error) {
      alert(response.details || "Error al cargar los datos en reservas");
      callback({
        error: true,
        message: "Error al cargar los datos en reservas",
      });
      return {
        error: true,
        message: "Error al cargar los datos en reservas",
      };
    }
    if (callback) {
      callback({
        ok: true,
        message: "Reserva creada correctamente",
        data: response,
      });
    }

    return response;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export const fetchReservations = async (client: string, callback) => {
  try {
    // Replace with your actual API endpoint
    const data = await fetch(`${URL}/mia/reservas/agente?id=${client}`, {
      method: "GET",
      headers: {
        "x-api-key": API_KEY || "",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }).then((res) => res.json());
    console.log(data);
    callback(data);
  } catch (error) {
    throw error;
  }
};
export const fetchReservationsAll = async (callback) => {
  try {
    // Replace with your actual API endpoint
    const data = await fetch(`${URL}/mia/reservas/all`, {
      method: "GET",
      headers: {
        "x-api-key": API_KEY || "",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }).then((res) => res.json());
    console.log(data);
    callback(data);
  } catch (error) {
    throw error;
  }
};

export const fetchReservationsFacturacion = async (callback) => {
  try {
    // Replace with your actual API endpoint
    const data = await fetch(`${URL}/mia/reservas/allFacturacion`, {
      method: "GET",
      headers: {
        "x-api-key": API_KEY || "",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }).then((res) => res.json());
    console.log(data);
    callback(data);
  } catch (error) {
    throw error;
  }
};

export const fetchReserva = async (id: string, callback) => {
  try {
    const data = await fetch(`${URL}/mia/reservas/id?id=${id}`, {
      method: "GET",
      headers: {
        "x-api-key": API_KEY || "",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    }).then((res) => res.json());
    console.log(data);
    callback(data);
  } catch (error) {
    throw error;
  }
};
