# Pendientes — deuda técnica conocida

## Migrar endpoints legacy usados por `reporte_hospedaje` a v2

Ambos se usan hoy tal cual porque no existe todavía un equivalente `/v2/mia/...`. Quedan documentados aquí para no perderlos de vista.

- **`listarAgentes()`** en [`angel/services/agentes/index.ts`](services/agentes/index.ts) usa `GET /mia/agentes/all` (legacy, devuelve el objeto `Agente` completo). Migrar a un endpoint v2 ligero, ej. `GET /v2/mia/agentes/listado`, que devuelva solo `{ id_agente, nombre }` — es lo único que se consume del catálogo de clientes en el `ClientesContext`.
- **`getAgentesReportFac()`** en [`angel/services/facturas/agentesReport.ts`](services/facturas/agentesReport.ts) usa `GET /mia/factura/agentes_report_fac` (legacy, mismo endpoint que ya usa hoy `app/dashboard/detalles_facturas/page.tsx`). Migrar a su equivalente `/v2/mia/...` cuando exista.

Cuando cualquiera de los dos se cree en v2: reemplazar el `fetch` directo por `createApiClient` (patrón estándar de `angel/services/`, ver CLAUDE.md) y quitar el comentario `TODO(pendiente)` junto al código.
