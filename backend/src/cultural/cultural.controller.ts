import { Controller, Get, Param, Query } from '@nestjs/common';
import { CulturalService } from './cultural.service.js';

@Controller('cultural')
export class CulturalController {
  constructor(private readonly culturalService: CulturalService) {}

  // GET /api/cultural                        -> todas las fichas VERIFICADA
  // GET /api/cultural?lengua=L-TIK&tema=hola -> filtradas
  // "lengua" es el código de la hoja Lenguas (L-TIK, L-MUR, L-YAG, L-MIR, L-BOR).
  @Get()
  listar(@Query('lengua') lengua?: string, @Query('tema') tema?: string) {
    return this.culturalService.listar({
      lenguaId: lengua?.trim().toUpperCase() || undefined,
      tema: tema?.trim().toLowerCase() || undefined,
    });
  }

  // GET /api/cultural/FIC-01
  @Get(':id')
  obtener(@Param('id') id: string) {
    return this.culturalService.obtener(id.trim().toUpperCase());
  }
}
