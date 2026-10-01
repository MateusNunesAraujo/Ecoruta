// Service Worker de la versión web (Bloque 7). En la app Android no se usa:
// ahí los archivos ya van dentro del APK.
//
// - Archivos de la app (HTML, CSS, JS, fuente, imágenes): se guardan al
//   instalar. Se piden primero a la red (así los cambios se ven enseguida) y,
//   si no hay señal o tarda más de 4 s, se usa la copia.
// - Audios y fotos: primero la copia; si no está, se descarga y se guarda.
// - La API (/api/…) no pasa por aquí: los datos sin señal los guarda
//   js/almacen.js en IndexedDB.
//
// Al agregar un archivo nuevo a la app, súmalo a ARCHIVOS_APP y sube VERSION.

const VERSION = 'v2';
const CACHE_APP = `ecoruta-app-${VERSION}`;
const CACHE_MEDIOS = 'ecoruta-medios'; // mismo nombre en js/precarga.js
const ESPERA_RED_MS = 4000;

const ARCHIVOS_APP = [
  './',
  'index.html',
  'css/estilos.css',
  'fuentes/NotoSans-ecoruta.woff2',
  'img/mono-asistente.webp',
  'img/avatar-cara.webp',
  'vendor/sweetalert2/sweetalert2.esm.all.min.js',
  'js/alertas.js',
  'js/almacen.js',
  'js/api.js',
  'js/app.js',
  'js/cola.js',
  'js/conexion.js',
  'js/config.js',
  'js/dictado.js',
  'js/dom.js',
  'js/historial.js',
  'js/i18n.js',
  'js/precarga.js',
  'js/tarjetas.js',
  'js/tema.js',
  'js/vistas/ajustes.js',
  'js/vistas/chat.js',
  'js/vistas/experiencia.js',
  'js/vistas/experiencias.js',
  'js/vistas/inicio.js',
  'js/vistas/lenguas.js',
  'js/vistas/pago-simulado.js',
  'js/vistas/reserva.js',
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches
      .open(CACHE_APP)
      .then((cache) => cache.addAll(ARCHIVOS_APP))
      .then(() => self.skipWaiting()),
  );
});

// Borra las copias de versiones anteriores.
self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nombres) =>
        Promise.all(
          nombres
            .filter((n) => n.startsWith('ecoruta-app-') && n !== CACHE_APP)
            .map((n) => caches.delete(n)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request;
  const url = new URL(peticion.url);
  if (peticion.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  if (url.pathname.startsWith('/audio/') || url.pathname.startsWith('/fotos/')) {
    evento.respondWith(primeroLaCopia(peticion));
  } else {
    evento.respondWith(primeroLaRed(peticion));
  }
});

async function primeroLaRed(peticion) {
  const cache = await caches.open(CACHE_APP);
  const red = fetch(peticion).then((respuesta) => {
    if (respuesta.ok) cache.put(peticion, respuesta.clone());
    return respuesta;
  });
  red.catch(() => {}); // si gana la copia, un fallo posterior no importa
  try {
    return await conLimite(red, ESPERA_RED_MS);
  } catch {
    const copia =
      (await cache.match(peticion, { ignoreSearch: true })) ??
      // Cualquier página de la app abre index.html (las rutas van tras "#").
      (peticion.mode === 'navigate' ? await cache.match('index.html') : undefined);
    // Sin copia (primera visita con señal lenta), se sigue esperando la red.
    return copia ?? red;
  }
}

async function primeroLaCopia(peticion) {
  const cache = await caches.open(CACHE_MEDIOS);
  // Los audios se piden por partes (Range); la copia guarda el archivo entero.
  const copia = await cache.match(peticion.url);
  if (copia) return copia;
  const respuesta = await fetch(peticion.url);
  if (respuesta.ok) cache.put(peticion.url, respuesta.clone());
  return respuesta;
}

function conLimite(promesa, ms) {
  return new Promise((resolver, rechazar) => {
    const temporizador = setTimeout(() => rechazar(new Error('tiempo agotado')), ms);
    promesa.then(
      (r) => {
        clearTimeout(temporizador);
        resolver(r);
      },
      (e) => {
        clearTimeout(temporizador);
        rechazar(e);
      },
    );
  });
}
