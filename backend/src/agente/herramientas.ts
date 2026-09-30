import { HttpException, Injectable } from '@nestjs/common';
import { CulturalService } from '../cultural/cultural.service.js';
import { ExperienciasService } from '../emprendimientos/experiencias.service.js';
import { INTERESES, type Interes } from '../emprendimientos/intereses.js';
import type { Idioma } from '../faq/catalogos.js';
import { esFechaValida } from '../reservas/fechas.js';
import { PagosService } from '../pagos/pagos.service.js';
import { ReservasService } from '../reservas/reservas.service.js';
import type { DefinicionHerramienta } from './providers/llm-provider.interface.js';
import {
  resumirExperiencia,
  type ResumenExperiencia,
  type Tarjeta,
} from './tarjetas.js';

// Lo que devuelve cada herramienta:
// - paraModelo: lo mínimo que el LLM necesita para responder;
// - tarjetas: datos completos que van directo al frontend (no al LLM).
export interface ResultadoHerramienta {
  paraModelo: unknown;
  tarjetas: Tarjeta[];
}

// Nombre de la lengua (como lo diría el turista o el LLM) -> código.
const CODIGOS_LENGUA: Record<string, string> = {
  tikuna: 'L-TIK',
  ticuna: 'L-TIK',
  murui: 'L-MUR',
  huitoto: 'L-MUR',
  uitoto: 'L-MUR',
  witoto: 'L-MUR',
  yagua: 'L-YAG',
  mirana: 'L-MIR',
  bora: 'L-BOR',
};

const MAX_RESULTADOS = 5;

const normalizar = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_');

@Injectable()
export class HerramientasAgente {
  constructor(
    private readonly experiencias: ExperienciasService,
    private readonly cultural: CulturalService,
    private readonly reservas: ReservasService,
    private readonly pagos: PagosService,
  ) {}

  // Definiciones que se envían al LLM (JSON Schema). Los temas culturales se
  // consultan en la base para que el LLM pida uno que exista.
  async definiciones(): Promise<DefinicionHerramienta[]> {
    const temas = await this.cultural.temasDisponibles();
    const fecha = {
      type: 'string',
      description: 'Fecha en formato AAAA-MM-DD',
    };
    const intereses = {
      type: 'array',
      items: { type: 'string', enum: [...INTERESES] },
      description: 'Intereses del turista',
    };
    return [
      {
        nombre: 'buscar_experiencias',
        descripcion:
          'Busca experiencias turísticas de emprendimientos locales según los ' +
          'intereses del turista. Si se da una fecha, solo devuelve las ' +
          'disponibles ese día.',
        parametros: {
          type: 'object',
          properties: { intereses, fecha },
          required: ['intereses'],
        },
      },
      {
        nombre: 'consultar_disponibilidad',
        descripcion:
          'Consulta si una experiencia tiene cupos en una fecha y cuántos.',
        parametros: {
          type: 'object',
          properties: {
            experienciaId: { type: 'string', description: 'Ej. EXP-01' },
            fecha,
          },
          required: ['experienciaId', 'fecha'],
        },
      },
      {
        nombre: 'armar_itinerario',
        descripcion:
          'Arma un itinerario de varios días con experiencias según los ' +
          'intereses (máximo 2 por día: una en la mañana y otra en la tarde).',
        parametros: {
          type: 'object',
          properties: {
            intereses,
            dias: { type: 'integer', minimum: 1, maximum: 7 },
          },
          required: ['intereses', 'dias'],
        },
      },
      {
        nombre: 'crear_reserva',
        descripcion:
          'Inicia la reserva de una experiencia: revisa cupos y muestra al ' +
          'turista un formulario para sus datos. NO pidas nombre, email ni ' +
          'teléfono en el chat: el formulario se encarga.',
        parametros: {
          type: 'object',
          properties: {
            experienciaId: { type: 'string', description: 'Ej. EXP-01' },
            fecha,
            personas: { type: 'integer', minimum: 1, maximum: 50 },
          },
          required: ['experienciaId', 'fecha', 'personas'],
        },
      },
      {
        nombre: 'generar_enlace_pago',
        descripcion:
          'Muestra al turista el botón para pagar en Wompi (tarjeta, Nequi, ' +
          'PSE) sus reservas pendientes de pago. No necesita parámetros.',
        parametros: { type: 'object', properties: {} },
      },
      {
        nombre: 'obtener_contenido_cultural',
        descripcion:
          'Muestra al turista fichas culturales verificadas (palabras, ' +
          'saludos, pronunciación y audio) en lenguas indígenas, con su ' +
          'fuente. Tú NO recibes el contenido: se muestra directo en ' +
          'tarjetas. Úsala siempre que pregunten por palabras o frases en ' +
          'tikuna, murui (huitoto), yagua, miraña o bora.',
        parametros: {
          type: 'object',
          properties: {
            tema: {
              type: 'string',
              enum: ['saludo', ...temas],
              description: '"saludo" muestra todos los saludos',
            },
            lengua: {
              type: 'string',
              enum: ['tikuna', 'murui', 'yagua', 'miraña', 'bora'],
            },
          },
          required: ['tema'],
        },
      },
    ];
  }

