import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { AgenteService } from './agente.service.js';
import { LimitePeticionesGuard } from './limite-peticiones.guard.js';
import { MensajeAgenteDto } from './mensaje-agente.dto.js';

// Límite de mensajes por IP (ver limite-peticiones.guard.ts). Solo aplica a
// este controller: el catálogo y las reservas no tienen este límite.
@UseGuards(LimitePeticionesGuard)
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
