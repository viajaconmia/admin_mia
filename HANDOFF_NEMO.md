# Handoff — Integración de Hoteles Nemo (PriceSurfer) y Reservas en MIA

> **Fecha:** Noviembre 2026  
> **Rama en `admin_mia`:** `feat/nemo-integration`  
> **Rama en `bacl`:** `feat/nemo-integration`  
> **Rama en `hotel-provider-service`:** `reservas-hoteles`  
> **Estado:** **Listo para pruebas y revisión en ambiente de staging/desarrollo** (Ningún cambio ha sido ni debe ser subido a `main`).

---

## 1. Objetivo y Alcance

Permitir a los operadores de MIA buscar hoteles y tarifas externas en el inventario de **Nemo (PriceSurfer)**, seleccionar un Cliente y Viajero Principal registrados en MIA, ajustar el margen de ganancia o precio final de venta al cliente en pesos mexicanos (MXN), y crear la reservación formal en la base de datos de MIA (MySQL) bajo el intermediario proveedor **NEMO**, soportando cobro a **Crédito Consolidado** o **Saldo a Favor (Wallet)**.

### Reglas Críticas de Negocio y Seguridad
1. **Nemo es estrictamente READ-ONLY**: Por política de certificación y seguridad, **NUNCA** se ejecuta `bookHotel` contra los servidores de Nemo (`service-cert.psurfer.net`). Todas las tarifas devueltas se marcan con `bookable: false` y motivo `PROVIDER_BOOKING_DISABLED`.
2. **Aislamiento en Ramas**: Todos los desarrollos residen en la rama `feat/nemo-integration` (tanto en `admin_mia` como en `bacl`). **No se debe hacer merge a `main`** hasta contar con la validación operativa total.
3. **Hoteles Inactivos por Defecto**: Cualquier hotel externo importado desde Nemo se inserta en la tabla `hoteles` con `Activo = 0` y precios base en `$0.00` para no contaminar búsquedas públicas de MIA ni motores de cotización existentes.
4. **Métodos de Cobro Exclusivos**: Únicamente se soporta Crédito (`bandera = 0`) o Wallet (`bandera = 1`), sin pagos mixtos.

---

## 2. Base de Datos e Intermediario NEMO

- **Registro en `proveedores`**:
  - `id_proveedor`: `4278`
  - `proveedor`: `'NEMO'`
  - `intermediario`: `1`
  - `estatus`: `1`
  - *Documentado en Obsidian Vault:* `db/tabla proveedores.md`
- **Doble Verificación de Hoteles (`ensureHotelExists`)**:
  - Implementado en `bacl/api/modules/nemo/nemo.service.js`.
  - Paso 1: Busca por `id_hotel = 'NMO_' + hotelCode`.
  - Paso 2: Si no existe por ID, busca por nombre insensible a mayúsculas/minúsculas (`LOWER(TRIM(nombre)) = LOWER(TRIM(?))`).
  - Paso 3: Si no existe, realiza el `INSERT` con `Activo = 0`, `id_cadena = 11`, y descripción informativa. El trigger MySQL `trg_hoteles_insert_proveedor` crea en automático la fila correspondiente en `proveedores`.

---

## 3. Arquitectura Backend (`bacl`)

Módulo v2 limpio ubicado en `api/modules/nemo/`:

- **`nemo.router.js`**:
  - `POST /v2/mia/nemo/hoteles/search`: Búsqueda de disponibilidad por ciudad/destino y fechas.
  - `GET /v2/mia/nemo/hoteles/details/:hotelCode`: Ficha técnica y fotos del hotel.
  - `POST /v2/mia/nemo/hoteles/validate-rate`: Validación de tarifa y reglas de cancelación.
  - `POST /v2/mia/nemo/hoteles/cancellation-fees`: Políticas de penalización por cancelación.
  - `POST /v2/mia/nemo/reservas/crear`: Creación formal de la reservación en MIA.
- **`nemo.service.js`**:
  - Conexión al adaptador XML de Nemo y orquestación con la base de datos de MIA.
  - Mapeo y ejecución de `insertarReservaOperaciones(reservaPayload, bandera)` en `api/v1/model/reservas.js`.
  - Separa formalmente el costo proveedor (`NEMO`) del precio de venta al cliente.
  - Maneja la inserción de pagos y el decremento atómico de saldo a favor en `saldos_a_favor` cuando `bandera = 1`.

---

## 4. Frontend (`admin_mia`)

