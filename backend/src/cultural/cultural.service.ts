import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, type FindOptionsWhere } from 'typeorm';
import { TEMAS_CORTESIA } from './catalogos.js';
import { FichaCultural } from './ficha-cultural.entity.js';

// Todo lo que sale de este service es solo VERIFICADA: al turista nunca se le
// entrega una ficha PENDIENTE.
const VERIFICADA = 'VERIFICADA' as const;

@Injectable()
export class CulturalService {
  constructor(
    @InjectRepository(FichaCultural)
    private readonly fichas: Repository<FichaCultural>,
  ) {}

  listar(filtros: { lenguaId?: string; tema?: string; tipo?: string }) {
    // TypeORM 1.x no acepta "undefined" en el where: solo se agregan los
    // filtros que llegaron.
    const where: FindOptionsWhere<FichaCultural> = { estado: VERIFICADA };
    if (filtros.lenguaId) where.lenguaId = filtros.lenguaId;
    if (filtros.tema) where.tema = filtros.tema;
    if (filtros.tipo) where.tipo = filtros.tipo;
    return this.fichas.find({
      where,
      relations: { lengua: true },
      order: { lenguaId: 'ASC', tema: 'ASC', id: 'ASC' },
    });
  }

  // Temas con al menos una ficha VERIFICADA (ej. hola, gracias, delfin).
  // El agente se los ofrece al LLM para que pida uno que exista.
  async temasDisponibles(): Promise<string[]> {
    const filas = await this.fichas
      .createQueryBuilder('f')
      .select('DISTINCT f.tema', 'tema')
      .where('f.estado = :estado', { estado: VERIFICADA })
      .orderBy('tema')
      .getRawMany<{ tema: string }>();
    return filas.map((f) => f.tema);
  }

  async obtener(id: string) {
    const ficha = await this.fichas.findOne({
      where: { id, estado: VERIFICADA },
      relations: { lengua: true },
    });
    if (!ficha) {
      throw new NotFoundException(`No existe la ficha cultural ${id}`);
    }
    return ficha;
  }

  // Fichas que acompañan a una experiencia:
  // 1) automáticas: tipo "saludo" o temas de cortesía, en la lengua de la
  //    comunidad (si la comunidad tiene lengua);
  // 2) las enlazadas a mano en el Excel (columna experiencia_id).
  // Se juntan por id para no repetir ninguna.
  async fichasParaExperiencia(experienciaId: string, lenguaId: string | null) {
    const automaticas = lenguaId
      ? await this.fichas.find({
          // Un arreglo en "where" significa OR entre las condiciones.
          where: [
            { estado: VERIFICADA, lenguaId, tipo: 'saludo' },
            { estado: VERIFICADA, lenguaId, tema: In(TEMAS_CORTESIA) },
          ],
          relations: { lengua: true },
          order: { id: 'ASC' },
        })
      : [];

    const enlazadas = await this.fichas.find({
      where: { estado: VERIFICADA, experiencias: { id: experienciaId } },
      relations: { lengua: true },
      order: { id: 'ASC' },
    });

    const sinRepetir = new Map<string, FichaCultural>();
    for (const ficha of [...automaticas, ...enlazadas]) {
      sinRepetir.set(ficha.id, ficha);
    }
    return [...sinRepetir.values()];
  }
}
