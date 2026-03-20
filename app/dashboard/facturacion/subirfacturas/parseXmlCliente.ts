export async function parsearXML(xmlFile: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function (e) {
      const xmlString = e.target?.result as string;

      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");

        const getAttr = (element: Element | null, attr: string): string =>
          element?.getAttribute(attr) || "";

        const comprobante = xmlDoc.getElementsByTagName("cfdi:Comprobante")[0];
        const emisor = xmlDoc.getElementsByTagName("cfdi:Emisor")[0];
        const receptor = xmlDoc.getElementsByTagName("cfdi:Receptor")[0];
        const timbre = xmlDoc.getElementsByTagName("tfd:TimbreFiscalDigital")[0];

        // NUEVO
        const impuestos = xmlDoc.getElementsByTagName("cfdi:Impuestos")[0];
        const trasladoGlobal = impuestos?.getElementsByTagName("cfdi:Traslado")[0] || null;

        const impuestosLocales =
          xmlDoc.getElementsByTagName("implocal:ImpuestosLocales")[0] || null;

        const trasladoLocal =
          impuestosLocales?.getElementsByTagName("implocal:TrasladosLocales")[0] || null;

        const addendaHoteleria =
          xmlDoc.getElementsByTagName("posadas:Hoteleria")[0] || null;

        // Conceptos con impuestos internos
        const conceptos = Array.from(
          xmlDoc.getElementsByTagName("cfdi:Concepto")
        ).map((concepto) => {
          const traslado = concepto.getElementsByTagName("cfdi:Traslado")[0];

          return {
            cantidad: getAttr(concepto, "Cantidad"),
            descripcion: getAttr(concepto, "Descripcion"),
            valorUnitario: getAttr(concepto, "ValorUnitario"),
            importe: getAttr(concepto, "Importe"),
            unidad: getAttr(concepto, "Unidad"),
            claveProdServ: getAttr(concepto, "ClaveProdServ"),
            claveUnidad: getAttr(concepto, "ClaveUnidad"),
            objetoImp: getAttr(concepto, "ObjetoImp"),
            impuestos: traslado
              ? {
                  impuesto: getAttr(traslado, "Impuesto"),
                  tipoFactor: getAttr(traslado, "TipoFactor"),
                  tasaOCuota: getAttr(traslado, "TasaOCuota"),
                  importe: getAttr(traslado, "Importe"),
                  base: getAttr(traslado, "Base"),
                }
              : null,
          };
        });

        const data = {
          comprobante: {
            // EXISTENTES
            serie: getAttr(comprobante, "Serie"),
            folio: getAttr(comprobante, "Folio"),
            fecha: getAttr(comprobante, "Fecha"),
            subtotal: getAttr(comprobante, "SubTotal"),
            total: getAttr(comprobante, "Total"),
            moneda: getAttr(comprobante, "Moneda"),
            tipoCambio: getAttr(comprobante, "TipoCambio"), // 👈 NUEVO
            tipoDeComprobante: getAttr(comprobante, "TipoDeComprobante"),
            formaPago: getAttr(comprobante, "FormaPago"),
            metodoPago: getAttr(comprobante, "MetodoPago"),
            lugarExpedicion: getAttr(comprobante, "LugarExpedicion"),
            condicionesDePago: getAttr(comprobante, "CondicionesDePago"),
            exportacion: getAttr(comprobante, "Exportacion"),
            noCertificado: getAttr(comprobante, "NoCertificado"),

            // NUEVOS (compatibles)
            version: getAttr(comprobante, "Version"),
            certificado: getAttr(comprobante, "Certificado"),
            sello: getAttr(comprobante, "Sello"),
          },

          emisor: {
            rfc: getAttr(emisor, "Rfc"),
            nombre: getAttr(emisor, "Nombre"),
            regimenFiscal: getAttr(emisor, "RegimenFiscal"),
          },

          receptor: {
            rfc: getAttr(receptor, "Rfc"),
            nombre: getAttr(receptor, "Nombre"),
            usoCFDI: getAttr(receptor, "UsoCFDI"),
            regimenFiscal: getAttr(receptor, "RegimenFiscalReceptor"),
            domicilioFiscal: getAttr(receptor, "DomicilioFiscalReceptor"),
          },

          conceptos,

          impuestos: {
            totalTrasladado: getAttr(impuestos, "TotalImpuestosTrasladados"),
            traslado: trasladoGlobal
              ? {
                  impuesto: getAttr(trasladoGlobal, "Impuesto"),
                  tasa: getAttr(trasladoGlobal, "TasaOCuota"),
                  importe: getAttr(trasladoGlobal, "Importe"),
                  base: getAttr(trasladoGlobal, "Base"),
                  tipoFactor: getAttr(trasladoGlobal, "TipoFactor"),
                }
              : null,
          },

          // NUEVO
          impuestosLocales: impuestosLocales
            ? {
                totalRetenciones: getAttr(impuestosLocales, "TotaldeRetenciones"),
                totalTraslados: getAttr(impuestosLocales, "TotaldeTraslados"),
                version: getAttr(impuestosLocales, "version"),
                traslado: trasladoLocal
                  ? {
                      impuestoLocal: getAttr(trasladoLocal, "ImpLocTrasladado"),
                      importe: getAttr(trasladoLocal, "Importe"),
                      tasa: getAttr(trasladoLocal, "TasadeTraslado"),
                    }
                  : null,
              }
            : null,

          timbreFiscal: {
            uuid: getAttr(timbre, "UUID"),
            fechaTimbrado: getAttr(timbre, "FechaTimbrado"),
            selloCFD: getAttr(timbre, "SelloCFD"),
            selloSAT: getAttr(timbre, "SelloSAT"),
            noCertificadoSAT: getAttr(timbre, "NoCertificadoSAT"),
            rfcProvCertif: getAttr(timbre, "RfcProvCertif"),

            // NUEVO
            version: getAttr(timbre, "Version"),
          },

          // NUEVO
          addenda: addendaHoteleria
            ? {
                hoteleria: {
                  agencia: getAttr(addendaHoteleria, "agencia"),
                  cajero: getAttr(addendaHoteleria, "cajero"),
                  compania: getAttr(addendaHoteleria, "compania"),
                  contracCode: getAttr(addendaHoteleria, "contracCode"),
                  extension: getAttr(addendaHoteleria, "extension"),
                  fechaLlegada: getAttr(addendaHoteleria, "fechaLlegada"),
                  fechaSalida: getAttr(addendaHoteleria, "fechaSalida"),
                  folio: getAttr(addendaHoteleria, "folio"),
                  habitacion: getAttr(addendaHoteleria, "habitacion"),
                  huesped: getAttr(addendaHoteleria, "huesped"),
                  importeaPagar: getAttr(addendaHoteleria, "importeaPagar"),
                  numeroFormato: getAttr(addendaHoteleria, "numeroFormato"),
                  numeroReferencia: getAttr(addendaHoteleria, "numeroReferencia"),
                  reservacion: getAttr(addendaHoteleria, "reservacion"),
                },
              }
            : null,
        };

        console.log(data);
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Error reading XML file"));
    reader.readAsText(xmlFile);
  });
}