### Componentes y Rutas
- **Página de Acceso**: `app/dashboard/nemo-hoteles/page.tsx` (URL: `http://localhost:3000/dashboard/nemo-hoteles`).
- **Organismo Principal**: `components/organism/NemoHotelSearch.tsx`:
  - Componente atómico, autocontenido y responsivo.
  - **Sección 1 (Cliente y Viajero)**:
    - Búsqueda instantánea en memoria mediante `ClientesContext` (`useClientes()`).
    - Despliegue de **Saldo Crédito** y **Saldo Wallet** tanto en el desplegable predictivo como en la tarjeta del cliente seleccionado.
    - Carga reactiva de los viajeros registrados del cliente vía `fetchViajerosFromAgent`.
    - Manejo seguro de casos sin viajeros registrados o con formatos de array heterogéneos.
  - **Sección 2 (Búsqueda en Nemo)**:
    - Selector rápido de destinos (Cancún, CDMX, Guadalajara, Monterrey, etc.) o código libre.
    - Filtros por rango de fechas y número de huéspedes.
  - **Sección 3 (Catálogo y Detalle de Tarifas)**:
    - Despliegue de hoteles, estrellas, ubicación y lista de tarifas disponibles.
  - **Modal de Confirmación y Creación de Reserva**:
    - **Ajuste de Tarifa & Margen**: Permite especificar porcentaje de markup (+10%, +15%, +20%, +25%) o escribir directamente el precio de venta en pesos. Cálculo bidireccional automático y visualización de la ganancia estimada en verde esmeralda.
    - **Selector de Forma de Pago**:
      - **Pago a Crédito**: Muestra el saldo de crédito disponible. Se deshabilita automáticamente si el cliente no cuenta con línea de crédito autorizada.
      - **Saldo a Favor / Wallet**: Muestra el total acumulado en Wallet. Incluye botón **"Auto-cubrir total"** (algoritmo greedy que cubre el 100% de la venta usando los saldos a favor activos), botón **"Usar saldo"** por fila, y botón **"Limpiar"**.
    - Validación estricta que previene la creación de reservas si los saldos aplicados no cubren el total de venta.
    - Actualización reactiva de saldos en pantalla una vez completada la reserva con éxito.

### Servicios Creados/Actualizados
- `services/nemo.ts`: DTOs e interfaces TypeScript para búsqueda y creación de reservación.
- `services/viajeros.ts`: Normalización para extraer siempre `response.data` como array nativo.

---

## 5. Resumen de Commits y Ramas

### Repositorio `admin_mia`:
- **Rama:** `feat/nemo-integration`
- **Últimos Commits:**
  - `f80a13d`: `feat(nemo): use ClientesContext in search, fix traveler array normalization and add selling price markup customization`
  - `1c2813f`: `feat(nemo): display client wallet balance and enhance wallet payment experience`
  - *(Este commit)*: `docs(handoff): add HANDOFF_NEMO.md detailing Nemo integration, wallet flows, and operations guide`

### Repositorio `bacl`:
- **Rama:** `feat/nemo-integration`
- **Último Commit:**
  - `e0b4914`: `feat(nemo): port nemo integration into bacl v2 with ensureHotelExists and reservation endpoint`

---

## 6. Guía Rápida para Pruebas Operativas

1. Iniciar servidores en ramas `feat/nemo-integration`:
   ```bash
   # Backend
   cd proyecto_mia/bacl && node index.js
   # Frontend
   cd proyecto_mia/admin_mia && npm run dev
   ```
2. Ingresar a `http://localhost:3000/dashboard/nemo-hoteles`.
3. En la Sección 1:
   - Buscar un cliente con Wallet (por ejemplo: `PATRICIA SILVA` o `JESUS LEOBARDO RIVERA PEREZ`).
   - Confirmar que se visualice tanto el Saldo Crédito como el Saldo Wallet en el autocompletado y en el cuadro de selección.
   - Seleccionar un viajero principal.
4. En la Sección 2:
   - Seleccionar destino (ej. "Cancún") y fechas de check-in / check-out.
   - Presionar "Buscar Hoteles".
5. En la Sección 3:
   - Elegir una tarifa y presionar "Reservar Tarifa".
   - Ajustar el precio de venta o el margen de ganancia deseado.
   - Seleccionar "Saldo a Favor / Wallet" y presionar "Auto-cubrir total".
   - Confirmar la reserva y verificar el folio generado (`id_servicio` y `id_booking`).
