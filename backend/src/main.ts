import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // En la demo, el túnel de Cloudflare corre en el mismo portátil: todas las
  // visitas llegan desde 127.0.0.1. Con esto, Express toma la IP real del
  // visitante de X-Forwarded-For (así el límite de mensajes del chat es por
  // turista), pero solo si la petición viene del propio equipo: desde
  // internet nadie puede falsificar su IP con esa cabecera.
  app.set('trust proxy', 'loopback');
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
