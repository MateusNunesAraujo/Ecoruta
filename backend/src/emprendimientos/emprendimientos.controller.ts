import { Controller, Get, Param } from '@nestjs/common';
import { Emprendimiento } from './emprendimiento.entity.js';
import { EmprendimientosService } from './emprendimientos.service.js';

// Con el prefijo global, estas rutas quedan en /api/emprendimientos.
// El filtro por interés está en /api/experiencias (los intereses son de cada
// experiencia, no del emprendimiento).
@Controller('emprendimientos')
export class EmprendimientosController {
  constructor(
    private readonly emprendimientosService: EmprendimientosService,
  ) {}

  // GET /api/emprendimientos
  @Get()
  listar(): Promise<Emprendimiento[]> {
    return this.emprendimientosService.listar();
  }

  // GET /api/emprendimientos/EMP-01 -> incluye comunidad y experiencias
  @Get(':id')
  obtenerPorId(@Param('id') id: string): Promise<Emprendimiento> {
    return this.emprendimientosService.obtenerPorId(id.trim().toUpperCase());
  }
}
