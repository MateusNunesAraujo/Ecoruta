import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reserva } from '../reservas/reserva.entity.js';
import { ReservasModule } from '../reservas/reservas.module.js';
import { IntentoPago } from './intento-pago.entity.js';
import { PagosController } from './pagos.controller.js';
import { PagosService } from './pagos.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([IntentoPago, Reserva]), ReservasModule],
  controllers: [PagosController],
  providers: [PagosService],
  // El agente lo usa para saber si los pagos están habilitados.
  exports: [PagosService],
})
export class PagosModule {}
