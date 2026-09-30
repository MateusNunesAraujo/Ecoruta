import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, type FindOptionsWhere } from 'typeorm';
import { puntuar } from './busqueda.js';
import type { Idioma } from './catalogos.js';
import { PreguntaFrecuente } from './pregunta-frecuente.entity.js';

@Injectable()
export class FaqService {
  constructor(
    @InjectRepository(PreguntaFrecuente)
    private readonly repositorio: Repository<PreguntaFrecuente>,
  ) {}

  // Las preguntas que mejor responden a una consulta (máx. 3). Se busca en
  // los tres idiomas a la vez. Con categoría, solo dentro de ella.
  async buscar(consulta: string, categoria?: string) {
    const where: FindOptionsWhere<PreguntaFrecuente> = {};
    if (categoria) where.categoria = categoria;
    const preguntas = await this.repositorio.find({
      where,
      order: { id: 'ASC' },
    });
    const puntuadas = preguntas
      .map((p) => ({
        p,
        puntos: puntuar(
          consulta,
          [
            p.preguntaEs,
            p.respuestaEs,
            p.preguntaEn,
            p.respuestaEn,
            p.preguntaPt,
            p.respuestaPt,
          ]
            .filter(Boolean)
            .join(' '),
        ),
      }))
      .filter((x) => x.puntos > 0)
      .sort((a, b) => b.puntos - a.puntos)
      .map((x) => x.p);
    // Si nada coincide pero se pidió una categoría, se devuelve esa categoría.
    return (puntuadas.length ? puntuadas : categoria ? preguntas : []).slice(
      0,
      3,
    );
  }

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
