import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { Experiencia } from '../emprendimientos/experiencia.entity.js';
import type { EstadoFicha } from './catalogos.js';
import { Lengua } from './lengua.entity.js';

// Hoja "Fichas_culturales". Contenido curado: nunca lo genera el LLM
// (reglas 1 y 2 de CLAUDE.md). Al turista solo se le entregan VERIFICADA.
@Entity('fichas_culturales')
export class FichaCultural {
  @PrimaryColumn({ length: 20 })
  id!: string;

  @Column({ length: 20 })
  lenguaId!: string;

  @ManyToOne(() => Lengua, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lenguaId' })
  lengua!: Relation<Lengua>;

  @Column({ length: 40 })
  tipo!: string;

  @Column({ length: 60 })
  tema!: string;

  // Texto en lengua indígena, copiado exacto de la fuente (normalizado NFC).
  @Column('text')
  textoOriginal!: string;

  @Column('text', { nullable: true })
  significadoEs!: string | null;

  @Column('text', { nullable: true })
  significadoEn!: string | null;

  @Column('text', { nullable: true })
  significadoPt!: string | null;

  // Guía de pronunciación (normalizada NFC: puede tener letras como ɨ).
  @Column('text', { nullable: true })
  pronunciacion!: string | null;

  // Nombre del archivo en frontend/www/audio/ (ej. hola_tikuna.m4a).
  @Column('varchar', { length: 200, nullable: true })
  audio!: string | null;

  @Column('text', { nullable: true })
  contexto!: string | null;

  @Column('text', { nullable: true })
  narrativa!: string | null;

  @Column('text', { nullable: true })
  fuente!: string | null;

  @Column('text', { nullable: true })
  comunidadOHablante!: string | null;

  @Column('text', { nullable: true })
  permisoUso!: string | null;

  @Column({ length: 20 })
  estado!: EstadoFicha;

  // Dato interno del equipo: no se envía al turista (select: false).
  @Column('varchar', { length: 120, nullable: true, select: false })
  verificadoPor!: string | null;

  // Muchos a muchos: una ficha puede enlazarse a varias experiencias y una
  // experiencia a varias fichas. @JoinTable crea la tabla intermedia.
  @ManyToMany(() => Experiencia, (experiencia) => experiencia.fichas)
  @JoinTable({
    name: 'fichas_experiencias',
    joinColumn: { name: 'fichaId' },
    inverseJoinColumn: { name: 'experienciaId' },
  })
  experiencias!: Relation<Experiencia[]>;
}
