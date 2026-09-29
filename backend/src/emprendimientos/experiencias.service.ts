import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ArrayContains, Repository } from 'typeorm';
import { CulturalService } from '../cultural/cultural.service.js';
import { Experiencia } from './experiencia.entity.js';
import type { Interes } from './intereses.js';

@Injectable()
export class ExperienciasService {
  constructor(
    @InjectRepository(Experiencia)
    private readonly repositorio: Repository<Experiencia>,
    private readonly culturalService: CulturalService,
  ) {}

  // Lista todas, o solo las que incluyen el interés indicado.
  listar(interes?: Interes): Promise<Experiencia[]> {
    return this.repositorio.find({
      // ArrayContains -> en SQL: intereses @> ARRAY['aves']
      where: interes ? { intereses: ArrayContains([interes]) } : {},
      relations: { emprendimiento: { comunidad: true } },
      order: { id: 'ASC' },
    });
  }

  // Detalle de una experiencia con sus fichas culturales (solo VERIFICADA).
  async obtenerPorId(id: string) {
    const experiencia = await this.repositorio.findOne({
      where: { id },
      relations: { emprendimiento: { comunidad: { lengua: true } } },
    });
    if (!experiencia) {
      throw new NotFoundException(`No existe la experiencia ${id}`);
    }

    // La lengua sale de la comunidad del emprendimiento. Puede no haber:
    // reservas privadas sin comunidad, o comunidad sin lengua (COM-07).
    const lenguaId = experiencia.emprendimiento.comunidad?.lenguaId ?? null;
    const fichas = await this.culturalService.fichasParaExperiencia(
      experiencia.id,
      lenguaId,
    );
    return { ...experiencia, fichas };
  }
}
