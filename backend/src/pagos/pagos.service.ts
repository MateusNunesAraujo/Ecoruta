import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'node:crypto';
import { Repository } from 'typeorm';
import { Reserva } from '../reservas/reserva.entity.js';
import { ReservasService } from '../reservas/reservas.service.js';
import { IntentoPago } from './intento-pago.entity.js';
import {
  eventoValido,
  firmaIntegridad,
  urlCheckout,
  type EventoWompi,
  type TransaccionWompi,
} from './wompi.js';

const MONEDA = 'COP';

@Injectable()
export class PagosService {
  private readonly logger = new Logger(PagosService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly reservas: ReservasService,
    @InjectRepository(IntentoPago)
    private readonly intentos: Repository<IntentoPago>,
    @InjectRepository(Reserva)
    private readonly reservasRepo: Repository<Reserva>,
  ) {}

  private valor(clave: string): string {
    return this.config.get<string>(clave, '').trim();
  }

  // Sin llave pública y secreto de integridad no se pueden crear enlaces.
  get habilitado(): boolean {
    return Boolean(
      this.valor('WOMPI_PUBLIC_KEY') && this.valor('WOMPI_INTEGRITY_SECRET'),
    );
  }

  // Lo usa el frontend para mostrar (o no) el botón de pagar.
  configuracion() {
    return {
      habilitado: this.habilitado,
      // pub_test_ = sandbox: se muestran los datos de prueba.
      sandbox: this.valor('WOMPI_PUBLIC_KEY').startsWith('pub_test_'),
    };
  }

  // Crea un intento de pago y devuelve la URL del Web Checkout de Wompi.
  async crearEnlace(reservaId: string) {
    if (!this.habilitado) {
      throw new ServiceUnavailableException(
        'Los pagos en línea no están configurados.',
      );
    }
    // emailTurista tiene select: false; aquí se pide explícitamente porque
    // Wompi lo usa para no pedírselo de nuevo al turista.
    const reserva = await this.reservasRepo
      .createQueryBuilder('r')
      .addSelect('r.emailTurista')
      .where('r.id = :id', { id: reservaId })
      .getOne();
    if (!reserva) {
      throw new NotFoundException(`No existe la reserva ${reservaId}`);
    }
    if (reserva.estado !== 'PENDIENTE_PAGO' || reserva.expiraEn <= new Date()) {
      throw new ConflictException({
        motivo: 'NO_PAGABLE',
        message: 'Esta reserva ya no está pendiente de pago.',
      });
    }

    const referencia =
      `ECR-${Date.now().toString(36)}-${randomBytes(4).toString('hex')}`.toUpperCase();
    const montoCentavos = reserva.totalCop * 100;
    // El enlace vence cuando vence el cupo apartado.
    const expiracion = reserva.expiraEn.toISOString();

    await this.intentos.save(
      this.intentos.create({ reservaId, referencia, montoCentavos }),
    );

    const urlPublica =
      this.valor('URL_PUBLICA') ||
      `http://localhost:${this.valor('PORT') || 3000}`;
    const url = urlCheckout({
      llavePublica: this.valor('WOMPI_PUBLIC_KEY'),
      referencia,
      montoCentavos,
      moneda: MONEDA,
      expiracion,
      firma: firmaIntegridad({
        referencia,
        montoCentavos,
        moneda: MONEDA,
        expiracion,
        secreto: this.valor('WOMPI_INTEGRITY_SECRET'),
      }),
      // Wompi agrega "?id=<transacción>" al volver.
      urlRetorno: `${urlPublica.replace(/\/$/, '')}/api/pagos/retorno/${reservaId}`,
      email: reserva.emailTurista,
      nombre: reserva.nombreTurista,
    });
    return {
      url,
      referencia,
      totalCop: reserva.totalCop,
      expiraEn: reserva.expiraEn,
    };
  }

  // Webhook: Wompi avisa que una transacción cambió de estado.
  async procesarEvento(evento: EventoWompi, checksumCabecera?: string) {
    const secreto = this.valor('WOMPI_EVENTS_SECRET');
    if (!secreto || !eventoValido(evento, secreto, checksumCabecera)) {
      this.logger.warn('Evento de Wompi con firma inválida: ignorado');
      throw new UnauthorizedException('Firma inválida');
    }
    if (evento.event !== 'transaction.updated' || !evento.data.transaction) {
      return { recibido: true };
    }
    await this.aplicarTransaccion(evento.data.transaction);
    return { recibido: true };
  }

  // Retorno: el turista vuelve de Wompi con ?id=<transacción>. No se confía
  // en el navegador: se consulta la transacción directamente a Wompi.
  // Así el pago se confirma aunque el webhook no llegue (ej. en local).
  async procesarRetorno(reservaId: string, transaccionId: string) {
    let transaccion: TransaccionWompi | undefined;
    try {
      const api = this.valor('WOMPI_API_URL') || 'https://sandbox.wompi.co/v1';
      const respuesta = await fetch(
        `${api}/transactions/${encodeURIComponent(transaccionId)}`,
        { signal: AbortSignal.timeout(15_000) },
      );
      if (respuesta.ok) {
        transaccion = ((await respuesta.json()) as { data?: TransaccionWompi })
          .data;
      }
    } catch (error) {
      this.logger.warn(`No se pudo consultar la transacción: ${String(error)}`);
    }
    if (!transaccion) return 'DESCONOCIDO';

    const intento = await this.intentos.findOneBy({
      referencia: transaccion.reference,
    });
    // La transacción debe ser de un intento de ESTA reserva.
    if (intento?.reservaId !== reservaId) return 'DESCONOCIDO';
    return this.aplicarTransaccion(transaccion);
  }

  // Aplica el estado de una transacción de Wompi (webhook o retorno).
  // Devuelve lo que vio el turista: APPROVED, DECLINED, SIN_CUPO, etc.
  private async aplicarTransaccion(tx: TransaccionWompi): Promise<string> {
    const intento = await this.intentos.findOneBy({ referencia: tx.reference });
    if (!intento) {
      this.logger.warn(
        `Transacción con referencia desconocida: ${tx.reference}`,
      );
      return 'DESCONOCIDO';
    }
    // El monto y la moneda deben ser los que firmamos.
    if (
      tx.amount_in_cents !== intento.montoCentavos ||
      tx.currency !== MONEDA
    ) {
      this.logger.warn(`Monto o moneda no coinciden en ${tx.reference}`);
      return 'DESCONOCIDO';
    }

    intento.estadoWompi = tx.status;
    intento.transaccionId = tx.id;
    intento.metodo = tx.payment_method_type ?? null;

    if (tx.status === 'APPROVED' && !intento.resultado) {
      const resultado = await this.reservas.confirmarPago(intento.reservaId);
      intento.resultado =
        resultado === 'SIN_CUPO' ? 'REQUIERE_REEMBOLSO' : 'CONFIRMADA';
      if (resultado === 'SIN_CUPO') {
        this.logger.warn(
          `Pago aprobado tarde y sin cupo: reembolsar ${tx.reference} (reserva ${intento.reservaId})`,
        );
      }
    }
    await this.intentos.save(intento);
    if (intento.resultado === 'REQUIERE_REEMBOLSO') return 'SIN_CUPO';
    return tx.status;
  }
}
