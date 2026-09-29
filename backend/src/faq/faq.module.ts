import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FaqController } from './faq.controller.js';
import { FaqService } from './faq.service.js';
import { PreguntaFrecuente } from './pregunta-frecuente.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([PreguntaFrecuente])],
  controllers: [FaqController],
  providers: [FaqService],
  // El agente las usará para responder y como respaldo sin conexión.
  exports: [FaqService],
})
export class FaqModule {}
