// Carga los datos reales del Excel en la base de datos.
// Uso (dentro de backend/): npm run seed
//
// - Lee docs/datos/Ecoruta_datos.xlsx e ignora las filas de ejemplo (EJ-).
// - Renombra los audios de frontend/www/audio/ a nombres seguros.
// - Se puede ejecutar varias veces: actualiza por código (EMP-01, FIC-12…)
//   y borra lo que ya no está en el Excel, sin duplicar nada.
// - Los problemas del Excel se muestran al final sin detener la carga.
import { NestFactory } from '@nestjs/core';
import { resolve } from 'node:path';
import {
  DataSource,
  In,
  Not,
  type EntityManager,
  type EntityTarget,
  type ObjectLiteral,
} from 'typeorm';
import { AppModule } from '../app.module.js';
import { FichaCultural } from '../cultural/ficha-cultural.entity.js';
import { Lengua } from '../cultural/lengua.entity.js';
import { Comunidad } from '../emprendimientos/comunidad.entity.js';
import { Emprendimiento } from '../emprendimientos/emprendimiento.entity.js';
import { Experiencia } from '../emprendimientos/experiencia.entity.js';
import { FechaBloqueada } from '../emprendimientos/fecha-bloqueada.entity.js';
import { PreguntaFrecuente } from '../faq/pregunta-frecuente.entity.js';
import { prepararAudios } from './audios.js';
import { abrirLibro } from './excel.js';
import { Problemas } from './problemas.js';
import { transformarLibro } from './transformar.js';

// npm ejecuta los scripts desde backend/, así que las rutas parten de ahí.
const RUTA_EXCEL = resolve(process.cwd(), '../docs/datos/Ecoruta_datos.xlsx');
const RUTA_AUDIOS = resolve(process.cwd(), '../frontend/www/audio');

// Borra las filas cuyo id ya no está en el Excel.
async function borrarAusentes<T extends ObjectLiteral>(
  manager: EntityManager,
  entidad: EntityTarget<T>,
  idsVigentes: string[],
): Promise<number> {
  const resultado =
    idsVigentes.length > 0
      ? await manager.delete(entidad, { id: Not(In(idsVigentes)) })
      : await manager.createQueryBuilder().delete().from(entidad).execute();
  return resultado.affected ?? 0;
}

const ids = (filas: { id?: string }[]) => filas.map((f) => f.id!);

async function seed() {
  const problemas = new Problemas();

  // 1. Audios: renombrar a nombres seguros.
  const audios = prepararAudios(RUTA_AUDIOS, problemas);

  // 2. Leer y validar el Excel.
  const libro = await abrirLibro(RUTA_EXCEL);
  const datos = transformarLibro(libro, audios.disponibles, problemas);

  for (const archivo of audios.disponibles) {
    if (!datos.audiosUsados.has(archivo)) {
      problemas.aviso(
        'Audios',
        null,
        null,
        `"${archivo}" no lo usa ninguna ficha cargada.`,
      );
    }
  }

  // 3. Guardar todo en una transacción: o se carga completo, o nada cambia.
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const dataSource = app.get(DataSource);

  const borrados = await dataSource.transaction(async (manager) => {
    // save() inserta o actualiza según el id: por eso no se duplica nada.
    // El orden importa: primero lo que otras tablas referencian.
    await manager.save(Lengua, datos.lenguas);
    await manager.save(Comunidad, datos.comunidades);
    await manager.save(Emprendimiento, datos.emprendimientos);
    await manager.save(Experiencia, datos.experiencias);
    // Guarda también la tabla intermedia fichas_experiencias.
    await manager.save(FichaCultural, datos.fichas);
    await manager.save(PreguntaFrecuente, datos.preguntas);

    // Las fechas bloqueadas no tienen código propio: se reemplazan completas.
    await manager.createQueryBuilder().delete().from(FechaBloqueada).execute();
    if (datos.fechasBloqueadas.length > 0) {
      await manager.insert(FechaBloqueada, datos.fechasBloqueadas);
    }

    // Borrar lo que ya no está en el Excel (primero las tablas "hijas").
    return {
      fichas: await borrarAusentes(manager, FichaCultural, ids(datos.fichas)),
      preguntas: await borrarAusentes(
        manager,
        PreguntaFrecuente,
        ids(datos.preguntas),
      ),
      experiencias: await borrarAusentes(
        manager,
        Experiencia,
        ids(datos.experiencias),
      ),
      emprendimientos: await borrarAusentes(
        manager,
        Emprendimiento,
        ids(datos.emprendimientos),
      ),
      comunidades: await borrarAusentes(
        manager,
        Comunidad,
        ids(datos.comunidades),
      ),
      lenguas: await borrarAusentes(manager, Lengua, ids(datos.lenguas)),
    };
  });

  // 4. Resumen.
  if (audios.renombrados.length > 0) {
    console.log(`\nAudios renombrados: ${audios.renombrados.length}`);
    for (const [antes, despues] of audios.renombrados) {
      console.log(`  ${antes}  ->  ${despues}`);
    }
  }

  problemas.imprimir();

  const contar = (tabla: string) =>
    dataSource
      .query<{ n: string }[]>(`SELECT count(*) AS n FROM "${tabla}"`)
      .then((r) => Number(r[0].n));

  console.log('\nRegistros en la base de datos:');
  const tablas: [string, string, number | undefined][] = [
    ['lenguas', 'Lenguas', borrados.lenguas],
    ['comunidades', 'Comunidades', borrados.comunidades],
    ['emprendimientos', 'Emprendimientos', borrados.emprendimientos],
    ['experiencias', 'Experiencias', borrados.experiencias],
    ['fechas_bloqueadas', 'Fechas bloqueadas', undefined],
    ['fichas_culturales', 'Fichas culturales', borrados.fichas],
    ['fichas_experiencias', 'Enlaces ficha-experiencia', undefined],
    ['preguntas_frecuentes', 'Preguntas frecuentes', borrados.preguntas],
  ];
  for (const [tabla, etiqueta, borradas] of tablas) {
    const extra = borradas
      ? `  (${borradas} borradas: ya no están en el Excel)`
      : '';
    console.log(
      `  ${etiqueta.padEnd(27)} ${String(await contar(tabla)).padStart(4)}${extra}`,
    );
  }

  const porLengua = await dataSource.query<
    { nombre: string; verificadas: string; total: string }[]
  >(`
    SELECT l."nombreComun" AS nombre,
           count(f.id) FILTER (WHERE f.estado = 'VERIFICADA') AS verificadas,
           count(f.id) AS total
    FROM lenguas l
    LEFT JOIN fichas_culturales f ON f."lenguaId" = l.id
    GROUP BY l.id, l."nombreComun"
    ORDER BY l.id`);
  console.log('\nFichas VERIFICADA por lengua (las únicas que ve el turista):');
  for (const fila of porLengua) {
    console.log(
      `  ${fila.nombre.padEnd(27)} ${fila.verificadas.padStart(4)} de ${fila.total}`,
    );
  }

  console.log(
    `\nTextos en lengua indígena normalizados a NFC: ${datos.textosNormalizados}`,
  );

  await app.close();
}

await seed();
