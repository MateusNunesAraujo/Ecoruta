// Búsqueda sencilla por palabras clave (sin LLM ni librerías).
// Compara la RAÍZ de cada palabra (primeras 5 letras): así "vacunarse"
// encuentra "vacuna" y "llegar" encuentra "llego".

// Palabras muy comunes (es/en/pt) que no ayudan a buscar.
// prettier-ignore
const VACIAS = new Set([
  'para', 'como', 'donde', 'cuando', 'cual', 'cuales', 'tengo', 'puedo',
  'hay', 'que', 'una', 'unos', 'unas', 'esta', 'este', 'estos', 'hacer',
  'necesito', 'debo', 'quiero', 'sobre', 'with', 'what', 'where', 'when',
  'which', 'have', 'need', 'does', 'from', 'there', 'this', 'that', 'about',
  'voce', 'preciso', 'posso', 'onde', 'quando', 'qual', 'isso', 'esse',
]);

export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

// "¿Hay que vacunarse para ir?" -> ["vacun"]
export function raices(texto: string): string[] {
  const palabras = normalizar(texto)
    .split(/[^a-z]+/)
    .filter((p) => p.length >= 4 && !VACIAS.has(p));
  return [...new Set(palabras.map((p) => p.slice(0, 5)))];
}

// Cuántas raíces de la consulta aparecen en el texto.
export function puntuar(consulta: string, texto: string): number {
  const destino = normalizar(texto);
  return raices(consulta).filter((raiz) => destino.includes(raiz)).length;
}
