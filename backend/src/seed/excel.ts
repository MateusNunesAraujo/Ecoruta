import ExcelJS from 'exceljs';
import { LectorFila } from './lector-fila.js';
import type { Problemas } from './problemas.js';

export type Libro = ExcelJS.Workbook;

export async function abrirLibro(ruta: string): Promise<Libro> {
  const libro = new ExcelJS.Workbook();
  await libro.xlsx.readFile(ruta);
  return libro;
}

// Convierte el valor de una celda de exceljs a algo simple:
// texto, número, booleano, fecha o null.
export function valorCelda(valor: ExcelJS.CellValue): unknown {
  if (valor === null || valor === undefined) return null;
  if (valor instanceof Date) return valor;
  if (typeof valor === 'string') return valor.trim() === '' ? null : valor;
  if (typeof valor !== 'object') return valor;
  if ('richText' in valor) {
    return valorCelda(valor.richText.map((parte) => parte.text).join(''));
  }
  if ('formula' in valor || 'sharedFormula' in valor) {
    return valorCelda(valor.result as ExcelJS.CellValue);
  }
  if ('hyperlink' in valor) return valorCelda(valor.text);
  return null; // celdas con error (#N/A, etc.)
}

// Lee una hoja con este formato:
//   fila 1 = nombres de columna, fila 2 = explicación, datos desde la fila 3.
// Las columnas se buscan por nombre, así que su orden no importa.
// Se saltan las filas cuya columna clave está vacía o empieza por "EJ-".
export function leerHoja(
  libro: Libro,
  nombreHoja: string,
  columnas: readonly string[],
  columnaClave: string,
  problemas: Problemas,
): LectorFila[] {
  const hoja = libro.getWorksheet(nombreHoja);
  if (!hoja) {
    problemas.error(nombreHoja, null, null, 'No existe la hoja en el Excel');
    return [];
  }

  const posicion = new Map<string, number>();
  hoja.getRow(1).eachCell((celda, columna) => {
    const nombre = valorCelda(celda.value);
    if (typeof nombre === 'string') posicion.set(nombre.trim(), columna);
  });
  const faltantes = columnas.filter((c) => !posicion.has(c));
  if (faltantes.length > 0) {
    problemas.error(
      nombreHoja,
      1,
      null,
      `Faltan columnas: ${faltantes.join(', ')}. No se cargó la hoja.`,
    );
    return [];
  }

  const filas: LectorFila[] = [];
  hoja.eachRow((fila, numero) => {
    if (numero <= 2) return;
    const valores: Record<string, unknown> = {};
    for (const columna of columnas) {
      valores[columna] = valorCelda(fila.getCell(posicion.get(columna)!).value);
    }
    const clave = valores[columnaClave];
    if (
      clave === null ||
      String(clave).trim().toUpperCase().startsWith('EJ-')
    ) {
      return;
    }
    filas.push(new LectorFila(nombreHoja, numero, valores, problemas));
  });
  return filas;
}
