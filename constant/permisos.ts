export const PERMISOS = {
  VISTAS: {
    ADMIN: "view.admin",
    INICIO: "view.inicio",
    PROVEEDOR_PAGOS: "view.proveedor-pagos",
    PROVEEDOR_PAGOS_PAGADOS: "view.proveedor-pagados",
    RESERVAS: "view.reservas",
    CLIENTES: "view.clientes",
    HOTELES: "view.hoteles",
    SOLICITUDES: "view.solicitudes",
    PAGOS: "view.pagos",
    FACTURAS: "view.facturas",
    FACTURAS_PREPAGO: "view.fact-prepago",
    FACTURAS_CREDITO: "view.fact-cred",
    CONFIRMATION_CODE: "view.confirm-code",
    VIAJEROS: "view.viajeros",
    APLICACION_DE_SALDO: "view.apli-sald",
    CUENTAS_POR_COBRAR: "view.cuenta-cobr",
    PROVEEDORES: "view.proveedores",
  },
  COMPONENTES: {
    BOTON: {
      PAGAR_PROVEEDOR: "button.pagar-proveedor-reserva",
      CREAR_RESERVA: "button.crear-reserva",
      EDITAR_PRECIO_RESERVA: "button.edit-price-booking",
      ACTUALIZAR_PDF_FACTURA: "button.actualizar_factura_pdf",
    },
    GROUP: {
      PROVEEDORES_EDICIONES: "button.proveedores.edicion",
      PROVEEDORES_EDICIONES_FINANZAS: "button.proveedores.fiscal",
    },
  },
  VERSION: {
    AGREGAR_WALLET_OPERACIONES: "modal.operaciones-agregar-wallet",
    AGREGAR_WALLET_FINANZAS: "modal.finanzas-agregar-wallet",
    PROVEEDORES_FINANZAS: "view.finanzas.proveedores",
  },
} as const;
