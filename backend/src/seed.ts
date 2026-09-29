// Carga datos de ejemplo en la base de datos.
// Uso (dentro de backend/): npm run seed
// Solo reemplaza registros marcados como ejemplo; nunca borra datos reales.
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module.js';
import { Emprendimiento } from './emprendimientos/emprendimiento.entity.js';
import { EMPRENDIMIENTOS_EJEMPLO } from './emprendimientos/emprendimientos.datos-ejemplo.js';

async function seed() {
  // Arranca NestJS sin servidor web: reutiliza la conexión y el .env de la API.
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  // Transacción: si algo falla, no queda la tabla a medias.
  await dataSource.transaction(async (manager) => {
    await manager.delete(Emprendimiento, { esEjemplo: true });
    await manager.insert(
      Emprendimiento,
      EMPRENDIMIENTOS_EJEMPLO.map((dato) => ({ ...dato, esEjemplo: true })),
    );
  });

  console.log(
    `Seed listo: ${EMPRENDIMIENTOS_EJEMPLO.length} emprendimientos de ejemplo.`,
  );
  await app.close();
}

await seed();
