import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Todas las rutas de la API quedan bajo /api (ej. /api/emprendimientos).
  // La raíz "/" queda libre para servir el frontend más adelante.
  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
