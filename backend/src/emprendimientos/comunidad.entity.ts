import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { Lengua } from '../cultural/lengua.entity.js';
import { Emprendimiento } from './emprendimiento.entity.js';

// Hoja "Comunidades". El id es el código del Excel (ej. COM-01).
@Entity('comunidades')
export class Comunidad {
  @PrimaryColumn({ length: 20 })
  id!: string;

  @Column({ length: 120 })
  nombre!: string;

  @Column('varchar', { length: 200, nullable: true })
  pueblos!: string | null;

  // Puede estar vacía: ej. COM-07 (pueblo Cocama, fuera de las cinco lenguas).
  @Column('varchar', { length: 20, nullable: true })
  lenguaId!: string | null;

  @ManyToOne(() => Lengua, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'lenguaId' })
  lengua!: Relation<Lengua> | null;

  @Column('text', { nullable: true })
  referenciaUbicacion!: string | null;

  @Column('double precision', { nullable: true })
  latitud!: number | null;

  @Column('double precision', { nullable: true })
  longitud!: number | null;

  @Column('text', { nullable: true })
  comoLlegar!: string | null;

  @Column('text', { nullable: true })
  normasVisita!: string | null;

  @Column('text', { nullable: true })
  fuente!: string | null;

  @OneToMany(() => Emprendimiento, (emprendimiento) => emprendimiento.comunidad)
  emprendimientos!: Relation<Emprendimiento[]>;
}
