import {
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { IDIOMAS, type Idioma } from '../faq/catalogos.js';

// DTO (Data Transfer Object): describe qué datos acepta POST /api/reservas.
// El ValidationPipe revisa estas reglas antes de llegar al service y
// descarta cualquier campo que no esté aquí (ej. "estado" o "totalCop").
export class CrearReservaDto {
  @IsString()
  @Matches(/^EXP-\d+$/i, { message: 'experienciaId debe ser como EXP-01' })
  experienciaId!: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'fecha debe ser AAAA-MM-DD' })
  fecha!: string;

  @IsInt()
  @Min(1)
  @Max(50)
  personas!: number;

  // Datos mínimos del turista: solo lo necesario para la reserva y el pago.
  @IsString()
  @Length(2, 120)
  nombre!: string;

  @IsEmail()
  @MaxLength(200)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @IsIn(IDIOMAS)
  idioma!: Idioma;
}
