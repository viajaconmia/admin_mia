/* LLAMADAS A LA API*/
// const URL2 = "https://miaback.vercel.app";
// const ROUTES = {
//   stripe: "/v1/stripe",
//   solicitud: "/v1/solicitud",
//   agentes: "/v1/agentes"
// };
// const ENDPOINTS = {
//   createAgente: "/create",
// };
const URL = "https://miaback.vercel.app";
//const URL = "http://localhost:3001";

const API_KEY =
  "nkt-U9TdZU63UENrblg1WI9I1Ln9NcGrOyaCANcpoS2PJT3BlbkFJ1KW2NIGUYF87cuvgUF3Q976fv4fPrnWQroZf0RzXTZTA942H3AMTKFKJHV6cTi8c6dd6tybUD65fybhPJT3BlbkFJ1KW2NIGPrnWQroZf0RzXTZTA942H3AMTKFy15whckAGSSRSTDvsvfHsrtbXhdrT";
const AUTH = {
  "x-api-key": API_KEY,
};

export const createAgente = async (data: any, id: string) => {
  console.log(data.primer_nombre);
  try {
    const response = await fetch(`${URL}/v1/mia/agentes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...AUTH,
      },
      body: JSON.stringify({
        name: data.primer_nombre,
        secondName: data.segundo_nombre,
        lastname1: data.apellido_paterno,
        lastname2: data.apellido_materno,
        email: data.correo,
        phone: data.telefono,
        password: data.password,
        gender: data.genero,
        id: id,
      }),
    });
    const json = await response.json();
    console.log(json);
    if (json.message === "Agente creado correctamente") {
      return {
        success: true,
      };
    } else {
      return {
        success: false,
      };
    }
  } catch (error) {
    throw error;
  }
};

export const createEmpresa = async (data: any, id: string) => {
  const nombreEmpresa =
    data.primer_nombre +
    " " +
    data.segundo_nombre +
    " " +
    data.apellido_paterno +
    " " +
    data.apellido_materno;
  try {
    const response = await fetch(`${URL}/v1/mia/empresas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...AUTH,
      },
      body: JSON.stringify({
        agente_id: id,
        razon_social: nombreEmpresa,
        nombre_comercial: nombreEmpresa,
        tipo_persona: "fisica",
        calle: data.calle || null,
        colonia: data.colonia || null,
        estado: data.estado || null,
        municipio: data.municipio || null,
        codigo_postal: data.codigo_postal || null,
      }),
    });

    const json = await response.json();
    if (json.message === "Agente creado correctamente") {
      return {
        success: true,
        empresa_id: json.data.id_empresa,
      };
    } else {
      return {
        success: false,
      };
    }
  } catch (error) {
    throw error;
  }
};

