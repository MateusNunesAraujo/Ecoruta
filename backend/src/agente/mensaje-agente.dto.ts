import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { IDIOMAS, type Idioma } from '../faq/catalogos.js';

// Un mensaje anterior de la conversación. El servidor no guarda las
// conversaciones: el frontend reenvía los últimos mensajes en cada petición.
export class TurnoHistorialDto {
  @IsIn(['usuario', 'asistente'])
  rol!: 'usuario' | 'asistente';

  @IsString()
  @MaxLength(2000)
  texto!: string;
}

// Cuerpo de POST /api/agente/mensaje
export class MensajeAgenteDto {
  @IsString()
  @Length(1, 1000)
  mensaje!: string;

  // Idioma elegido en la interfaz: se usa si no se detecta otro en el mensaje.
  @IsOptional()
  @IsIn(IDIOMAS)
  idioma?: Idioma;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => TurnoHistorialDto)
  historial?: TurnoHistorialDto[];
}
