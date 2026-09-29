import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { Emprendimiento } from './emprendimiento.entity.js';
import { EmprendimientosService } from './emprendimientos.service.js';
import { INTERESES, type Interes } from './intereses.js';

// Con el prefijo global, estas rutas quedan en /api/emprendimientos.
@Controller('emprendimientos')
export class EmprendimientosController {
  constructor(
    private readonly emprendimientosService: EmprendimientosService,
  ) {}

  // GET /api/emprendimientos            -> todos
  // GET /api/emprendimientos?interes=aves -> filtrados por interés
  @Get()
  listar(@Query('interes') interes?: string): Promise<Emprendimiento[]> {
    if (interes === undefined) {
      return this.emprendimientosService.listar();
    }
    const normalizado = interes.trim().toLowerCase();
    if (!INTERESES.includes(normalizado as Interes)) {
      throw new BadRequestException(
        `Interés no válido. Valores posibles: ${INTERESES.join(', ')}`,
      );
    }
    return this.emprendimientosService.listar(normalizado as Interes);
  }

  // GET /api/emprendimientos/3
  // ParseIntPipe convierte "3" en número y responde 400 si no lo es.
  @Get(':id')
  obtenerPorId(@Param('id', ParseIntPipe) id: number): Promise<Emprendimiento> {
    return this.emprendimientosService.obtenerPorId(id);
  }
}