export const createNewEmpresa = async (data: any, id: string) => {
  console.log(data)
  try {
    const response = await fetch(`${URL}/v1/mia/empresas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...AUTH,
      },
      body: JSON.stringify({
        agente_id: id,
        razon_social: data.razon_social,
        nombre_comercial: data.nombre_comercial,
        tipo_persona: data.tipo_persona,
        calle: data.empresa_direccion || null,
        colonia: data.empresa_colonia || null,
        estado: data.empresa_estado || null,
        municipio: data.empresa_municipio || null,
        codigo_postal: data.empresa_cp || null,
      }),
    });

    const json = await response.json();
    if (json.message === "Agente creado correctamente") {
      return {
        success: true,
        empresa_id: json.data.id_empresa,
      };
    } else {
      return {
        success: false,
      };
    }
  } catch (error) {
    throw error;
  }
};

export const updateEmpresa = async (data: any, empresaId: string, id: string) => {
  console.log(data);
  try {
    const response = await fetch(`${URL}/v1/mia/empresas/`, {
      method: "PUT", // o "PATCH" dependiendo de tu API
      headers: {
        "Content-Type": "application/json",
        ...AUTH,
      },
      body: JSON.stringify({
        id_empresa: empresaId,
        agente_id: id,
        razon_social: data.razon_social,
        nombre_comercial: data.nombre_comercial,
        tipo_persona: data.tipo_persona,
        calle: data.empresa_direccion || null,
        colonia: data.empresa_colonia || null,
        estado: data.empresa_estado || null,
        municipio: data.empresa_municipio || null,
        codigo_postal: data.empresa_cp || null,
      }),
    });

    const json = await response.json();
    if (json.message === "Empresa actualizada correctamente") { // Ajusta este mensaje según tu API
      return {
        success: true,
        empresa_id: empresaId, // Devolvemos el mismo ID ya que es una actualización
      };
    } else {
      return {
        success: false,
      };
    }
  } catch (error) {
    throw error;
  }
};


export const createNewDatosFiscales = async (data: any) => {
  try {
    const response = await fetch(`${URL}/v1/mia/datosFiscales`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...AUTH,
      },
      body: JSON.stringify({
        id_empresa: data.id_empresa,
        rfc: data.rfc,
        calle: data.calle,
        colonia: data.colonia,
        estado: data.estado,
        municipio: data.municipio,
        codigo_postal_fiscal: data.codigo_postal_fiscal,
        regimen_fiscal: data.regimen_fiscal,
      }),
    });

    const json = await response.json();
    if (json.message === "Datos fiscales creados correctamente") {
      return {
        success: true,
        id_datos_fiscales: json.data.id_datos_fiscales,
      };
    } else {
      return {
        success: false,
      };
    }
  } catch (error) {
    throw error;
  }
};

export const createStripeUser = async (email: string, id_agente: string) => {
  try {
    const response = await fetch(`${URL}/v1/stripe/create-user-stripe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...AUTH,
      },
      body: JSON.stringify({
        id_agente: id_agente,
        email: email,
      }),
    });

    const json = await response.json();
    if (json.success) {
      return {
        success: true,
      };
    } else {
      return {
        success: false,
      };
    }
  } catch (error) {
    throw error;
  }
};

export const createPaymentMethod = async (
  email: string,
  id_customer: string
) => {
  try {
    const response = await fetch(`${URL}/v1/stripe/create-payment-method`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...AUTH,
      },
      body: JSON.stringify({
        id_customer: id_customer,
        email: email,
      }),
    });

    const json = await response.json();
    if (json.success) {
      return {
        success: true,
      };
    } else {
      return {
        success: false,
      };
    }
  } catch (error) {
    throw error;
  }
};

export const createLogPayment = async (
  amount: number,
  id: string,
  response_payment: any
) => {
  try {
    const response = await fetch(`${URL}/v1/stripe/payment-log-storage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...AUTH,
      },
      body: JSON.stringify({
        id_viajero: id,
        amount: amount,
        response_payment: response_payment,
      }),
    });

    const json = await response.json();
    if (json.success) {
      return {
        success: true,
      };
    } else {
      return {
        success: false,
      };
    }
  } catch (error) {
    throw error;
  }
};

export const createNewPago = async (
  id_servicio: string,
  amount: number,
  id_viajero: string,
  banco: string,
  last_digits: string,
  tipo_de_tarjeta: string,
  metodo_de_pago: string,
  concepto: string,
  autorizacion: string,
  currency: string
) => {
  try {
    // Datos para crear el pago
    const datosPago = {
      id_servicio: id_servicio, // ID del servicio relacionado
      monto_a_credito: 0.0, // Ajusta según tu lógica
      responsable_pago_empresa: null, // Ajusta según tu lógica
      responsable_pago_agente: id_viajero, // Ajusta según tu lógica
      fecha_creacion: new Date().toISOString().split("T")[0], // Fecha actual
      pago_por_credito: null, // Ajusta según tu lógica
      pendiente_por_cobrar: false, // Ajusta según tu lógica
      total: (amount / 100), // Monto total del pago
      subtotal: (amount / 100) * 0.84, // Subtotal (ajusta según tu lógica)
      impuestos: (amount / 100) * 0.16, // Impuestos (ajusta según tu lógica)
      banco: banco,
      last_digits: last_digits,
      tipo_de_tarjeta: tipo_de_tarjeta,
      tipo_de_pago: "contado",
      autorizacion_stripe: autorizacion,
      metodo_de_pago: metodo_de_pago,
      concepto: concepto,
      currency: currency
    };

    // Hacer la solicitud HTTP al backend para crear el pago
    const response = await fetch(`${URL}/v1/mia/pagos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...AUTH, // Asegúrate de que AUTH contenga las cabeceras necesarias
      },
      body: JSON.stringify(datosPago),
    });

    const json = await response.json();
    console.log(json);

    if (json.data.success) {
      return { success: true };
    } else {
      return { success: false };
    }
  } catch (error) {
    console.error("Error al crear el pago:", error);
    throw error;
  }
};

