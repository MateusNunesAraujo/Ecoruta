import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CulturalModule } from '../cultural/cultural.module.js';
import { Comunidad } from './comunidad.entity.js';
import { Emprendimiento } from './emprendimiento.entity.js';
import { EmprendimientosController } from './emprendimientos.controller.js';
import { EmprendimientosService } from './emprendimientos.service.js';
import { Experiencia } from './experiencia.entity.js';
import { ExperienciasController } from './experiencias.controller.js';
import { ExperienciasService } from './experiencias.service.js';
import { FechaBloqueada } from './fecha-bloqueada.entity.js';

@Module({
  imports: [
    // Registra las entities: crea las tablas y permite inyectar sus repositories.
    TypeOrmModule.forFeature([
      Comunidad,
      Emprendimiento,
      Experiencia,
      FechaBloqueada,
    ]),
    // Para incluir las fichas culturales al mostrar una experiencia.
    CulturalModule,
  ],
  controllers: [EmprendimientosController, ExperienciasController],
  providers: [EmprendimientosService, ExperienciasService],
  // Se exportan para que el agente (Bloque 4) pueda buscar.
  exports: [EmprendimientosService, ExperienciasService],
})
export class EmprendimientosModule {}
