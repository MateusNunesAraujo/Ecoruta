// Recuerda la pantalla anterior dentro de la app, para que "Volver" regrese
// a donde estaba el turista (por ejemplo, al chat) y no siempre a la lista.

let actual = null;
let anterior = null;

// app.js la llama en cada cambio de ruta. Si la ruta no cambió (por ejemplo,
// al cambiar de idioma se vuelve a dibujar la misma), no se toca.
export function registrarRuta(hash) {
  if (hash === actual) return;
  anterior = actual;
  actual = hash;
}

export function rutaAnterior() {
  return anterior;
}
