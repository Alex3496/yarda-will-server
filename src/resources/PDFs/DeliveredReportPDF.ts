import path from "path";
import { logoColumn } from "./logo";

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
interface PopulatedDeliverUser { username: string; firstName?: string; lastName?: string }

export interface DeliveredOperationRow {
    key: string;
    batch?: string;
    year?: number;
    brand_id?: PopulatedName | null;
    model_id?: PopulatedName | null;
    color?: string;
    auction_id?: PopulatedName | null;
    contact_id?: PopulatedName | null;
    client_id?: PopulatedFullname | null;
    title_type?: string;
    delivered_at?: Date | null;
    deliver_id?: PopulatedDeliverUser | null;
}

export interface DeliveredReportPDFInput {
    // Nombre del usuario filtrado, o null cuando es "Todos".
    deliverName: string | null;
    from: Date;
    to: Date;
    operations: DeliveredOperationRow[];
}

const TITLE_LABEL: Record<string, string> = { mail: "Mail", driver: "Driver" };

const DATE_FMT = (d: Date | string) =>
    new Date(d).toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });

const userName = (u?: PopulatedDeliverUser | null) =>
    u ? ([u.firstName, u.lastName].filter(Boolean).join(" ") || u.username) : "";

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

export async function generateDeliveredReportPDF(data: DeliveredReportPDFInput): Promise<Buffer> {
    // Mostramos la columna "Entregó" solo cuando el reporte abarca a todos los usuarios.
    const showDeliver = data.deliverName === null;

    // columns: Fecha entrega | [Entregó] | Contacto | Subasta | Lote | Vehículo | Título | Cliente
    const headerRow = [headerCell("Fecha entrega")];
    if (showDeliver) headerRow.push(headerCell("Entregó"));
    headerRow.push(
        headerCell("Contacto"),
        headerCell("Subasta"),
        headerCell("Lote"),
        headerCell("Vehículo"),
        headerCell("Título"),
        headerCell("Cliente"),
    );

    const dataRows = data.operations.map((op) => {
        const vehiculo = [op.year, op.brand_id?.name, op.model_id?.name]
            .filter(Boolean)
            .join(" ");
        const row = [cell(op.delivered_at ? DATE_FMT(op.delivered_at) : "", true)];
        if (showDeliver) row.push(cell(userName(op.deliver_id)));
        row.push(
            cell(op.contact_id?.name ?? ""),
            cell(op.auction_id?.name ?? ""),
            cell(op.batch ?? ""),
            cell(vehiculo),
            cell(op.title_type ? (TITLE_LABEL[op.title_type] ?? op.title_type) : "", true),
            cell(op.client_id?.fullname ?? ""),
        );
        return row;
    });

    const tableBody: any[] = [headerRow, ...dataRows];

    //               Fecha  [Entregó]  Contacto  Subasta  Lote  Vehículo  Título  Cliente
    const tableWidths = showDeliver
        ? [65, "*", "*", "*", 50, "*", 50, "*"]
        : [65, "*", "*", 50, "*", 50, "*"];

    const infoTable = {
        table: {
            widths: ["auto", "*"],
            body: [
                [
                    { text: "Entregado por:", bold: true, fontSize: 11, border: [false, false, false, false] },
                    { text: data.deliverName ?? "Todos los usuarios", fontSize: 11, border: [false, false, false, false] },
                ],
                [
                    { text: "Periodo:", bold: true, fontSize: 11, border: [false, false, false, false] },
                    { text: `${DATE_FMT(data.from)} – ${DATE_FMT(data.to)}`, fontSize: 11, border: [false, false, false, false] },
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
                    // logo del negocio (o placeholder si falta el archivo)
                    logoColumn(),
                    {
                        stack: [
                            { text: "REPORTE DE UNIDADES ENTREGADAS", fontSize: 22, bold: true, color: "#1a1a2e" },
                            { text: "Filtrado por fecha de entrega", fontSize: 11, italics: true, color: "#777777", margin: [0, 4, 0, 0] },
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
            // ── Tabla de operaciones ──
            {
                table: {
                    headerRows: 1,
                    widths: tableWidths,
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
