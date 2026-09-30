import { existsSync, readdirSync, renameSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import type { Problemas } from './problemas.js';

// "Adiós-Miraña (mp3cut.net).m4a" -> "adios_mirana.m4a"
// Sin espacios, paréntesis, tildes ni mayúsculas: el servidor Linux distingue
// mayúsculas y los espacios dan problemas en las URL.
export function nombreAudioSeguro(nombre: string): string {
  const extension = extname(nombre).toLowerCase();
  const base = nombre
    .slice(0, nombre.length - extname(nombre).length)
    // Con o sin paréntesis: "(mp3cut.net)", "mp3cut.net)"…
    .replace(/\(?\s*mp3cut\.net\s*\)?/gi, '')
    .normalize('NFD') // separa la letra de su tilde: "ó" -> "o" + "´"
    .replace(/\p{M}/gu, '') // quita las tildes (la ñ queda como n)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return base + extension;
}

export function esEnlace(texto: string): boolean {
  return /^https?:\/\//i.test(texto);
}

// Renombra los archivos de la carpeta a su nombre seguro y devuelve los
// nombres finales. Se puede ejecutar varias veces: si ya están renombrados,
// no hace nada.
export function prepararAudios(carpeta: string, problemas: Problemas) {
  const renombrados: [string, string][] = [];
  if (!existsSync(carpeta)) {
    problemas.error('Audios', null, null, `No existe la carpeta ${carpeta}`);
    return { disponibles: new Set<string>(), renombrados };
  }

  const archivos = readdirSync(carpeta).filter(
    (archivo) =>
      !archivo.startsWith('.') && statSync(join(carpeta, archivo)).isFile(),
  );

  // Primero los que ya tienen nombre seguro, para detectar choques de nombres.
  const disponibles = new Set(
    archivos.filter((archivo) => nombreAudioSeguro(archivo) === archivo),
  );
  for (const archivo of archivos) {
    const seguro = nombreAudioSeguro(archivo);
    if (seguro === archivo) continue;
    if (disponibles.has(seguro)) {
      problemas.error(
        'Audios',
        null,
        null,
        `No se renombró "${archivo}": ya existe otro archivo "${seguro}"`,
      );
      continue;
    }
    renameSync(join(carpeta, archivo), join(carpeta, seguro));
    disponibles.add(seguro);
    renombrados.push([archivo, seguro]);
  }
  return { disponibles, renombrados };
}
