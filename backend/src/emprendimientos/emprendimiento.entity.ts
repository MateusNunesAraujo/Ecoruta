import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Interes } from './intereses.js';

// Cada propiedad con @Column es una columna de la tabla "emprendimientos".
@Entity('emprendimientos')
export class Emprendimiento {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 120 })
  nombre!: string;

  @Column({ length: 120 })
  comunidad!: string;

  // Descripción en los tres idiomas de los turistas.
  @Column('text')
  descripcionEs!: string;

  @Column('text')
  descripcionEn!: string;

  @Column('text')
  descripcionPt!: string;

  // Lista de PostgreSQL (text[]), ej. {aves,caminata}.
  @Column('text', { array: true, default: () => "'{}'" })
  intereses!: Interes[];

  // El peso colombiano no usa centavos: entero.
  @Column('integer')
  precioBaseCop!: number;

  @Column('integer')
  duracionMinutos!: number;

  // Cupos máximos por día. Lo usa el control de reservas (Bloque 3).
  @Column('integer')
  capacidadPorFecha!: number;

  @Column('double precision')
  latitud!: number;

  @Column('double precision')
  longitud!: number;

  // Teléfono o WhatsApp del emprendimiento.
  @Column({ length: 120 })
  contacto!: string;

  @Column('varchar', { length: 500, nullable: true })
  fotoUrl!: string | null;

  // true = dato inventado para pruebas y demo, no un emprendimiento real.
  @Column({ default: false })
  esEjemplo!: boolean;

  @CreateDateColumn()
  creadoEn!: Date;

  @UpdateDateColumn()
  actualizadoEn!: Date;
}
