// parseXmlCliente.ts
export async function parsearXML(xmlFile: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = function (e) {
      const xmlString = e.target?.result as string;

      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
        const getAttr = (element: Element | null, attr: string): string => {
          return element?.getAttribute(attr) || '';
        };

        const comprobante = xmlDoc.getElementsByTagName('cfdi:Comprobante')[0];
      
        const emisor = xmlDoc.getElementsByTagName('cfdi:Emisor')[0];
        
        // Receptor data
        const receptor = xmlDoc.getElementsByTagName('cfdi:Receptor')[0];
        
        // Conceptos
        const conceptos = Array.from(xmlDoc.getElementsByTagName('cfdi:Concepto')).map(concepto => ({
          descripcion: getAttr(concepto, 'Descripcion'),
          cantidad: getAttr(concepto, 'Cantidad'),
          valorUnitario: getAttr(concepto, 'ValorUnitario'),
          importe: getAttr(concepto, 'Importe')
        }));

        // Impuestos
        const impuestos = xmlDoc.getElementsByTagName('cfdi:Traslado')[0];
        
        // Timbre Fiscal
        const timbre = xmlDoc.getElementsByTagName('tfd:TimbreFiscalDigital')[0];

        const data = {
          comprobante: {
            folio: getAttr(comprobante, 'Folio'),
            fecha: getAttr(comprobante, 'Fecha'),
            subtotal: getAttr(comprobante, 'SubTotal'),
            total: getAttr(comprobante, 'Total'),
            moneda: getAttr(comprobante, 'Moneda')
          },
          emisor: {
            rfc: getAttr(emisor, 'Rfc'),
            nombre: getAttr(emisor, 'Nombre')
          },
          receptor: {
            rfc: getAttr(receptor, 'Rfc'),
            nombre: getAttr(receptor, 'Nombre')
          },
          conceptos,
          impuestos: {
            total: getAttr(xmlDoc.getElementsByTagName('cfdi:Impuestos')[0], 'TotalImpuestosTrasladados'),
            traslado: {
              impuesto: getAttr(impuestos, 'Impuesto'),
              tasa: getAttr(impuestos, 'TasaOCuota'),
              importe: getAttr(impuestos, 'Importe')
            }
          },
          timbreFiscal: {
            uuid: getAttr(timbre, 'UUID'),
            fechaTimbrado: getAttr(timbre, 'FechaTimbrado')
          }
        };

        resolve(data);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Error reading XML file'));
    };

    reader.readAsText(xmlFile);
  });
}