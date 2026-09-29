import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { FichaCultural } from '../cultural/ficha-cultural.entity.js';
import { Emprendimiento } from './emprendimiento.entity.js';
import { FechaBloqueada } from './fecha-bloqueada.entity.js';
import type { Interes } from './intereses.js';

// Hoja "Experiencias": la actividad que el turista reserva y paga.
@Entity('experiencias')
export class Experiencia {
  @PrimaryColumn({ length: 20 })
  id!: string;

  @Column({ length: 20 })
  emprendimientoId!: string;

  @ManyToOne(
    () => Emprendimiento,
    (emprendimiento) => emprendimiento.experiencias,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'emprendimientoId' })
  emprendimiento!: Relation<Emprendimiento>;

  @Column({ length: 200 })
  nombreEs!: string;

  @Column('varchar', { length: 200, nullable: true })
  nombreEn!: string | null;

  @Column('varchar', { length: 200, nullable: true })
  nombrePt!: string | null;

  @Column('text', { nullable: true })
  descripcionEs!: string | null;

  @Column('text', { nullable: true })
  descripcionEn!: string | null;

  @Column('text', { nullable: true })
  descripcionPt!: string | null;

  // Lista de PostgreSQL (text[]), ej. {artesanias,cultura}.
  @Column('text', { array: true, default: () => "'{}'" })
  intereses!: Interes[];

  // El Excel trae horas (ej. 1.5); se guardan en minutos enteros.
  @Column('integer', { nullable: true })
  duracionMinutos!: number | null;

  // Formato 24 h "HH:MM".
  @Column('varchar', { length: 5, nullable: true })
  horaSalida!: string | null;

  // Ej. {lunes,martes,miercoles}
  @Column('text', { array: true, default: () => "'{}'" })
  diasOperacion!: string[];

  // Cupo máximo por salida. Sin capacidad o sin precio no se puede reservar.
  @Column('integer', { nullable: true })
  capacidad!: number | null;

  // Por persona, en pesos colombianos (sin centavos).
  @Column('integer', { nullable: true })
  precioCop!: number | null;

  @Column('text', { nullable: true })
  incluye!: string | null;

  @Column('text', { nullable: true })
  noIncluye!: string | null;

  @Column('text', { nullable: true })
  queLlevar!: string | null;

  @Column('varchar', { length: 10, nullable: true })
  dificultad!: string | null;

  @Column('text', { nullable: true })
  puntoEncuentro!: string | null;

  @Column('double precision', { nullable: true })
  latitud!: number | null;

  @Column('double precision', { nullable: true })
  longitud!: number | null;

  @Column('text', { nullable: true })
  cancelacion!: string | null;

  // Lado inverso del muchos a muchos (el @JoinTable está en FichaCultural).
  @ManyToMany(() => FichaCultural, (ficha) => ficha.experiencias)
  fichas!: Relation<FichaCultural[]>;

  @OneToMany(() => FechaBloqueada, (fecha) => fecha.experiencia)
  fechasBloqueadas!: Relation<FechaBloqueada[]>;
}
