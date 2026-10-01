import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { Comunidad } from './comunidad.entity.js';
import { Experiencia } from './experiencia.entity.js';

// Hoja "Emprendimientos". Solo se cargan los que autorizaron aparecer
// (consentimiento = Si, Ley 1581 de 2012).
@Entity('emprendimientos')
export class Emprendimiento {
  @PrimaryColumn({ length: 20 })
  id!: string;

  @Column({ length: 160 })
  nombre!: string;

  // Puede estar vacía: reservas privadas (EMP-03, EMP-04, EMP-08).
  @Column('varchar', { length: 20, nullable: true })
  comunidadId!: string | null;

  @ManyToOne(() => Comunidad, (comunidad) => comunidad.emprendimientos, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'comunidadId' })
  comunidad!: Relation<Comunidad> | null;

  @Column('varchar', { length: 120, nullable: true })
  responsable!: string | null;

  @Column('varchar', { length: 40, nullable: true })
  whatsapp!: string | null;

  @Column('text', { nullable: true })
  descripcionEs!: string | null;

  @Column('text', { nullable: true })
  descripcionEn!: string | null;

  @Column('text', { nullable: true })
  descripcionPt!: string | null;

  // Ej. {Español,Tikuna}
  @Column('text', { array: true, default: () => "'{}'" })
  idiomasGuias!: string[];

  @Column('text', { array: true, default: () => "'{}'" })
  fotos!: string[];

  @Column('date', { nullable: true })
  fechaConsentimiento!: string | null;

  // true = dato de ejemplo para la demo, no un emprendimiento real.
  @Column({ default: false })
  esFicticio!: boolean;

  @OneToMany(() => Experiencia, (experiencia) => experiencia.emprendimiento)
  experiencias!: Relation<Experiencia[]>;
}
