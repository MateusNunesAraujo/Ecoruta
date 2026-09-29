import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Emprendimiento } from './emprendimiento.entity.js';

@Injectable()
export class EmprendimientosService {
  constructor(
    // El repository es el objeto de TypeORM para consultar la tabla.
    @InjectRepository(Emprendimiento)
    private readonly repositorio: Repository<Emprendimiento>,
  ) {}

  listar(): Promise<Emprendimiento[]> {
    return this.repositorio.find({
      relations: { comunidad: true },
      order: { id: 'ASC' },
    });
  }

  async obtenerPorId(id: string): Promise<Emprendimiento> {
    const emprendimiento = await this.repositorio.findOne({
      where: { id },
      relations: { comunidad: { lengua: true }, experiencias: true },
      order: { experiencias: { id: 'ASC' } },
    });
    if (!emprendimiento) {
      // NestJS convierte esta excepción en una respuesta HTTP 404.
      throw new NotFoundException(`No existe el emprendimiento ${id}`);
    }
    return emprendimiento;
  }
}
