import path from "path";

// pdfmake has no official @types package for its Node.js singleton API
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfmake: any = require("pdfmake");

pdfmake.setLocalAccessPolicy(() => true);
pdfmake.setUrlAccessPolicy(() => false);

const FONTS_DIR = path.join(__dirname, "../../../node_modules/pdfmake/fonts/Roboto");

pdfmake.fonts = {
    Roboto: {
        normal:      path.join(FONTS_DIR, "Roboto-Regular.ttf"),
        bold:        path.join(FONTS_DIR, "Roboto-Medium.ttf"),
        italics:     path.join(FONTS_DIR, "Roboto-Italic.ttf"),
        bolditalics: path.join(FONTS_DIR, "Roboto-MediumItalic.ttf"),
    },
};

interface PopulatedName { name: string }
interface PopulatedFullname { fullname: string }

export interface OperationServiceReportRow {
    concept: string;
    date: Date | string;
    type?: "D" | "P";
    charge?: number;
    payment?: number;
    operation_id?: {
        key: string;
        batch?: string;
        year?: number;
        brand_id?: PopulatedName | null;
        model_id?: PopulatedName | null;
        client_id?: PopulatedFullname | null;
    } | null;
}

export interface OperationServicesReportPDFInput {
    type: "D" | "P";
    from: Date;
    to: Date;
    clientName: string | null;
    concept: string | null;
    rows: OperationServiceReportRow[];
    total: number;
}

const DATE_FMT = (d: Date | string) =>
    new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });

const MONEY_FMT = (n: number) =>
    (n ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

const headerCell = (text: string, alignment: "left" | "right" | "center" = "left") => ({
    text,
    fillColor: "#1a1a2e",
    color: "#ffffff",
    bold: true,
    fontSize: 9,
    alignment,
    margin: [5, 5, 5, 5],
});

const cell = (text: string, alignment: "left" | "right" | "center" = "left") => ({
    text: text || "—",
    fontSize: 9,
    alignment,
    margin: [5, 4, 5, 4],
});

export async function generateOperationServicesReportPDF(data: OperationServicesReportPDFInput): Promise<Buffer> {
    const isPayment = data.type === "P";
    const reportTitle = isPayment ? "REPORTE DE PAGOS" : "REPORTE DE CARGOS";
    const amountHeader = isPayment ? "Pago" : "Cargo";

    // columns: Fecha | Operación | Lote | Cliente | Vehículo | Concepto | Monto
    const headerRow = [
        headerCell("Fecha", "center"),
        headerCell("Operación"),
        headerCell("Lote"),
        headerCell("Cliente"),
        headerCell("Vehículo"),
        headerCell("Concepto"),
        headerCell(amountHeader, "right"),
    ];

    const dataRows = data.rows.map((r) => {
        const op = r.operation_id ?? undefined;
        const vehiculo = [op?.year, op?.brand_id?.name, op?.model_id?.name].filter(Boolean).join(" ");
        const amount = (isPayment ? r.payment : r.charge) ?? 0;
        return [
            cell(DATE_FMT(r.date), "center"),
            cell(op?.key ?? ""),
            cell(op?.batch ?? ""),
            cell(op?.client_id?.fullname ?? ""),
            cell(vehiculo),
            cell(r.concept ?? ""),
            cell(MONEY_FMT(amount), "right"),
        ];
    });

    // Fila de total al final de la tabla.
    const totalRow = [
        { text: "TOTAL", colSpan: 6, bold: true, fontSize: 10, alignment: "right" as const, margin: [5, 5, 5, 5] },
        {}, {}, {}, {}, {},
        { text: MONEY_FMT(data.total), bold: true, fontSize: 10, alignment: "right" as const, margin: [5, 5, 5, 5] },
    ];

    const tableBody: any[] = [headerRow, ...dataRows, totalRow];

    const infoRows: any[] = [
        [
            { text: "Periodo:", bold: true, fontSize: 11, border: [false, false, false, false] },
            { text: `${DATE_FMT(data.from)} – ${DATE_FMT(data.to)}`, fontSize: 11, border: [false, false, false, false] },
        ],
        [
            { text: "Cliente:", bold: true, fontSize: 11, border: [false, false, false, false] },
            { text: data.clientName ?? "Todos los clientes", fontSize: 11, border: [false, false, false, false] },
        ],
    ];
    if (data.concept) {
        infoRows.push([
            { text: "Concepto:", bold: true, fontSize: 11, border: [false, false, false, false] },
            { text: data.concept, fontSize: 11, border: [false, false, false, false] },
        ]);
    }
    infoRows.push([
        { text: "Registros:", bold: true, fontSize: 11, border: [false, false, false, false] },
        { text: String(data.rows.length), fontSize: 11, border: [false, false, false, false] },
    ]);

    const infoTable = {
        table: { widths: ["auto", "*"], body: infoRows },
        layout: "noBorders",
    };

    const docDefinition = {
        pageSize: "LETTER",
        pageOrientation: "landscape",
        pageMargins: [30, 40, 30, 40] as [number, number, number, number],
        defaultStyle: { font: "Roboto" },
        content: [
            // ── Encabezado ──
            {
                columns: [
                    {
                        stack: [
                            {
                                canvas: [
                                    {
                                        type: "rect",
                                        x: 0, y: 0,
                                        w: 110, h: 60,
                                        r: 4,
                                        lineColor: "#cccccc",
                                        lineWidth: 1,
                                        dash: { length: 4 },
                                    },
                                ],
                            },
                            {
                                text: "LOGO",
                                fontSize: 10,
                                color: "#bbbbbb",
                                absolutePosition: { x: 30 + 38, y: 40 + 22 },
                            },
                        ],
                        width: 120,
                    },
                    {
                        stack: [
                            { text: reportTitle, fontSize: 22, bold: true, color: "#1a1a2e" },
                            { text: "Servicios registrados — filtrado por fecha", fontSize: 11, italics: true, color: "#777777", margin: [0, 4, 0, 0] },
                        ],
                        alignment: "center" as const,
                        margin: [0, 8, 0, 0] as [number, number, number, number],
                    },
                    {
                        ...infoTable,
                        alignment: "right" as const,
                        width: 230,
                    },
                ],
                margin: [0, 0, 0, 16] as [number, number, number, number],
            },
            // ── Tabla de servicios ──
            {
                table: {
                    headerRows: 1,
                    widths: [65, 70, 55, "*", "*", "*", 75],
                    body: tableBody,
                },
                layout: {
                    hLineWidth: () => 0.5,
                    vLineWidth: () => 0.5,
                    hLineColor: () => "#cccccc",
                    vLineColor: () => "#cccccc",
                    fillColor: (_colIdx: number, _node: unknown, rowIdx: number) =>
                        rowIdx > 0 && rowIdx % 2 === 0 ? "#f5f5f5" : null,
                },
            },
        ],
    };

    const doc = pdfmake.createPdf(docDefinition);
    return doc.getBuffer();
}
