import { IsIn } from 'class-validator';

// Cuerpo de POST /api/pagos/simulado/:referencia (solo en modo simulado).
export class SimularPagoDto {
  @IsIn(['APPROVED', 'DECLINED'])
  estado!: 'APPROVED' | 'DECLINED';
}
