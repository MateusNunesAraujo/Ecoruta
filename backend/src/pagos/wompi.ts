import { createHash, timingSafeEqual } from 'node:crypto';

// Funciones de Wompi sin dependencias (fáciles de probar).
// Docs: https://docs.wompi.co/docs/colombia/widget-checkout-web/
//       https://docs.wompi.co/docs/colombia/eventos/

const sha256 = (texto: string) =>
  createHash('sha256').update(texto, 'utf8').digest('hex');

// Firma de integridad del Web Checkout: evita que alguien cambie el monto o
// la referencia en la URL. Orden: referencia + monto en centavos + moneda
// + fecha de expiración (si se usa) + secreto de integridad.
export function firmaIntegridad(datos: {
  referencia: string;
  montoCentavos: number;
  moneda: string;
  expiracion?: string;
  secreto: string;
}): string {
  return sha256(
    `${datos.referencia}${datos.montoCentavos}${datos.moneda}` +
      `${datos.expiracion ?? ''}${datos.secreto}`,
  );
}

// URL del Web Checkout (la misma para pruebas y producción: el ambiente lo
// decide la llave pública pub_test_ / pub_prod_).
export function urlCheckout(datos: {
  llavePublica: string;
  referencia: string;
  montoCentavos: number;
  moneda: string;
  expiracion: string;
  firma: string;
  urlRetorno: string;
  email?: string;
  nombre?: string;
}): string {
  const parametros = new URLSearchParams({
    'public-key': datos.llavePublica,
    currency: datos.moneda,
    'amount-in-cents': String(datos.montoCentavos),
    reference: datos.referencia,
    'signature:integrity': datos.firma,
    'redirect-url': datos.urlRetorno,
    'expiration-time': datos.expiracion,
  });
  // Datos para que el turista no los escriba de nuevo en Wompi.
  if (datos.email) parametros.set('customer-data:email', datos.email);
  if (datos.nombre) parametros.set('customer-data:full-name', datos.nombre);
  return `https://checkout.wompi.co/p/?${parametros.toString()}`;
}

export interface TransaccionWompi {
  id: string;
  reference: string;
  status: string; // APPROVED | DECLINED | VOIDED | ERROR | PENDING
  amount_in_cents: number;
  currency: string;
  payment_method_type?: string;
}

export interface EventoWompi {
  event: string;
  data: { transaction?: TransaccionWompi } & Record<string, unknown>;
  signature?: { properties?: string[]; checksum?: string };
  timestamp?: number;
}

// "transaction.id" -> data.transaction.id
function leerRuta(objeto: unknown, ruta: string): unknown {
  return ruta
    .split('.')
    .reduce<unknown>(
      (actual, clave) =>
        actual && typeof actual === 'object'
          ? (actual as Record<string, unknown>)[clave]
          : undefined,
      objeto,
    );
}

// Checksum de un evento: SHA256 de los valores de signature.properties (en
// ese orden) + timestamp + secreto de eventos.
export function checksumEvento(evento: EventoWompi, secreto: string): string {
  const valores = (evento.signature?.properties ?? [])
    .map((propiedad) => String(leerRuta(evento.data, propiedad) ?? ''))
    .join('');
  return sha256(`${valores}${evento.timestamp ?? ''}${secreto}`);
}

// true si el evento viene de verdad de Wompi (firma correcta).
export function eventoValido(
  evento: EventoWompi,
  secreto: string,
  checksumRecibido: string | undefined,
): boolean {
  const recibido = (checksumRecibido ?? evento.signature?.checksum ?? '')
    .trim()
    .toLowerCase();
  if (!recibido || !evento.signature?.properties?.length) return false;
  const esperado = checksumEvento(evento, secreto);
  // timingSafeEqual: compara sin revelar por el tiempo dónde difieren.
  return (
    recibido.length === esperado.length &&
    timingSafeEqual(Buffer.from(recibido), Buffer.from(esperado))
  );
}
