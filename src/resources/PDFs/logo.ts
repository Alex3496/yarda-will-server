import fs from "fs";
import path from "path";

// Logo del negocio para los reportes PDF, leído desde backend/assets/logo.png y
// entregado como data URI (base64) que pdfmake incrusta con `image`.
//
// La ruta usa el mismo patrón que FONTS_DIR en los PDFs: "../../../" desde
// resources/PDFs llega a la raíz del backend tanto en dev (src) como en prod
// (dist), así que el asset se resuelve igual en ambos casos.
const LOGO_PATH = path.join(__dirname, "../../../assets/logo.png");

let cached: string | null | undefined;

/**
 * Devuelve el logo como data URI para usar en `{ image: getLogoDataUri() }`.
 * Devuelve `null` si el archivo no existe o no se puede leer, para que el PDF
 * pueda caer de vuelta al placeholder sin romperse.
 */
export function getLogoDataUri(): string | null {
    if (cached !== undefined) return cached;
    try {
        const base64 = fs.readFileSync(LOGO_PATH).toString("base64");
        cached = `data:image/png;base64,${base64}`;
    } catch {
        cached = null;
    }
    return cached;
}

/**
 * Columna de encabezado con el logo, lista para el `columns:` de cualquier
 * reporte. Si el logo no está disponible, cae al recuadro placeholder para no
 * romper el layout. Ocupa el mismo ancho (120) que el hueco reservado.
 */
export function logoColumn(): Record<string, unknown> {
    const uri = getLogoDataUri();
    if (uri) {
        return { image: uri, fit: [110, 60], width: 120 };
    }
    return {
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
    };
}