// export const createViajero = async (data: any, id_empresa: string) => {
//   try {
//     const response = await fetch(`https://miaback.vercel.app/v1/mia/viajeros`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         ...AUTH,
//       },
//       body: JSON.stringify({
//         id_empresa: id_empresa,
//         primer_nombre: data.primer_nombre,
//         segundo_nombre: data.segundo_nombre,
//         apellido_paterno: data.apellido_paterno,
//         apellido_materno: data.apellido_materno,
//         correo: data.correo,
//         telefono: data.telefono,
//         genero: "masculino",
//         fecha_nacimiento: "2001-09-25 00:00:00",
//       }),
//     });

//     const json = await response.json();
//     console.log(json);
//     if (json.message === "Viajero creado correctamente") {
//       return ({
//         success: true
//       })
//     }
//     else {
//       return ({
//         success: false
//       })
//     }
//   }
//   catch (error) {
//     throw error;
//   }
// }

export const createNewViajero = async (data: any, id_empresa: string[]) => {
  let fechaFormateada = "";
  if (data.fecha_nacimiento) {
    const fechaNacimiento = new Date(data.fecha_nacimiento);
    fechaFormateada = fechaNacimiento.toISOString().split("T")[0] + " 00:00:00";
  }

  try {
    console.log(data);
    const response = await fetch(`${URL}/v1/mia/viajeros`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...AUTH,
      },
      body: JSON.stringify({
        id_empresas: id_empresa,
        primer_nombre: data.primer_nombre.toUpperCase(),
        segundo_nombre: data.segundo_nombre ? data.segundo_nombre.toUpperCase() : null,
        apellido_paterno: data.apellido_paterno.toUpperCase(),
        apellido_materno: data.apellido_materno ? data.apellido_materno.toUpperCase() : null,
        correo: data.correo ? data.correo : null,
        telefono: data.telefono ? data.telefono : null,
        genero: data.genero ? data.genero : null,
        fecha_nacimiento: fechaFormateada ? fechaFormateada : null,
        nacionalidad: data.nacionalidad ? data.nacionalidad: null,
        numero_pasaporte: data.numero_pasaporte ? data.numero_pasaporte : null,
        numero_empleado: data.numero_empleado ? data.numero_empleado : null,
      }),
    });

    const json = await response.json();
    console.log(json);
    if (json.message === "Viajero creado correctamente") {
      return {
        success: true,
      };
    } else {
      return {
        success: false,
      };
    }
  } catch (error) {
    throw error;
  }
};

export const updateViajero = async (data: any, id_empresa: string[], id_viajero: string) => {
  let fechaFormateada = "";
  if (data.fecha_nacimiento) {
    const fechaNacimiento = new Date(data.fecha_nacimiento);
    fechaFormateada = fechaNacimiento.toISOString().split("T")[0] + " 00:00:00";
  }

  try {
    console.log(data);
    const response = await fetch(`${URL}/v1/mia/viajeros`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...AUTH,
      },
      body: JSON.stringify({
        id_viajero: id_viajero,
        id_empresas: id_empresa,
        primer_nombre: data.primer_nombre.toUpperCase(),
        segundo_nombre: data.segundo_nombre ? data.segundo_nombre.toUpperCase() : null,
        apellido_paterno: data.apellido_paterno.toUpperCase(),
        apellido_materno: data.apellido_materno ? data.apellido_materno.toUpperCase() : null,
        correo: data.correo ? data.correo : null,
        telefono: data.telefono ? data.telefono : null,
        genero: data.genero ? data.genero : null,
        fecha_nacimiento: fechaFormateada ? fechaFormateada : null,
        nacionalidad: data.nacionalidad ? data.nacionalidad: null,
        numero_pasaporte: data.numero_pasaporte ? data.numero_pasaporte : null,
        numero_empleado: data.numero_empleado ? data.numero_empleado : null,
      }),
    });

    const json = await response.json();
    console.log(json);
    if (json.message === "Viajero actualizado correctamente") {
      return {
        success: true,
      };
    } else {
      return {
        success: false,
      };
    }
  } catch (error) {
    throw error;
  }
};

