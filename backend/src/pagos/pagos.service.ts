import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  type OnModuleInit,
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
export class PagosService implements OnModuleInit {
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

  // - wompi:    hay llave pública y secreto de integridad (pagos reales o
  //             sandbox de Wompi).
  // - simulado: PAGOS_SIMULADOS=true y NO hay llaves de Wompi. Una página
  //             propia reemplaza a Wompi (para demos sin cuenta de Wompi).
  // - ninguno:  no se muestra el botón de pagar.
  // Si hay llaves de Wompi, siempre gana Wompi.
  get modo(): 'wompi' | 'simulado' | 'ninguno' {
    if (
      this.valor('WOMPI_PUBLIC_KEY') &&
      this.valor('WOMPI_INTEGRITY_SECRET')
    ) {
      return 'wompi';
    }
    return this.valor('PAGOS_SIMULADOS').toLowerCase() === 'true'
      ? 'simulado'
      : 'ninguno';
  }

  get habilitado(): boolean {
    return this.modo !== 'ninguno';
  }

  onModuleInit() {
    if (this.modo === 'simulado') {
      this.logger.warn(
        'PAGOS SIMULADOS ACTIVOS: las reservas se confirman sin dinero real. ' +
          'Solo para pruebas y demos; no usar en producción.',
      );
    }
  }

  // Lo usa el frontend para mostrar (o no) el botón de pagar.
  configuracion() {
    return {
      habilitado: this.habilitado,
      // pub_test_ = sandbox de Wompi: se muestran sus datos de prueba.
      sandbox:
        this.modo === 'wompi' &&
        this.valor('WOMPI_PUBLIC_KEY').startsWith('pub_test_'),
      simulado: this.modo === 'simulado',
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

    // Modo simulado: en vez de Wompi, la página propia de pago simulado.
    if (this.modo === 'simulado') {
      return {
        url: `/#/pago-simulado/${referencia}`,
        referencia,
        totalCop: reserva.totalCop,
        expiraEn: reserva.expiraEn,
      };
    }

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

  // --- Modo simulado (solo con PAGOS_SIMULADOS=true y sin llaves de Wompi) ---

  private intentoSimulado(referencia: string) {
    if (this.modo !== 'simulado') {
      // Si el modo no está activo, estas rutas "no existen".
      throw new NotFoundException();
    }
    return this.intentos.findOne({
      where: { referencia },
      relations: { reserva: { experiencia: true } },
    });
  }

  // Datos para la página de pago simulado.
  async detalleSimulado(referencia: string) {
    const intento = await this.intentoSimulado(referencia);
    if (!intento) throw new NotFoundException('Pago no encontrado');
    return {
      referencia,
      reservaId: intento.reservaId,
      totalCop: intento.montoCentavos / 100,
      experiencia: intento.reserva.experiencia,
      fecha: intento.reserva.fecha,
      personas: intento.reserva.personas,
      expiraEn: intento.reserva.expiraEn,
    };
  }

  // Imita lo que haría Wompi y aplica el resultado por el MISMO camino que
  // el webhook y el retorno reales (validación de monto, pago tardío, etc.).
  async simularPago(referencia: string, estado: 'APPROVED' | 'DECLINED') {
    const intento = await this.intentoSimulado(referencia);
    if (!intento) throw new NotFoundException('Pago no encontrado');
    // Como Wompi con expiration-time: un enlace vencido ya no se puede pagar.
    if (intento.reserva.expiraEn <= new Date()) {
      throw new ConflictException({
        motivo: 'ENLACE_VENCIDO',
        message: 'El enlace de pago venció.',
      });
    }
    const resultado = await this.aplicarTransaccion({
      id: `SIM-${randomBytes(6).toString('hex').toUpperCase()}`,
      reference: referencia,
      status: estado,
      amount_in_cents: intento.montoCentavos,
      currency: MONEDA,
      payment_method_type: 'SIMULADO',
    });
    return { resultado, reservaId: intento.reservaId };
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
