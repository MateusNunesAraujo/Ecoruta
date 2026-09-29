import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Emprendimiento } from './emprendimiento.entity.js';
import { EmprendimientosController } from './emprendimientos.controller.js';
import { EmprendimientosService } from './emprendimientos.service.js';

@Module({
  // Registra la entity: crea la tabla y permite inyectar su repository.
  imports: [TypeOrmModule.forFeature([Emprendimiento])],
  controllers: [EmprendimientosController],
  providers: [EmprendimientosService],
  // Se exporta para que el agente (Bloque 4) pueda buscar emprendimientos.
  exports: [EmprendimientosService],
})
export class EmprendimientosModule {}
