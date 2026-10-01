import { Module } from '@nestjs/common';
import { resolve } from 'node:path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AgenteModule } from './agente/agente.module.js';
import { AppService } from './app.service.js';
import { CulturalModule } from './cultural/cultural.module.js';
import { EmprendimientosModule } from './emprendimientos/emprendimientos.module.js';
import { FaqModule } from './faq/faq.module.js';
import { PagosModule } from './pagos/pagos.module.js';
import { ReservasModule } from './reservas/reservas.module.js';

@Module({
  imports: [
    // Carga las variables del .env. El .env vive en la raíz del monorepo
    // (lo comparte con docker-compose.yml); '.env' queda como alternativa local.
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../.env', '.env'],
    }),

    // Conexión a PostgreSQL. Es "async" porque espera a que ConfigService
    // tenga las variables listas antes de conectarse.
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: Number(config.get<string>('DB_PORT', '5432')),
        username: config.getOrThrow<string>('DB_USER'),
        password: config.getOrThrow<string>('DB_PASSWORD'),
        database: config.getOrThrow<string>('DB_NAME'),
        // Cada módulo registra sus entities con TypeOrmModule.forFeature().
        autoLoadEntities: true,
        // Crea/ajusta tablas según las entities. Solo para desarrollo:
        // puede borrar columnas, así que con datos reales usar migraciones.
        synchronize: config.get<string>('DB_SYNCHRONIZE') === 'true',
      }),
    }),

    // Activa las tareas programadas (@Cron), ej. expirar reservas vencidas.
    ScheduleModule.forRoot(),

    // Sirve el frontend (frontend/www) en "/". La API queda en "/api".
    // npm ejecuta el backend desde backend/, por eso la ruta sube un nivel.
    ServeStaticModule.forRoot({
      rootPath: resolve(process.cwd(), '..', 'frontend', 'www'),
      exclude: ['/api/{*ruta}'],
    }),

    EmprendimientosModule,
    CulturalModule,
    FaqModule,
    ReservasModule,
    AgenteModule,
    PagosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
