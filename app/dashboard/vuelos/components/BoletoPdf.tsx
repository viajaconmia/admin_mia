"use client";

import React from "react";
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from "@react-pdf/renderer";
import type { VueloComprado, FlightStatusResponse } from "@/services/flights";

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 11 },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  title: { fontSize: 16, fontWeight: 700 },
  section: { marginTop: 10, padding: 10, borderWidth: 1, borderRadius: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  label: { color: "#444" },
  value: { fontWeight: 700 },
  foot: { marginTop: 14, fontSize: 9, color: "#666" },
});

const BoletoDoc = ({ vuelo, status }: { vuelo: VueloComprado; status: FlightStatusResponse }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Cupón de Vuelo</Text>
          <Text>{vuelo.airlineName} ({vuelo.airlineCode})</Text>
          <Text>Salida: {vuelo.departureDateISO} {vuelo.departureTime ?? ""}</Text>
        </View>
        <View>
          <Text style={{ fontWeight: 700 }}>{status.status}</Text>
          {status.statusText ? <Text>{status.statusText}</Text> : null}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={{ fontWeight: 700 }}>Pasajero</Text>
        <View style={styles.row}><Text style={styles.label}>Nombre</Text><Text style={styles.value}>{vuelo.passengerFullName}</Text></View>
        {vuelo.passengerEmail ? <View style={styles.row}><Text style={styles.label}>Correo</Text><Text style={styles.value}>{vuelo.passengerEmail}</Text></View> : null}
        {vuelo.confirmationCode ? <View style={styles.row}><Text style={styles.label}>Confirmación</Text><Text style={styles.value}>{vuelo.confirmationCode}</Text></View> : null}
      </View>

      <View style={styles.section}>
        <Text style={{ fontWeight: 700 }}>Ruta</Text>
        <View style={styles.row}><Text style={styles.label}>Origen</Text><Text style={styles.value}>{vuelo.originIata ?? "—"}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Destino</Text><Text style={styles.value}>{vuelo.destinationIata ?? "—"}</Text></View>
      </View>

      <View style={styles.section}>
        <Text style={{ fontWeight: 700 }}>Estatus consultado</Text>
        <View style={styles.row}><Text style={styles.label}>Salida programada</Text><Text style={styles.value}>{status.scheduledDeparture ?? "—"}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Salida estimada</Text><Text style={styles.value}>{status.estimatedDeparture ?? "—"}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Llegada programada</Text><Text style={styles.value}>{status.scheduledArrival ?? "—"}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Llegada estimada</Text><Text style={styles.value}>{status.estimatedArrival ?? "—"}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Terminal</Text><Text style={styles.value}>{status.terminal ?? "—"}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Puerta</Text><Text style={styles.value}>{status.gate ?? "—"}</Text></View>
      </View>

      <Text style={styles.foot}>Consultado: {status.fetchedAtISO} · Fuente: {status.source}</Text>
    </Page>
  </Document>
);

export function BoletoPdfDownload({
  vuelo,
  status,
  disabled,
}: {
  vuelo: VueloComprado;
  status: FlightStatusResponse | null;
  disabled?: boolean;
}) {
  if (!status) return <span className="text-[11px] text-gray-400">Consulta primero…</span>;

  const fileName = `cupon-${vuelo.airlineCode}-${vuelo.id}.pdf`;

  return (
    <PDFDownloadLink document={<BoletoDoc vuelo={vuelo} status={status} />} fileName={fileName}>
      {({ loading }) => (
        <button
          type="button"
          disabled={disabled || loading}
          className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-60"
        >
          {loading ? "Generando…" : "Descargar PDF"}
        </button>
      )}
    </PDFDownloadLink>
  );
}
