import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CrearReservaDto } from './crear-reserva.dto.js';
import { ReservasService } from './reservas.service.js';

@Controller('reservas')
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  // GET /api/reservas/disponibilidad?experiencia=EXP-01&fecha=2026-10-05
  // (va antes de ":id" para que "disponibilidad" no se tome como un id)
  @Get('disponibilidad')
  disponibilidad(
    @Query('experiencia') experiencia?: string,
    @Query('fecha') fecha?: string,
  ) {
    if (!experiencia || !fecha) {
      throw new BadRequestException(
        'Faltan los parámetros experiencia y fecha',
      );
    }
    return this.reservasService.consultarDisponibilidad(
      experiencia.trim().toUpperCase(),
      fecha.trim(),
    );
  }

  // POST /api/reservas -> 201 con la reserva en PENDIENTE_PAGO
  @Post()
  crear(@Body() dto: CrearReservaDto) {
    return this.reservasService.crear(dto);
  }

  // GET /api/reservas/<uuid>
  // ParseUUIDPipe responde 400 si el id no tiene formato de UUID.
  @Get(':id')
  obtener(@Param('id', ParseUUIDPipe) id: string) {
    return this.reservasService.obtener(id);
  }

  // POST /api/reservas/<uuid>/cancelar
  @Post(':id/cancelar')
  @HttpCode(200)
  cancelar(@Param('id', ParseUUIDPipe) id: string) {
    return this.reservasService.cancelar(id);
  }
}
