import { createHash } from 'node:crypto';
import {
  checksumEvento,
  eventoValido,
  firmaIntegridad,
  urlCheckout,
  type EventoWompi,
} from './wompi.js';

const sha256 = (t: string) => createHash('sha256').update(t).digest('hex');

describe('Wompi: firma de integridad', () => {
  it('concatena referencia + monto + moneda + secreto (ejemplo de la documentación)', () => {
    expect(
      firmaIntegridad({
        referencia: 'sk8-438k4-xmxm392-sn2m2',
        montoCentavos: 490000,
        moneda: 'COP',
        secreto: 'prod_integrity_Z5mMke9x0k8gpErbDqwrJXMqsI6SFli6',
      }),
    ).toBe(
      sha256(
        'sk8-438k4-xmxm392-sn2m2490000COPprod_integrity_Z5mMke9x0k8gpErbDqwrJXMqsI6SFli6',
      ),
    );
  });

  it('incluye la expiración antes del secreto', () => {
    expect(
      firmaIntegridad({
        referencia: 'R1',
        montoCentavos: 100,
        moneda: 'COP',
        expiracion: '2026-10-05T14:15:00.000Z',
        secreto: 's',
      }),
    ).toBe(sha256('R1100COP2026-10-05T14:15:00.000Zs'));
  });

  it('arma la URL del checkout con los parámetros de Wompi', () => {
    const url = new URL(
      urlCheckout({
        llavePublica: 'pub_test_x',
        referencia: 'R1',
        montoCentavos: 12000000,
        moneda: 'COP',
        expiracion: '2026-10-05T14:15:00.000Z',
        firma: 'abc',
        urlRetorno: 'http://localhost:3000/api/pagos/retorno/123',
        email: 'ana@ejemplo.com',
      }),
    );
    expect(url.origin + url.pathname).toBe('https://checkout.wompi.co/p/');
    expect(url.searchParams.get('amount-in-cents')).toBe('12000000');
    expect(url.searchParams.get('signature:integrity')).toBe('abc');
    expect(url.searchParams.get('customer-data:email')).toBe('ana@ejemplo.com');
  });
});

describe('Wompi: validación de eventos', () => {
  const secreto = 'test_events_secreto';
  const evento = (): EventoWompi => ({
    event: 'transaction.updated',
    data: {
      transaction: {
        id: '1234-1610641025-49201',
        reference: 'ECR-1',
        status: 'APPROVED',
        amount_in_cents: 4490000,
        currency: 'COP',
      },
    },
    signature: {
      properties: [
        'transaction.id',
        'transaction.status',
        'transaction.amount_in_cents',
      ],
    },
    timestamp: 1530291411,
  });

  it('checksum = SHA256(valores de properties + timestamp + secreto)', () => {
    expect(checksumEvento(evento(), secreto)).toBe(
      sha256(`1234-1610641025-49201APPROVED44900001530291411${secreto}`),
    );
  });

  it('acepta un evento bien firmado (también en mayúsculas)', () => {
    const e = evento();
    const firma = checksumEvento(e, secreto).toUpperCase();
    expect(eventoValido(e, secreto, firma)).toBe(true);
  });

  it('rechaza un evento con el monto o el estado alterados', () => {
    const e = evento();
    const firma = checksumEvento(e, secreto);
    e.data.transaction!.amount_in_cents = 100;
    expect(eventoValido(e, secreto, firma)).toBe(false);
  });

  it('rechaza un evento sin firma o con otro secreto', () => {
    const e = evento();
    expect(eventoValido(e, secreto, undefined)).toBe(false);
    expect(eventoValido(e, secreto, checksumEvento(e, 'otro'))).toBe(false);
  });
});
