// Tema de colores elegido por el turista en Ajustes.
// 'auto' sigue al dispositivo; 'claro' y 'oscuro' lo fijan. El CSS lee el
// atributo data-tema de <html> (sin atributo = automático).

const CLAVE_TEMA = 'ecoruta.tema';
export const TEMAS = ['auto', 'claro', 'oscuro'];

// Color de la barra del navegador en Android (igual a --cabecera-fondo).
const COLOR_BARRA = { claro: '#1f5f3f', oscuro: '#173d2a' };

export function tema() {
  try {
    const guardado = localStorage.getItem(CLAVE_TEMA);
    return TEMAS.includes(guardado) ? guardado : 'auto';
  } catch {
    return 'auto'; // Almacenamiento bloqueado.
  }
}

export function aplicarTema(valor = tema()) {
  const raiz = document.documentElement;
  if (valor === 'auto') raiz.removeAttribute('data-tema');
  else raiz.dataset.tema = valor;
  // index.html trae un theme-color para cada modo del dispositivo; si el
  // turista fijó uno, ambos toman ese color.
  for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
    const propio = meta.media.includes('dark') ? COLOR_BARRA.oscuro : COLOR_BARRA.claro;
    meta.content = valor === 'auto' ? propio : COLOR_BARRA[valor];
  }
}

export function cambiarTema(valor) {
  if (!TEMAS.includes(valor)) return;
  try {
    localStorage.setItem(CLAVE_TEMA, valor);
  } catch {
    // Almacenamiento bloqueado: el tema dura hasta cerrar la página.
  }
  aplicarTema(valor);
}
