import type { Problemas } from './problemas.js';

// Lee los valores de una fila del Excel convirtiéndolos al tipo esperado.
// Si un valor no sirve, lo reporta (con hoja y fila) y devuelve null.
export class LectorFila {
  // Código de la fila (ej. EXP-03): se incluye en los mensajes de problemas.
  id: string | null = null;

  constructor(
    readonly hoja: string,
    readonly numeroFila: number,
    private readonly valores: Record<string, unknown>,
    private readonly problemas: Problemas,
  ) {}

  error(mensaje: string) {
    this.problemas.error(this.hoja, this.numeroFila, this.id, mensaje);
  }

  aviso(mensaje: string) {
    this.problemas.aviso(this.hoja, this.numeroFila, this.id, mensaje);
  }

  texto(columna: string): string | null {
    const valor = this.valores[columna];
    if (valor === null || valor === undefined) return null;
    if (valor instanceof Date) return valor.toISOString().slice(0, 10);
    const texto = String(valor).trim();
    return texto === '' ? null : texto;
  }

  // Igual que texto(), pero reporta ERROR si está vacío.
  obligatorio(columna: string): string | null {
    const texto = this.texto(columna);
    if (texto === null) this.error(`Falta el valor obligatorio "${columna}"`);
    return texto;
  }

  numero(columna: string): number | null {
    const valor = this.valores[columna];
    if (valor === null || valor === undefined) return null;
    const numero =
      typeof valor === 'number'
        ? valor
        : Number(String(valor).trim().replace(',', '.'));
    if (!Number.isFinite(numero)) {
      this.error(`"${columna}" no es un número: "${String(valor)}"`);
      return null;
    }
    return numero;
  }

  entero(columna: string): number | null {
    const numero = this.numero(columna);
    if (numero === null) return null;
    if (!Number.isInteger(numero) || numero < 0) {
      this.error(`"${columna}" debe ser un número entero positivo: ${numero}`);
      return null;
    }
    return numero;
  }

  // Devuelve "AAAA-MM-DD". Acepta fechas de Excel, "DD/MM/AAAA" y "AAAA-MM-DD".
  fecha(columna: string): string | null {
    const valor = this.valores[columna];
    if (valor === null || valor === undefined) return null;
    if (valor instanceof Date) return valor.toISOString().slice(0, 10);

    const texto = String(valor).trim();
    let partes: [string, string, string] | null = null;
    const dma = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(texto);
    const amd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
    if (dma) partes = [dma[3], dma[2], dma[1]];
    if (amd) partes = [amd[1], amd[2], amd[3]];

    if (partes) {
      const [a, m, d] = partes.map(Number);
      const fecha = new Date(Date.UTC(a, m - 1, d));
      // Descarta fechas imposibles como 31/02/2026.
      if (fecha.getUTCMonth() === m - 1 && fecha.getUTCDate() === d) {
        return fecha.toISOString().slice(0, 10);
      }
    }
    this.error(`"${columna}" no es una fecha válida (DD/MM/AAAA): "${texto}"`);
    return null;
  }

  // Devuelve "HH:MM". Excel guarda las horas como fecha del 30/12/1899.
  hora(columna: string): string | null {
    const valor = this.valores[columna];
    if (valor === null || valor === undefined) return null;

    let minutos: number | null = null;
    if (valor instanceof Date) {
      // Se redondea al minuto: Excel a veces guarda 08:59:59.999.
      minutos =
        Math.round((valor.getTime() - Date.UTC(1899, 11, 30)) / 60000) %
        (24 * 60);
    } else if (typeof valor === 'number' && valor >= 0 && valor < 1) {
      minutos = Math.round(valor * 24 * 60); // fracción del día
    } else {
      const hm = /^(\d{1,2}):(\d{2})$/.exec(String(valor).trim());
      if (hm && Number(hm[1]) < 24 && Number(hm[2]) < 60) {
        minutos = Number(hm[1]) * 60 + Number(hm[2]);
      }
    }
    if (minutos === null) {
      this.error(
        `"${columna}" no es una hora válida (HH:MM): "${String(valor)}"`,
      );
      return null;
    }
    const hh = String(Math.floor(minutos / 60)).padStart(2, '0');
    const mm = String(minutos % 60).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  // "a, b,c" -> ["a", "b", "c"]
  lista(columna: string): string[] {
    const texto = this.texto(columna);
    if (texto === null) return [];
    return texto
      .split(',')
      .map((parte) => parte.trim())
      .filter((parte) => parte !== '');
  }

  // "Si" / "Sí" / "No" -> true / false. Vacío -> null.
  siNo(columna: string): boolean | null {
    const texto = this.texto(columna);
    if (texto === null) return null;
    const normal = texto.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
    if (normal === 'si') return true;
    if (normal === 'no') return false;
    this.error(`"${columna}" debe ser Si o No: "${texto}"`);
    return null;
  }
}
