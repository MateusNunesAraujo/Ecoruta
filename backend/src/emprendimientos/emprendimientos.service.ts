import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ArrayContains, Repository } from 'typeorm';
import { Emprendimiento } from './emprendimiento.entity.js';
import type { Interes } from './intereses.js';

@Injectable()
export class EmprendimientosService {
  constructor(
    // El repository es el objeto de TypeORM para consultar la tabla.
    @InjectRepository(Emprendimiento)
    private readonly repositorio: Repository<Emprendimiento>,
  ) {}

  // Lista todos, o solo los que incluyen el interés indicado.
  listar(interes?: Interes): Promise<Emprendimiento[]> {
    return this.repositorio.find({
      // ArrayContains -> en SQL: intereses @> ARRAY['aves']
      where: interes ? { intereses: ArrayContains([interes]) } : {},
      order: { nombre: 'ASC' },
    });
  }

  async obtenerPorId(id: number): Promise<Emprendimiento> {
    const emprendimiento = await this.repositorio.findOneBy({ id });
    if (!emprendimiento) {
      // NestJS convierte esta excepción en una respuesta HTTP 404.
      throw new NotFoundException(`No existe el emprendimiento ${id}`);
    }
    return emprendimiento;
  }
}
