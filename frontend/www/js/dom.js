// Crea elementos del DOM de forma segura.
//
//   el('a', { class: 'boton', href: '#/chat' }, 'Hablar con el asistente')
//
// Los textos siempre se insertan como texto (nunca como HTML). Así, ni la
// respuesta del LLM ni los datos del Excel pueden inyectar código en la página.
export function el(etiqueta, atributos = {}, ...hijos) {
  const elemento = document.createElement(etiqueta);
  for (const [nombre, valor] of Object.entries(atributos)) {
    if (valor === null || valor === undefined || valor === false) continue;
    if (nombre.startsWith('on') && typeof valor === 'function') {
      // onClick -> evento "click"
      elemento.addEventListener(nombre.slice(2).toLowerCase(), valor);
    } else if (valor === true) {
      elemento.setAttribute(nombre, '');
    } else {
      elemento.setAttribute(nombre, String(valor));
    }
  }
  agregar(elemento, hijos);
  return elemento;
}

function agregar(padre, hijos) {
  for (const hijo of hijos) {
    if (hijo === null || hijo === undefined || hijo === false) continue;
    if (Array.isArray(hijo)) agregar(padre, hijo);
    else if (hijo instanceof Node) padre.append(hijo);
    else padre.append(document.createTextNode(String(hijo)));
  }
}

// Reemplaza todo el contenido de un contenedor.
export function vaciar(contenedor, ...hijos) {
  contenedor.replaceChildren();
  agregar(contenedor, hijos);
}
