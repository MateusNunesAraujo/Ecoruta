// Reconoce una lengua por cualquiera de sus nombres ("tikuna", "Magüta",
// "huitoto", "Mɨnɨka"…). Lo usa el agente: el turista (y el LLM) escriben la
// lengua como la conocen, y el backend la convierte en su código (L-TIK…).
// Así el LLM no necesita conocer las autodenominaciones del Excel.

// Nombres conocidos que no están en el Excel.
// Magüta: autodenominación del pueblo Tikuna muy usada en la región.
const ALIAS_EXTRA: Record<string, string> = {
  maguta: 'L-TIK',
  ticuna: 'L-TIK',
  witoto: 'L-MUR',
  uitoto: 'L-MUR',
  yahua: 'L-YAG',
};

// "Mɨnɨka / Nɨpode" -> "minika nipode" (sin tildes, ni mayúsculas, ni signos).
export function normalizarNombre(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{M}/gu, '') // tildes y diéresis
    .replace(/ɨ/g, 'i')
    .replace(/ʉ/g, 'u')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export interface LenguaConNombres {
  id: string;
  nombreComun: string;
  autodenominacion: string | null;
}

// Índice nombre normalizado -> código de lengua.
export function crearIndiceLenguas(
  lenguas: LenguaConNombres[],
): Map<string, string> {
  const indice = new Map<string, string>();
  for (const lengua of lenguas) {
    const nombres = [
      lengua.nombreComun,
      ...lengua.nombreComun.split('/'),
      ...(lengua.autodenominacion?.split('/') ?? []),
      lengua.id, // "L-TIK" -> "l tik"
    ];
    for (const nombre of nombres) {
      const clave = normalizarNombre(nombre);
      if (clave) indice.set(clave, lengua.id);
    }
  }
  for (const [alias, id] of Object.entries(ALIAS_EXTRA)) {
    if (lenguas.some((l) => l.id === id)) indice.set(alias, id);
  }
  return indice;
}

// Busca la lengua en un texto: primero coincidencia exacta ("magüta") y si no,
// un nombre que aparezca como palabra dentro del texto ("lengua magüta").
export function buscarLengua(
  indice: Map<string, string>,
  texto: string,
): string | null {
  const normal = normalizarNombre(texto);
  if (!normal) return null;
  const exacta = indice.get(normal);
  if (exacta) return exacta;
  // Los nombres más largos primero ("murui muinane" antes que "murui").
  const claves = [...indice.keys()].sort((a, b) => b.length - a.length);
  const encontrada = claves.find((clave) =>
    ` ${normal} `.includes(` ${clave} `),
  );
  return encontrada ? indice.get(encontrada)! : null;
}