  async ejecutar(
    nombre: string,
    argumentos: Record<string, unknown>,
    idioma: Idioma,
  ): Promise<ResultadoHerramienta> {
    try {
      switch (nombre) {
        case 'buscar_experiencias':
          return await this.buscar(argumentos, idioma);
        case 'consultar_disponibilidad':
          return await this.disponibilidad(argumentos);
        case 'armar_itinerario':
          return await this.itinerario(argumentos, idioma);
        case 'crear_reserva':
          return await this.iniciarReserva(argumentos, idioma);
        case 'obtener_contenido_cultural':
          return await this.contenidoCultural(argumentos);
        case 'generar_enlace_pago':
          return this.accesoPago();
        default:
          return this.error(`La herramienta "${nombre}" no existe.`);
      }
    } catch (error) {
      // Errores esperados (404, 400…) se le explican al LLM; los demás suben.
      if (error instanceof HttpException) return this.error(error.message);
      throw error;
    }
  }

  private error(mensaje: string): ResultadoHerramienta {
    return { paraModelo: { error: mensaje }, tarjetas: [] };
  }

  // --- Validación de argumentos (el LLM puede equivocarse) ---

  private leerIntereses(valor: unknown): Interes[] {
    const lista = Array.isArray(valor) ? valor : [valor];
    return lista
      .map((v) => normalizar(String(v ?? '')))
      .filter((v): v is Interes =>
        (INTERESES as readonly string[]).includes(v),
      );
  }

  private leerFecha(valor: unknown): string | null {
    const fecha = typeof valor === 'string' ? valor.trim() : '';
    return esFechaValida(fecha) ? fecha : null;
  }

  // Resumen compacto para el LLM (sin coordenadas ni descripciones largas).
  private paraLlm(e: ResumenExperiencia) {
    return {
      id: e.id,
      nombre: e.nombre,
      emprendimiento: e.emprendimiento,
      comunidad: e.comunidad,
      precioCop: e.precioCop,
      duracionHoras: e.duracionMinutos === null ? null : e.duracionMinutos / 60,
      horaSalida: e.horaSalida,
      dias: e.diasOperacion,
      intereses: e.intereses,
    };
  }

  // --- Herramientas ---

