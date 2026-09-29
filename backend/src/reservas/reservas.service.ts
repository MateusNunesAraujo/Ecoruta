import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, LessThanOrEqual, type EntityManager } from 'typeorm';
import { Experiencia } from '../emprendimientos/experiencia.entity.js';
import { FechaBloqueada } from '../emprendimientos/fecha-bloqueada.entity.js';
import type { CrearReservaDto } from './crear-reserva.dto.js';
import { ahoraEnColombia, diaDeLaSemana, esFechaValida } from './fechas.js';
import { MINUTOS_PARA_PAGAR, Reserva } from './reserva.entity.js';

// Por qué no se puede reservar. El frontend traduce el código a es/en/pt.
export type MotivoNoDisponible =
  | 'NO_RESERVABLE' // la experiencia no tiene capacidad o precio
  | 'FECHA_PASADA'
  | 'YA_SALIO' // es hoy y ya pasó la hora de salida
  | 'DIA_NO_OPERA'
  | 'FECHA_BLOQUEADA'
  | 'SIN_CUPOS';

export interface Disponibilidad {
  experienciaId: string;
  fecha: string;
  disponible: boolean;
  motivo: MotivoNoDisponible | null;
  mensaje: string | null;
  capacidad: number | null;
  ocupados: number;
  cuposLibres: number;
  precioCop: number | null;
  horaSalida: string | null;
}

