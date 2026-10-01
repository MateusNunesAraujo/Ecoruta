import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';
import { Experiencia } from './experiencia.entity.js';

// Hoja "Fechas_bloqueadas": días en que una experiencia no se ofrece.
// No tiene id propio: la clave es la pareja (experiencia, fecha).
@Entity('fechas_bloqueadas')
export class FechaBloqueada {
  @PrimaryColumn({ length: 20 })
  experienciaId!: string;

  @PrimaryColumn('date')
  fecha!: string;

  @ManyToOne(() => Experiencia, (experiencia) => experiencia.fechasBloqueadas, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'experienciaId' })
  experiencia!: Relation<Experiencia>;

  @Column('text', { nullable: true })
  motivo!: string | null;
}