  private async buscar(
    args: Record<string, unknown>,
    idioma: Idioma,
  ): Promise<ResultadoHerramienta> {
    const intereses = this.leerIntereses(args.intereses);
    if (intereses.length === 0) {
      return this.error(`Intereses válidos: ${INTERESES.join(', ')}`);
    }
    let encontradas = (await this.experiencias.buscarPorIntereses(intereses))
      // Primero las que coinciden con más intereses.
      .map((e) => ({
        e,
        coincidencias: e.intereses.filter((i) => intereses.includes(i)).length,
      }))
      .sort((a, b) => b.coincidencias - a.coincidencias)
      .map(({ e }) => e);

    const fecha = args.fecha === undefined ? null : this.leerFecha(args.fecha);
    if (args.fecha !== undefined && fecha === null) {
      return this.error('La fecha debe tener formato AAAA-MM-DD.');
    }
    let noDisponibles = 0;
    if (fecha) {
      const disponibles = [];
      for (const e of encontradas) {
        const d = await this.reservas.consultarDisponibilidad(e.id, fecha);
        if (d.disponible) disponibles.push(e);
        else noDisponibles++;
      }
      encontradas = disponibles;
    }

    const resumenes = encontradas
      .slice(0, MAX_RESULTADOS)
      .map((e) => resumirExperiencia(e, idioma));
    return {
      paraModelo: {
        experiencias: resumenes.map((r) => this.paraLlm(r)),
        ...(fecha && { fecha, noDisponiblesEseDia: noDisponibles }),
        nota: 'Las experiencias ya se muestran al turista en tarjetas.',
      },
      tarjetas: resumenes.map((experiencia): Tarjeta => ({
        tipo: 'experiencia',
        experiencia,
      })),
    };
  }

  private async disponibilidad(
    args: Record<string, unknown>,
  ): Promise<ResultadoHerramienta> {
    const fecha = this.leerFecha(args.fecha);
    if (!fecha) return this.error('La fecha debe tener formato AAAA-MM-DD.');
    const id = String(args.experienciaId ?? '').toUpperCase();
    const disponibilidad = await this.reservas.consultarDisponibilidad(
      id,
      fecha,
    );
    return {
      paraModelo: {
        disponible: disponibilidad.disponible,
        cuposLibres: disponibilidad.cuposLibres,
        motivo: disponibilidad.motivo,
        mensaje: disponibilidad.mensaje,
        precioCop: disponibilidad.precioCop,
        horaSalida: disponibilidad.horaSalida,
      },
      tarjetas: [{ tipo: 'disponibilidad', disponibilidad } as Tarjeta],
    };
  }

  private async itinerario(
    args: Record<string, unknown>,
    idioma: Idioma,
  ): Promise<ResultadoHerramienta> {
    const dias = Math.min(Math.max(Math.trunc(Number(args.dias) || 1), 1), 7);
    const intereses = this.leerIntereses(args.intereses);
    const candidatas = (await this.experiencias.buscarPorIntereses(intereses))
      .filter((e) => e.precioCop !== null && e.capacidad !== null)
      .map((e) => ({
        e,
        coincidencias: e.intereses.filter((i) => intereses.includes(i)).length,
      }))
      .sort((a, b) => b.coincidencias - a.coincidencias)
      .map(({ e }) => resumirExperiencia(e, idioma));

    // Mañana = sale antes de las 12:00. Tarde = desde las 12:00.
    const manana = candidatas.filter(
      (e) => (e.horaSalida ?? '00:00') < '12:00',
    );
    const tarde = candidatas.filter(
      (e) => (e.horaSalida ?? '00:00') >= '12:00',
    );
    const plan = Array.from({ length: dias }, (_, i) => ({
      dia: i + 1,
      experiencias: [manana[i], tarde[i]].filter(
        (e): e is ResumenExperiencia => e !== undefined,
      ),
    })).filter((d) => d.experiencias.length > 0);

    return {
      paraModelo: {
        dias: plan.map((d) => ({
          dia: d.dia,
          experiencias: d.experiencias.map((e) => this.paraLlm(e)),
        })),
        nota: 'El itinerario ya se muestra al turista en una tarjeta.',
      },
      tarjetas: plan.length
        ? [{ tipo: 'itinerario', dias: plan } as Tarjeta]
        : [],
    };
  }

