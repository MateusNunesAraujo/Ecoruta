import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AgenteService } from './agente.service.js';
import { MensajeAgenteDto } from './mensaje-agente.dto.js';

@Controller('agente')
export class AgenteController {
  constructor(private readonly agenteService: AgenteService) {}

  // POST /api/agente/mensaje
  // { mensaje, idioma?, historial? } -> { idioma, texto, tarjetas, proveedor }
  @Post('mensaje')
  @HttpCode(200)
  mensaje(@Body() dto: MensajeAgenteDto) {
    return this.agenteService.responder(dto);
  }
}
