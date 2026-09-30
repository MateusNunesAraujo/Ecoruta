import type { ConfigService } from '@nestjs/config';
import type { Repository } from 'typeorm';
import type { Reserva } from '../reservas/reserva.entity.js';
import type { ReservasService } from '../reservas/reservas.service.js';
import type { IntentoPago } from './intento-pago.entity.js';
import { PagosService } from './pagos.service.js';

// PagosService con estas variables de entorno (sin base de datos).
function conEntorno(entorno: Record<string, string>) {
  const config = {
    get: (clave: string, porDefecto?: string) => entorno[clave] ?? porDefecto,
  } as unknown as ConfigService;
  return new PagosService(
    config,
    {} as ReservasService,
    {} as Repository<IntentoPago>,
    {} as Repository<Reserva>,
  );
}

describe('PagosService: modo de pago', () => {
  it('sin nada configurado no hay pagos', () => {
    expect(conEntorno({}).modo).toBe('ninguno');
    expect(conEntorno({}).configuracion().habilitado).toBe(false);
  });

  it('PAGOS_SIMULADOS=true activa el modo simulado', () => {
    const pagos = conEntorno({ PAGOS_SIMULADOS: 'true' });
    expect(pagos.modo).toBe('simulado');
    expect(pagos.configuracion()).toEqual({
      habilitado: true,
      sandbox: false,
      simulado: true,
    });
  });

  it('con llaves de Wompi siempre gana Wompi, aunque se pida simular', () => {
    const pagos = conEntorno({
      PAGOS_SIMULADOS: 'true',
      WOMPI_PUBLIC_KEY: 'pub_test_x',
      WOMPI_INTEGRITY_SECRET: 'test_integrity_x',
    });
    expect(pagos.modo).toBe('wompi');
    expect(pagos.configuracion().simulado).toBe(false);
  });

  it('las rutas simuladas no existen si el modo no está activo', async () => {
    await expect(
      conEntorno({}).simularPago('ECR-1', 'APPROVED'),
    ).rejects.toMatchObject({ status: 404 });
  });
});
