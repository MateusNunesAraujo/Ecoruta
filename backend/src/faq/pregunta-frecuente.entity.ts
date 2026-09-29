import { Column, Entity, PrimaryColumn } from 'typeorm';

// Hoja "Preguntas_frecuentes". Se muestran también sin conexión (Bloque 7).
@Entity('preguntas_frecuentes')
export class PreguntaFrecuente {
  @PrimaryColumn({ length: 20 })
  id!: string;

  @Column({ length: 40 })
  categoria!: string;

  @Column('text')
  preguntaEs!: string;

  @Column('text')
  respuestaEs!: string;

  @Column('text', { nullable: true })
  preguntaEn!: string | null;

  @Column('text', { nullable: true })
  respuestaEn!: string | null;

  @Column('text', { nullable: true })
  preguntaPt!: string | null;

  @Column('text', { nullable: true })
  respuestaPt!: string | null;

  @Column('text', { nullable: true })
  fuente!: string | null;

  // Estos datos cambian (salud, frontera): conviene saber cuándo se revisaron.
  @Column('date', { nullable: true })
  fechaRevision!: string | null;
}