  // No crea la reserva: muestra un formulario para que el turista escriba sus
  // datos fuera del chat (regla 3). El formulario llama a POST /api/reservas.
  private async iniciarReserva(
    args: Record<string, unknown>,
    idioma: Idioma,
  ): Promise<ResultadoHerramienta> {
    const fecha = this.leerFecha(args.fecha);
    if (!fecha) return this.error('La fecha debe tener formato AAAA-MM-DD.');
    const id = String(args.experienciaId ?? '').toUpperCase();
    const personas = Math.trunc(Number(args.personas));
    if (!Number.isInteger(personas) || personas < 1 || personas > 50) {
      return this.error('personas debe ser un número entre 1 y 50.');
    }

    const disponibilidad = await this.reservas.consultarDisponibilidad(
      id,
      fecha,
    );
    if (!disponibilidad.disponible || personas > disponibilidad.cuposLibres) {
      return {
        paraModelo: {
          formularioMostrado: false,
          motivo: disponibilidad.motivo ?? 'SIN_CUPOS',
          mensaje:
            disponibilidad.mensaje ??
            `Solo quedan ${disponibilidad.cuposLibres} cupos.`,
          cuposLibres: disponibilidad.cuposLibres,
        },
        tarjetas: [{ tipo: 'disponibilidad', disponibilidad } as Tarjeta],
      };
    }

    const experiencia = await this.experiencias.obtenerPorId(id);
    const totalCop = personas * disponibilidad.precioCop!;
    return {
      paraModelo: {
        formularioMostrado: true,
        totalCop,
        nota:
          'Se mostró el formulario. El turista escribe sus datos allí; el ' +
          `cupo queda apartado 15 minutos al enviarlo. No pidas sus datos.`,
      },
      tarjetas: [
        {
          tipo: 'formulario_reserva',
          experiencia: resumirExperiencia(experiencia, idioma),
          fecha,
          personas,
          cuposLibres: disponibilidad.cuposLibres,
          totalCop,
        },
      ],
    };
  }

  // No recibe el id de la reserva: el frontend muestra las reservas pendientes
  // de ese teléfono con su botón de pago. Así el id (que sirve como clave de
  // la reserva) tampoco pasa por el LLM.
  private accesoPago(): ResultadoHerramienta {
    if (!this.pagos.habilitado) {
      return {
        paraModelo: {
          disponible: false,
          mensaje:
            'El pago en línea aún no está disponible. La reserva queda ' +
            'apartada 15 minutos; el emprendimiento contactará al turista.',
        },
        tarjetas: [],
      };
    }
    return {
      paraModelo: {
        mostrado: true,
        nota:
          'Se mostró al turista el botón para pagar en Wompi sus reservas ' +
          'pendientes. No pidas datos de tarjeta ni de cuentas en el chat.',
      },
      tarjetas: [{ tipo: 'pago' }],
    };
  }

  // Regla 2: las fichas van al frontend; el LLM solo recibe una referencia.
  private async contenidoCultural(
    args: Record<string, unknown>,
  ): Promise<ResultadoHerramienta> {
    const tema = normalizar(String(args.tema ?? 'saludo'));
    const lenguaTexto = args.lengua ? normalizar(String(args.lengua)) : null;
    const lenguaId = lenguaTexto
      ? (CODIGOS_LENGUA[lenguaTexto] ?? lenguaTexto.toUpperCase())
      : undefined;

    let fichas = await this.cultural.listar({ lenguaId, tema });
    if (fichas.length === 0 && tema === 'saludo') {
      fichas = await this.cultural.listar({ lenguaId, tipo: 'saludo' });
    }

    if (fichas.length === 0) {
      return {
        paraModelo: {
          mostradas: 0,
          mensaje:
            'No hay fichas verificadas para eso. Si es yagua, está en ' +
            'proceso de validación con la comunidad. No inventes palabras.',
        },
        tarjetas: [],
      };
    }
    return {
      paraModelo: {
        mostradas: fichas.length,
        ids: fichas.map((f) => f.id),
        lenguas: [...new Set(fichas.map((f) => f.lengua.nombreComun))],
        nota:
          'Las fichas ya se muestran al turista con su fuente. No escribas, ' +
          'repitas ni traduzcas palabras en lenguas indígenas.',
      },
      tarjetas: fichas.map((ficha): Tarjeta => ({
        tipo: 'ficha_cultural',
        ficha,
      })),
    };
  }
}
