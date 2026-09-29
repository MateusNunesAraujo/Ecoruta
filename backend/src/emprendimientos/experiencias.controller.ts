import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ExperienciasService } from './experiencias.service.js';
import { INTERESES, type Interes } from './intereses.js';

@Controller('experiencias')
export class ExperienciasController {
  constructor(private readonly experienciasService: ExperienciasService) {}

  // GET /api/experiencias               -> todas
  // GET /api/experiencias?interes=aves  -> filtradas por interés
  @Get()
  listar(@Query('interes') interes?: string) {
    if (interes === undefined) {
      return this.experienciasService.listar();
    }
    const normalizado = interes.trim().toLowerCase();
    if (!INTERESES.includes(normalizado as Interes)) {
      throw new BadRequestException(
        `Interés no válido. Valores posibles: ${INTERESES.join(', ')}`,
      );
    }
    return this.experienciasService.listar(normalizado as Interes);
  }

  // GET /api/experiencias/EXP-01 -> incluye fichas culturales VERIFICADA
  @Get(':id')
  obtenerPorId(@Param('id') id: string) {
    return this.experienciasService.obtenerPorId(id.trim().toUpperCase());
  }
}
