import { Column, Entity, PrimaryColumn } from 'typeorm';

// Hoja "Lenguas" del Excel. El id es el código fijo (ej. L-TIK).
@Entity('lenguas')
export class Lengua {
  @PrimaryColumn({ length: 20 })
  id!: string;

  @Column({ length: 80 })
  nombreComun!: string;

  // Texto en lengua indígena: se guarda normalizado a Unicode NFC.
  @Column('varchar', { length: 120, nullable: true })
  autodenominacion!: string | null;

  @Column('text', { nullable: true })
  descripcionEs!: string | null;

  @Column('text', { nullable: true })
  descripcionEn!: string | null;

  @Column('text', { nullable: true })
  descripcionPt!: string | null;

  @Column('text', { nullable: true })
  fuente!: string | null;
}
