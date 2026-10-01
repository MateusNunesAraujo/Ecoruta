// Regla 3 de CLAUDE.md: no enviar al LLM datos personales que no necesita.
// Si el turista escribe su email o teléfono en el chat, se reemplazan antes de
// enviar el mensaje al proveedor (el nivel gratuito de Gemini usa los datos
// para entrenar). Los datos para reservar se piden en un formulario aparte.

const EMAIL = /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}/gu;
// 7 o más dígitos, con espacios, guiones, puntos o paréntesis en medio,
// opcionalmente con "+" o "(" al inicio. No toca fechas como 2026-10-05.
const TELEFONO = /[+(]?\d[\d\s().-]{5,}\d/g;
const FECHA = /\d{4}-\d{2}-\d{2}/;

export function ocultarDatosPersonales(texto: string): string {
  return texto.replace(EMAIL, '[email]').replace(TELEFONO, (coincidencia) => {
    // Si incluye una fecha (ej. "2026-10-05 4"), no es un teléfono.
    if (FECHA.test(coincidencia)) return coincidencia;
    const digitos = coincidencia.replace(/\D/g, '');
    return digitos.length >= 7 ? '[teléfono]' : coincidencia;
  });
}
