import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
