import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Redirect,
} from '@nestjs/common';
import { PagosService } from './pagos.service.js';
import type { EventoWompi } from './wompi.js';

@Controller('pagos')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  // GET /api/pagos/config -> { habilitado, sandbox }
  @Get('config')
  config() {
    return this.pagosService.configuracion();
  }

  // POST /api/pagos/reservas/<uuid>/enlace -> { url, referencia, ... }
  @Post('reservas/:id/enlace')
  crearEnlace(@Param('id', ParseUUIDPipe) id: string) {
    return this.pagosService.crearEnlace(id);
  }

  // POST /api/pagos/webhook: URL que se configura en el panel de Wompi
  // ("URL de eventos"). Debe responder 200 o Wompi reintenta.
  @Post('webhook')
  @HttpCode(200)
  webhook(
    @Body() evento: EventoWompi,
    @Headers('x-event-checksum') checksum?: string,
  ) {
    return this.pagosService.procesarEvento(evento, checksum);
  }

  // GET /api/pagos/retorno/<uuid>?id=<transacción>
  // Wompi devuelve aquí al turista; se verifica el pago y se le lleva a la
  // pantalla de su reserva con el resultado.
  @Get('retorno/:id')
  @Redirect('/', 302)
  async retorno(
    @Param('id', ParseUUIDPipe) reservaId: string,
    @Query('id') transaccionId?: string,
  ) {
    const resultado = transaccionId
      ? await this.pagosService.procesarRetorno(reservaId, transaccionId)
      : 'DESCONOCIDO';
    return { url: `/#/reserva/${reservaId}?pago=${resultado}` };
  }
}
