import { pedir } from './api.js';
import { ES_APP } from './config.js';
import { rutaFoto } from './tarjetas.js';

// Al abrir la app con señal, descarga en segundo plano el catálogo, las
// lenguas con sus fichas y las preguntas frecuentes (pedir() las guarda en
// IndexedDB). Así funcionan sin señal aunque el turista no haya abierto esas
// pantallas. Son unos pocos JSON livianos.
//
// En la web también guarda los audios y las fotos en la caché del Service
// Worker. En la app Android no hace falta: esos archivos van dentro del APK.

// Mismo nombre que CACHE_MEDIOS en sw.js.
const CACHE_MEDIOS = 'ecoruta-medios';

export async function precargar() {
  if (!navigator.onLine) return;
  try {
    const [experiencias, lenguas] = await Promise.all([
      pedir('/experiencias'),
      pedir('/cultural/lenguas'),
      pedir('/faq'),
    ]);
    const detalles = await Promise.all(
      experiencias.map((e) => pedir(`/experiencias/${encodeURIComponent(e.id)}`)),
    );
    const fichas = await Promise.all(
      lenguas
        .filter((l) => l.fichasVerificadas > 0)
        .map((l) => pedir(`/cultural?lengua=${l.id}`)),
    );
    await guardarMedios([
      // Misma ruta que botonAudio() en tarjetas.js.
      ...fichas.flat().map((f) => f.audio && !/^https?:\/\//.test(f.audio) && `audio/${encodeURIComponent(f.audio)}`),
      ...detalles.map((e) => rutaFoto(e.emprendimiento?.fotos?.[0])),
    ]);
  } catch {
    // Se perdió la señal a mitad de camino: queda lo que alcanzó a guardarse.
  }
}

async function guardarMedios(rutas) {
  if (ES_APP || !('caches' in window)) return;
  const cache = await caches.open(CACHE_MEDIOS);
  for (const ruta of new Set(rutas)) {
    // Solo archivos propios (las fotos con enlace externo no se guardan).
    if (!ruta || /^https?:\/\//.test(ruta)) continue;
    if (!(await cache.match(ruta))) await cache.add(ruta).catch(() => {});
  }
}
