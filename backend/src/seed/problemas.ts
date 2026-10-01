// Junta los problemas encontrados al leer el Excel para mostrarlos al final,
// sin detener el seed.
// - ERROR: el dato no se pudo usar (se omitió la fila o ese campo).
// - AVISO: la fila se cargó, pero está incompleta o conviene revisarla.

type Nivel = 'ERROR' | 'AVISO';

interface Problema {
  nivel: Nivel;
  hoja: string;
  fila: number | null;
  id: string | null;
  mensaje: string;
}

export class Problemas {
  private readonly lista: Problema[] = [];

  error(hoja: string, fila: number | null, id: string | null, mensaje: string) {
    this.lista.push({ nivel: 'ERROR', hoja, fila, id, mensaje });
  }

  aviso(hoja: string, fila: number | null, id: string | null, mensaje: string) {
    this.lista.push({ nivel: 'AVISO', hoja, fila, id, mensaje });
  }

  get errores() {
    return this.lista.filter((p) => p.nivel === 'ERROR').length;
  }

  get avisos() {
    return this.lista.filter((p) => p.nivel === 'AVISO').length;
  }

  imprimir() {
    if (this.lista.length === 0) {
      console.log('\nSin errores ni avisos.');
      return;
    }
    console.log(
      `\nProblemas encontrados: ${this.errores} errores, ${this.avisos} avisos`,
    );
    const porHoja = new Map<string, Problema[]>();
    for (const p of this.lista) {
      porHoja.set(p.hoja, [...(porHoja.get(p.hoja) ?? []), p]);
    }
    for (const [hoja, problemas] of porHoja) {
      console.log(`\n  [${hoja}]`);
      problemas
        .sort((a, b) => (a.fila ?? 0) - (b.fila ?? 0))
        .forEach((p) => {
          const donde = [
            p.fila !== null ? `fila ${p.fila}` : null,
            p.id,
          ].filter(Boolean);
          const prefijo = donde.length ? `${donde.join(', ')}: ` : '';
          console.log(`    ${p.nivel}  ${prefijo}${p.mensaje}`);
        });
    }
  }
}
