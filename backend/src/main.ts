import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Todas las rutas de la API quedan bajo /api (ej. /api/emprendimientos).
  // La raíz "/" queda libre para servir el frontend más adelante.
  app.setGlobalPrefix('api');
  // Valida los DTO (ej. CrearReservaDto) en todas las rutas:
  // - whitelist: descarta campos que no están en el DTO;
  // - forbidNonWhitelisted: y responde 400 si alguien los envía;
  // - transform: convierte el JSON en una instancia del DTO.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