@Injectable()
export class ReservasService {
  private readonly logger = new Logger(ReservasService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  // Personas que ocupan cupo en esa fecha: CONFIRMADA + PENDIENTE_PAGO que
  // todavía no vencen. Una pendiente vencida libera el cupo en ese mismo
  // instante, aunque la tarea programada aún no la haya marcado EXPIRADA.
  private async cuposOcupados(
    manager: EntityManager,
    experienciaId: string,
    fecha: string,
  ): Promise<number> {
    const fila = await manager
      .createQueryBuilder(Reserva, 'r')
      .select('COALESCE(SUM(r.personas), 0)', 'ocupados')
      .where('r.experienciaId = :experienciaId', { experienciaId })
      .andWhere('r.fecha = :fecha', { fecha })
      .andWhere(
        "(r.estado = 'CONFIRMADA' OR (r.estado = 'PENDIENTE_PAGO' AND r.expiraEn > now()))",
      )
      .getRawOne<{ ocupados: string }>();
    return Number(fila?.ocupados ?? 0);
  }

  // Revisa, en orden, todo lo que impide reservar esa fecha.
  private async evaluar(
    manager: EntityManager,
    experiencia: Experiencia,
    fecha: string,
  ): Promise<Disponibilidad> {
    const base = {
      experienciaId: experiencia.id,
      fecha,
      capacidad: experiencia.capacidad,
      precioCop: experiencia.precioCop,
      horaSalida: experiencia.horaSalida,
    };
    const noDisponible = (
      motivo: MotivoNoDisponible,
      mensaje: string,
      ocupados = 0,
    ): Disponibilidad => ({
      ...base,
      disponible: false,
      motivo,
      mensaje,
      ocupados,
      cuposLibres: 0,
    });

    if (experiencia.capacidad === null || experiencia.precioCop === null) {
      return noDisponible(
        'NO_RESERVABLE',
        'Esta experiencia todavía no tiene capacidad o precio definidos.',
      );
    }

    const ahora = ahoraEnColombia();
    if (fecha < ahora.fecha) {
      return noDisponible('FECHA_PASADA', 'La fecha ya pasó.');
    }
    if (
      fecha === ahora.fecha &&
      experiencia.horaSalida !== null &&
      experiencia.horaSalida <= ahora.hora
    ) {
      return noDisponible(
        'YA_SALIO',
        `Hoy ya pasó la hora de salida (${experiencia.horaSalida}).`,
      );
    }

    const dia = diaDeLaSemana(fecha);
    if (!experiencia.diasOperacion.includes(dia)) {
      return noDisponible(
        'DIA_NO_OPERA',
        `No opera ese día (${dia}). Días: ${experiencia.diasOperacion.join(', ')}.`,
      );
    }

    const bloqueada = await manager.existsBy(FechaBloqueada, {
      experienciaId: experiencia.id,
      fecha,
    });
    if (bloqueada) {
      return noDisponible('FECHA_BLOQUEADA', 'Esa fecha no está disponible.');
    }

    const ocupados = await this.cuposOcupados(manager, experiencia.id, fecha);
    const cuposLibres = Math.max(experiencia.capacidad - ocupados, 0);
    if (cuposLibres === 0) {
      return noDisponible(
        'SIN_CUPOS',
        'No quedan cupos para esa fecha.',
        ocupados,
      );
    }
    return {
      ...base,
      disponible: true,
      motivo: null,
      mensaje: null,
      ocupados,
      cuposLibres,
    };
  }

  private validarFecha(fecha: string) {
    if (!esFechaValida(fecha)) {
      throw new BadRequestException(
        'fecha debe ser una fecha real (AAAA-MM-DD)',
      );
    }
  }

  async consultarDisponibilidad(experienciaId: string, fecha: string) {
    this.validarFecha(fecha);
    const experiencia = await this.dataSource.manager.findOneBy(Experiencia, {
      id: experienciaId,
    });
    if (!experiencia) {
      throw new NotFoundException(`No existe la experiencia ${experienciaId}`);
    }
    return this.evaluar(this.dataSource.manager, experiencia, fecha);
  }

  // Crea la reserva en PENDIENTE_PAGO sin sobreventa.
  async crear(dto: CrearReservaDto) {
    this.validarFecha(dto.fecha);
    const experienciaId = dto.experienciaId.toUpperCase();

    const id = await this.dataSource.transaction(async (manager) => {
      // Bloquea la fila de la experiencia (SELECT … FOR UPDATE). Si otra
      // reserva de la misma experiencia llega al mismo tiempo, PostgreSQL la
      // hace esperar hasta que esta transacción termine; así la segunda
      // cuenta los cupos con esta reserva ya guardada.
      const experiencia = await manager.findOne(Experiencia, {
        where: { id: experienciaId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!experiencia) {
        throw new NotFoundException(
          `No existe la experiencia ${experienciaId}`,
        );
      }

      const disponibilidad = await this.evaluar(
        manager,
        experiencia,
        dto.fecha,
      );
      if (!disponibilidad.disponible) {
        throw new ConflictException({
          motivo: disponibilidad.motivo,
          message: disponibilidad.mensaje,
        });
      }
      if (dto.personas > disponibilidad.cuposLibres) {
        throw new ConflictException({
          motivo: 'SIN_CUPOS',
          message: `Solo quedan ${disponibilidad.cuposLibres} cupos para esa fecha.`,
          cuposLibres: disponibilidad.cuposLibres,
        });
      }

      const precio = experiencia.precioCop!;
      const reserva = manager.create(Reserva, {
        experienciaId,
        fecha: dto.fecha,
        personas: dto.personas,
        precioUnitarioCop: precio,
        totalCop: precio * dto.personas,
        estado: 'PENDIENTE_PAGO',
        expiraEn: new Date(Date.now() + MINUTOS_PARA_PAGAR * 60_000),
        nombreTurista: dto.nombre.trim(),
        emailTurista: dto.email.trim().toLowerCase(),
        telefonoTurista: dto.telefono?.trim() || null,
        idioma: dto.idioma,
      });
      await manager.save(reserva);
      return reserva.id;
    });

    return this.obtener(id);
  }

  // Devuelve la reserva sin email ni teléfono (select: false en la entity).
  async obtener(id: string) {
    const reserva = await this.dataSource.manager.findOne(Reserva, {
      where: { id },
      relations: { experiencia: true },
    });
    if (!reserva) {
      throw new NotFoundException(`No existe la reserva ${id}`);
    }
    // Si venció y la tarea programada aún no pasó, se marca ahora.
    if (reserva.estado === 'PENDIENTE_PAGO' && reserva.expiraEn <= new Date()) {
      await this.dataSource.manager.update(
        Reserva,
        { id, estado: 'PENDIENTE_PAGO' },
        { estado: 'EXPIRADA' },
      );
      reserva.estado = 'EXPIRADA';
    }
    return reserva;
  }

  async cancelar(id: string) {
    const reserva = await this.obtener(id);
    switch (reserva.estado) {
      case 'PENDIENTE_PAGO': {
        // La condición sobre el estado evita cancelar una reserva que se
        // confirmó justo en este instante.
        const resultado = await this.dataSource.manager.update(
          Reserva,
          { id, estado: 'PENDIENTE_PAGO' },
          { estado: 'CANCELADA' },
        );
        if (resultado.affected === 0) {
          throw new ConflictException(
            'La reserva cambió de estado; consúltala de nuevo.',
          );
        }
        return this.obtener(id);
      }
      case 'CONFIRMADA':
        // Ya está pagada: cancelar implica reembolso según la política del
        // emprendimiento (Bloque 6).
        throw new ConflictException(
          'La reserva ya está pagada. Para cancelarla, contacta al ' +
            `emprendimiento. Política: ${reserva.experiencia.cancelacion ?? 'no indicada'}.`,
        );
      default:
        throw new ConflictException(
          `La reserva ya está ${reserva.estado.toLowerCase()}.`,
        );
    }
  }

  // Cada minuto: las PENDIENTE_PAGO vencidas pasan a EXPIRADA.
  @Cron(CronExpression.EVERY_MINUTE)
  async expirarVencidas() {
    const resultado = await this.dataSource.manager.update(
      Reserva,
      { estado: 'PENDIENTE_PAGO', expiraEn: LessThanOrEqual(new Date()) },
      { estado: 'EXPIRADA' },
    );
    if (resultado.affected) {
      this.logger.log(`Reservas expiradas: ${resultado.affected}`);
    }
    return resultado.affected ?? 0;
  }
}
