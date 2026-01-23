import PdfPrinter from 'pdfmake';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import * as tiposAtomicos from './tipos-atomicos.js';
import { DatoAtomico } from './tipos-atomicos.js';
import { Response } from 'express';


export function generarPdfCertificado(alumno: Record<string, DatoAtomico>, res: Response) {
  const fonts = {
    Roboto: {
      normal: 'Helvetica',
      bold: 'Helvetica-Bold',
      italics: 'Helvetica-Oblique',
      bolditalics: 'Helvetica-BoldOblique'
    }
  };
  const printer = new PdfPrinter(fonts);

  const docDefinition: TDocumentDefinitions = {
    pageSize: 'A4',
    pageMargins: [60, 60, 60, 60],

    // El borde dorado
    background: function (_: any, pageSize: { width: number; height: number }) {
      return {
        canvas: [
          {
            type: 'rect',
            x: 30, y: 30,
            w: pageSize.width - 60,
            h: pageSize.height - 60,
            lineWidth: 3,
            lineColor: '#9b036'
          }
        ]
      };
    },

    content: [
      // Encabezado
      { text: 'Facultad de Ciencias Exactas y Naturales', style: 'header' },
      { text: 'Universidad de Buenos Aires', style: 'subheader' },

      { text: '\n\n\nCERTIFICADO DE TÍTULO EN TRÁMITE', style: 'title' },

      // Cuerpo 1
      {
        text: [
          'El/La abajo firmante, certifica que:\n\n'
        ],
        style: 'bodyText'
      },

      // --- AQUÍ ESTÁ LA MAGIA: REEMPLAZAMOS TEXTO POR VARIABLES ---
      {
        layout: 'noBorders',
        table: {
          widths: [150, '*'],
          body: [
            [{ text: 'Número de Libreta:', bold: true }, tiposAtomicos.datoATexto(alumno.lu!)],
            [{ text: 'Nombres:', bold: true }, tiposAtomicos.datoATexto(alumno.nombre!)],
            [{ text: 'Apellidos:', bold: true }, tiposAtomicos.datoATexto(alumno.apellido!)],
            [{ text: 'Título Obtenido:', bold: true }, tiposAtomicos.datoATexto(alumno.titulo!)],
            [{ text: 'Fecha:', bold: true }, tiposAtomicos.datoATexto(alumno.titulo_en_tramite!)]
          ]
        },
        margin: [20, 10, 0, 20]
      },

      // Cuerpo 2
      {
        text: '\nHa completado satisfactoriamente todos los requisitos académicos correspondientes a la carrera y se encuentra en trámite la expedición de su título oficial.\n\nSe extiende el presente certificado a solicitud del interesado para los fines que estime convenientes.',
        style: 'bodyText',
        alignment: 'justify'
      },

      // Firmas
      {
        text: '\n\n\n\n',
      },
      {
        columns: [
          {
            stack: [
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1 }] },
              { text: 'Firma Autoridad Competente', color: 'gray', fontSize: 10, margin: [0, 5, 0, 0] }
            ],
            alignment: 'center'
          },
          {
            stack: [
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1 }] },
              { text: 'Sello de la Institución', color: 'gray', fontSize: 10, margin: [0, 5, 0, 0] }
            ],
            alignment: 'center'
          }
        ]
      },
    ],

    styles: {
      header: {
        fontSize: 22,
        bold: true,
        alignment: 'center',
        color: '#2c3e50'
      },
      subheader: {
        fontSize: 12,
        alignment: 'center',
        color: '#7f8c8d',
        margin: [0, 5, 0, 0]
      },
      title: {
        fontSize: 26,
        bold: true,
        alignment: 'center',
        color: '#2c3e50',
        margin: [0, 20, 0, 20],
        characterSpacing: 1
      },
      bodyText: {
        fontSize: 14,
        lineHeight: 1.5
      },
      small: {
        fontSize: 9,
        color: 'gray'
      }
    }
  };

  // 4. Generar y Pipear
  const pdfDoc = printer.createPdfKitDocument(docDefinition);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=certificado_${tiposAtomicos.datoATexto(alumno.lu!).replace('/', '-')}.pdf`);

  pdfDoc.pipe(res);
  pdfDoc.end();
}
