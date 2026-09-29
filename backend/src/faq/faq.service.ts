import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, type FindOptionsWhere } from 'typeorm';
import type { Idioma } from './catalogos.js';
import { PreguntaFrecuente } from './pregunta-frecuente.entity.js';

@Injectable()
export class FaqService {
  constructor(
    @InjectRepository(PreguntaFrecuente)
    private readonly repositorio: Repository<PreguntaFrecuente>,
  ) {}

  async listar(filtros: { categoria?: string; idioma?: Idioma }) {
    // TypeORM 1.x no acepta "undefined" en el where.
    const where: FindOptionsWhere<PreguntaFrecuente> = {};
    if (filtros.categoria) where.categoria = filtros.categoria;
    const preguntas = await this.repositorio.find({
      where,
      order: { id: 'ASC' },
    });
    const idioma = filtros.idioma;
    if (!idioma) {
      return preguntas;
    }

    // Con idioma: solo pregunta y respuesta en ese idioma. Si falta la
    // traducción, se usa el español.
    const campo = { es: 'Es', en: 'En', pt: 'Pt' } as const;
    return preguntas.map((p) => ({
      id: p.id,
      categoria: p.categoria,
      pregunta: p[`pregunta${campo[idioma]}`] ?? p.preguntaEs,
      respuesta: p[`respuesta${campo[idioma]}`] ?? p.respuestaEs,
      fuente: p.fuente,
      fechaRevision: p.fechaRevision,
    }));
  }
}
