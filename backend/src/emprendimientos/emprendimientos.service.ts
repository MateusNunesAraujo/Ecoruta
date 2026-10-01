import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { normalizar } from '../faq/busqueda.js';
import { Comunidad } from './comunidad.entity.js';
import { Emprendimiento } from './emprendimiento.entity.js';

@Injectable()
export class EmprendimientosService {
  constructor(
    // El repository es el objeto de TypeORM para consultar la tabla.
    @InjectRepository(Emprendimiento)
    private readonly repositorio: Repository<Emprendimiento>,
    @InjectRepository(Comunidad)
    private readonly comunidades: Repository<Comunidad>,
  ) {}

  // Comunidades nombradas en un texto ("¿Cómo llego a Puerto Nariño?").
  // Se comparan sin tildes ni mayúsculas.
  async comunidadesMencionadas(texto: string): Promise<Comunidad[]> {
    const destino = ` ${normalizar(texto).replace(/[^a-z0-9]+/g, ' ')} `;
    const todas = await this.comunidades.find({ order: { id: 'ASC' } });
    return todas.filter((c) => {
      const nombre = normalizar(c.nombre)
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
      return destino.includes(` ${nombre} `);
    });
  }

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
