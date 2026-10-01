// Copia local (IndexedDB) de las respuestas de la API que sirven sin señal:
// catálogo, lenguas, fichas culturales y preguntas frecuentes.
// Cada respuesta se guarda con su ruta como clave, por ejemplo
// '/experiencias' -> { datos: [...], guardadoEn: 1727740000000 }.
//
// Si IndexedDB no existe o falla (navegación privada, almacenamiento lleno),
// la app sigue funcionando: solo no habrá copia sin conexión.

const BASE = 'ecoruta';
const TABLA = 'respuestas';

let conexion = null;

function abrir() {
  conexion ??= new Promise((resolver, rechazar) => {
    const peticion = indexedDB.open(BASE, 1);
    peticion.onupgradeneeded = () => peticion.result.createObjectStore(TABLA);
    peticion.onsuccess = () => resolver(peticion.result);
    peticion.onerror = () => rechazar(peticion.error);
  });
  return conexion;
}

async function operar(modo, accion) {
  const base = await abrir();
  return new Promise((resolver, rechazar) => {
    const peticion = accion(base.transaction(TABLA, modo).objectStore(TABLA));
    peticion.onsuccess = () => resolver(peticion.result);
    peticion.onerror = () => rechazar(peticion.error);
  });
}

export async function guardarRespuesta(ruta, datos) {
  try {
    await operar('readwrite', (tabla) => tabla.put({ datos, guardadoEn: Date.now() }, ruta));
  } catch {
    // Sin copia local: no impide usar la app con señal.
  }
}

// Devuelve { datos, guardadoEn } o null si no hay copia.
export async function leerRespuesta(ruta) {
  try {
    return (await operar('readonly', (tabla) => tabla.get(ruta))) ?? null;
  } catch {
    return null;
  }
}