export const getCompaniesAgent = async (agent_id: string) => {
  try {
    console.log("En proceso de obtener empresas");
    const response = await fetch(
      `${URL}/v1/mia/agentes/empresas-con-agentes?id_agente=${encodeURIComponent(
        agent_id
      )}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...AUTH,
        },
      }
    );

    const json = await response.json();
    return json;
  } catch (error) {
    throw error;
  }
};

export const getCompaniesAgentViajeros = async (agent_id: string) => {
  try {
    console.log("En proceso de obtener viajeros");
    const response = await fetch(
      `${URL}/v1/mia/agentes/viajeros-con-empresas?id_agente=${encodeURIComponent(
        agent_id
      )}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...AUTH,
        },
      }
    );

    const json = await response.json();
    console.log(json);
    return json;
  } catch (error) {
    throw error;
  }
};

export const getEmpresasDatosFiscales = async (agent_id: string) => {
  try {
    console.log("En proceso de obtener viajeros");
    const response = await fetch(
      `${URL}/v1/mia/agentes/empresas-con-datos-fiscales?id_agente=${encodeURIComponent(
        agent_id
      )}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...AUTH,
        },
      }
    );
    const json = await response.json();
    console.log(json);
    return json;
  } catch (error) {
    throw error;
  }
};

export const getFacturas = async (agent_id: string) => {
  try {
    console.log("En proceso de obtener facturas");
    const response = await fetch(
      `${URL}/v1/mia/factura/getFacturas`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...AUTH,
        },
      }
    );
    const json = await response.json();
    console.log(json);
    return json;
  } catch (error) {
    throw error;
  }
};

export const getPaymentMethods = async (agent_id: string) => {
  try {
    console.log("En proceso de obtener metodos de pago");
    const response = await fetch(
      `${URL}/v1/stripe/get-payment-methods?id_agente=${encodeURIComponent(
        agent_id
      )}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...AUTH,
        },
      }
    );
    const json = await response.json();
    console.log(json);
    return json;
  } catch (error) {
    throw error;
  }
};

export const getCreditAgent = async (agent_id: string) => {
  try {
    console.log("En proceso de obtener metodos de pago");
    const response = await fetch(
      `${URL}/v1/mia/pagos/agente?id_agente=${encodeURIComponent(
        agent_id
      )}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...AUTH,
        },
      }
    );
    const json = await response.json();
    console.log(json);
    return json;
  } catch (error) {
    throw error;
  }
};

export const getPagosAgente = async (agent_id: string) => {
  try {
    console.log("En proceso de obtener metodos de pago");
    const response = await fetch(
      `${URL}/v1/mia/pagos/pagosAgente?id_agente=${encodeURIComponent(
        agent_id
      )}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...AUTH,
        },
      }
    );
    const json = await response.json();
    console.log(json);
    return json;
  } catch (error) {
    throw error;
  }
};

export const getPendientesAgente = async (agent_id: string) => {
  try {
    console.log("En proceso de obtener metodos de pago");
    const response = await fetch(
      `${URL}/v1/mia/pagos/pendientesAgente?id_agente=${encodeURIComponent(
        agent_id
      )}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...AUTH,
        },
      }
    );
    const json = await response.json();
    console.log(json);
    return json;
  } catch (error) {
    throw error;
  }
};

export const getHoteles = async () => {
  try {
    console.log("En proceso de obtener hoteles");
    const response = await fetch(
      `${URL}/v1/mia/hoteles/hotelesWithTarifa`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...AUTH,
        },
      }
    );
    const json = await response.json();
    console.log(json);
    return json;
  } catch (error) {
    throw error;
  }
};

export const deleteTraveler = async (id_viajero: string) => {
  try {
    const response = await fetch(`${URL}/v1/mia/viajeros?id_viajero=${id_viajero}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...AUTH,
      },
    });

    const json = await response.json();
    console.log(json);

    if (json.message === "Viajero eliminado correctamente") {
      return {
        success: true,
      };
    } else {
      return {
        success: false,
        error: json.message || "No se pudo eliminar el viajero",
      };
    }
  } catch (error) {
    console.error("Error al eliminar viajero:", error);
    return {
      success: false,
      error: "Error de red o del servidor",
    };
  }
};
