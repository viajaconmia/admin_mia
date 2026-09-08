# Pendientes — deuda técnica conocida

## Migrar endpoints legacy usados por `reporte_hospedaje` a v2

Se usa hoy tal cual porque no existe todavía un equivalente `/v2/mia/...`. Queda documentado aquí para no perderlo de vista.

- **`listarAgentes()`** en [`angel/services/agentes/index.ts`](services/agentes/index.ts) usa `GET /mia/agentes/all` (legacy, devuelve el objeto `Agente` completo). Migrar a un endpoint v2 ligero, ej. `GET /v2/mia/agentes/listado`, que devuelva solo `{ id_agente, nombre }` — es lo único que se consume del catálogo de clientes en el `ClientesContext`.

`getAgentesReportFac()` ya se migró a `getReporteAgente()` sobre `GET /v2/mia/factura/reservas/reporte-agente` (incluye `ticket_zoho`, `portal`, `orden_compra`, `cliente_solicitante_reserva` editables vía `PATCH /v2/mia/reservas/:id_booking`).
