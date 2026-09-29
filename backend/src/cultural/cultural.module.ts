import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CulturalController } from './cultural.controller.js';
import { CulturalService } from './cultural.service.js';
import { FichaCultural } from './ficha-cultural.entity.js';
import { Lengua } from './lengua.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Lengua, FichaCultural])],
  controllers: [CulturalController],
  providers: [CulturalService],
  // Lo usan las experiencias (fichas de cortesía) y el agente (Bloque 4).
  exports: [CulturalService],
})
export class CulturalModule {}
