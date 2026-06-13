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
interface PopulatedDriver { key: string; name: string }

interface AssignmentOperationRow {
    key: string;
    batch?: string;
    year: number;
    brand_id?: PopulatedName | null;
    model_id?: PopulatedName | null;
    color?: string;
    vin?: string;
    expiration_date?: Date | null;
    region_id?: PopulatedName | null;
    auction_id?: PopulatedName | null;
    freight_cost?: number;
}

export interface AssignmentPDFInput {
    key: string;
    driver_id: PopulatedDriver;
    assigned_at: Date;
    levantamiento_date?: Date | null;
    operations: AssignmentOperationRow[];
}

const DATE_FMT = (d: Date | string) =>
    new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });

const headerCell = (text: string) => ({
    text,
    fillColor: "#1a1a2e",
    color: "#ffffff",
    bold: true,
    fontSize: 9,
    margin: [5, 5, 5, 5],
});

const cell = (text: string, center = false) => ({
    text: text || "—",
    fontSize: 9,
    margin: [5, 4, 5, 4],
    alignment: center ? "center" : "left",
});

export async function generateAssignmentPDF(data: AssignmentPDFInput): Promise<Buffer> {
    // columns: Lote | Operación | Vehículo | Color | VIN | Expiración | Región / Subasta
    const tableBody = [
        [
            headerCell("Lote"),
            headerCell("Operación"),
            headerCell("Vehículo"),
            headerCell("Color"),
            headerCell("VIN"),
            headerCell("Expiración"),
            headerCell("Región / Subasta"),
            headerCell("Flete"),
        ],
        ...data.operations.map((op) => {
            const vehiculo = [op.year, op.brand_id?.name, op.model_id?.name]
                .filter(Boolean)
                .join(" ");
            const regionSubasta = [op.region_id?.name, op.auction_id?.name]
                .filter(Boolean)
                .join(" / ");
            const freight = Number(op.freight_cost ?? 0).toLocaleString("es-MX", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });
            return [
                cell(op.batch ?? ""),
                cell(op.key),
                cell(vehiculo),
                cell(op.color ?? ""),
                cell(op.vin ?? ""),
                cell(op.expiration_date ? DATE_FMT(op.expiration_date) : "", true),
                cell(regionSubasta),
                cell(`$${freight}`, true),
            ];
        }),
    ];

    const infoTable = {
        table: {
            widths: ["auto", "*"],
            body: [
                [
                    { text: "Chofer:", bold: true, fontSize: 11, border: [false, false, false, false] },
                    { text: `${data.driver_id.name} (${data.driver_id.key})`, fontSize: 11, border: [false, false, false, false] },
                ],
                [
                    { text: "Destino:", bold: true, fontSize: 11, border: [false, false, false, false] },
                    { text: "Tijuana", fontSize: 11, border: [false, false, false, false] },
                ],
                [
                    { text: "Asignación:", bold: true, fontSize: 11, border: [false, false, false, false] },
                    { text: DATE_FMT(data.assigned_at), fontSize: 11, border: [false, false, false, false] },
                ],
                [
                    { text: "Levantamiento:", bold: true, fontSize: 11, border: [false, false, false, false] },
                    { text: data.levantamiento_date ? DATE_FMT(data.levantamiento_date) : "—", fontSize: 11, border: [false, false, false, false] },
                ],
                [
                    { text: "Unidades:", bold: true, fontSize: 11, border: [false, false, false, false] },
                    { text: String(data.operations.length), fontSize: 11, border: [false, false, false, false] },
                ],
            ],
        },
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
                    // espacio reservado para logo
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
                    // título + no. de viaje
                    {
                        stack: [
                            { text: "HOJA DE ASIGNACIÓN", fontSize: 22, bold: true, color: "#1a1a2e" },
                            { text: `No. de Viaje: ${data.key}`, fontSize: 14, color: "#444444", margin: [0, 4, 0, 0] },
                        ],
                        alignment: "center" as const,
                        margin: [0, 8, 0, 0] as [number, number, number, number],
                    },
                    // datos del viaje
                    {
                        ...infoTable,
                        alignment: "right" as const,
                        width: 230,
                    },
                ],
                margin: [0, 0, 0, 16] as [number, number, number, number],
            },
            // ── Tabla de operaciones ──
            {
                table: {
                    headerRows: 1,
                    widths: [55, 52, 108, 46, 85, 58, "*", 72],
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
