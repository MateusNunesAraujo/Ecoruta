import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Experiencia } from '../emprendimientos/experiencia.entity.js';
import type { Idioma } from '../faq/catalogos.js';

// Ciclo de vida (regla 4 de CLAUDE.md):
// PENDIENTE_PAGO (cupo apartado 15 min) -> CONFIRMADA (pago aprobado, Bloque 6)
//                                       -> CANCELADA | EXPIRADA
export const ESTADOS_RESERVA = [
  'PENDIENTE_PAGO',
  'CONFIRMADA',
  'CANCELADA',
  'EXPIRADA',
] as const;
export type EstadoReserva = (typeof ESTADOS_RESERVA)[number];

// Tiempo que el cupo queda apartado mientras el turista paga.
export const MINUTOS_PARA_PAGAR = 15;

// Restricciones en PostgreSQL: aunque haya un error en el código, la base de
// datos no acepta estos valores.
@Entity('reservas')
@Check('reserva_personas_positivas', '"personas" >= 1')
@Check(
  'reserva_estado_valido',
  `"estado" IN (${ESTADOS_RESERVA.map((e) => `'${e}'`).join(', ')})`,
)
@Check(
  'reserva_total_correcto',
  '"totalCop" = "personas" * "precioUnitarioCop"',
)
// Acelera el conteo de cupos ocupados por experiencia y fecha.
@Index('reserva_experiencia_fecha', ['experienciaId', 'fecha'])
export class Reserva {
  // UUID y no 1, 2, 3…: así nadie puede adivinar reservas de otros turistas.
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 20 })
  experienciaId!: string;

  // RESTRICT: no se puede borrar una experiencia que tiene reservas.
  @ManyToOne(() => Experiencia, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'experienciaId' })
  experiencia!: Relation<Experiencia>;

  @Column('date')
  fecha!: string;

  @Column('integer')
  personas!: number;

  // Precio del momento de la reserva: si el Excel cambia después, lo que el
  // turista ya reservó no cambia.
  @Column('integer')
  precioUnitarioCop!: number;

  @Column('integer')
  totalCop!: number;

  @Column({ length: 20, default: 'PENDIENTE_PAGO' })
  estado!: EstadoReserva;

  @Column('timestamptz')
  expiraEn!: Date;

  // --- Datos mínimos del turista (regla 3: nada que no se necesite) ---
  @Column({ length: 120 })
  nombreTurista!: string;

  // select: false -> no sale en las respuestas de la API. El pago (Bloque 6)
  // lo pedirá explícitamente.
  @Column({ length: 200, select: false })
  emailTurista!: string;

  @Column('varchar', { length: 30, nullable: true, select: false })
  telefonoTurista!: string | null;

  @Column({ length: 2 })
  idioma!: Idioma;

  @CreateDateColumn({ type: 'timestamptz' })
  creadaEn!: Date;
}
