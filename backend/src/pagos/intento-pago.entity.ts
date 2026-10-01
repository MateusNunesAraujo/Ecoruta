import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type Relation,
} from 'typeorm';
import { Reserva } from '../reservas/reserva.entity.js';

// Qué pasó con la reserva cuando Wompi aprobó el pago.
export type ResultadoPago = 'CONFIRMADA' | 'REQUIERE_REEMBOLSO';

// Cada vez que el turista pulsa "Pagar" se crea un intento con su propia
// referencia (Wompi no acepta repetirla). Si un pago se rechaza y el turista
// reintenta, ningún intento se pierde, aunque llegue tarde.
@Entity('intentos_pago')
export class IntentoPago {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  reservaId!: string;

  @ManyToOne(() => Reserva, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'reservaId' })
  reserva!: Relation<Reserva>;

  // Referencia única que viaja a Wompi y vuelve en el webhook.
  @Column({ length: 60, unique: true })
  referencia!: string;

  @Column('integer')
  montoCentavos!: number;

  // Estado según Wompi: CREADO (aún no paga), APPROVED, DECLINED, VOIDED,
  // ERROR o PENDING.
  @Column({ length: 20, default: 'CREADO' })
  estadoWompi!: string;

  @Column('varchar', { length: 60, nullable: true })
  transaccionId!: string | null;

  @Column('varchar', { length: 30, nullable: true })
  metodo!: string | null;

  // Solo si fue APPROVED. REQUIERE_REEMBOLSO: pagó tarde y ya no había cupo.
  @Column('varchar', { length: 20, nullable: true })
  resultado!: ResultadoPago | null;

  @CreateDateColumn({ type: 'timestamptz' })
  creadoEn!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  actualizadoEn!: Date;
}
