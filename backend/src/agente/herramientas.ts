import { HttpException, Injectable } from '@nestjs/common';
import { CulturalService } from '../cultural/cultural.service.js';
import { ExperienciasService } from '../emprendimientos/experiencias.service.js';
import { INTERESES, type Interes } from '../emprendimientos/intereses.js';
import type { Idioma } from '../faq/catalogos.js';
import { esFechaValida } from '../reservas/fechas.js';
import { EmprendimientosService } from '../emprendimientos/emprendimientos.service.js';
import { CATEGORIAS_FAQ } from '../faq/catalogos.js';
import { FaqService } from '../faq/faq.service.js';
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
    private readonly faq: FaqService,
    private readonly emprendimientos: EmprendimientosService,
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
          'intereses del turista. Sin intereses devuelve una muestra variada ' +
          '(úsala así para preguntas generales como "¿qué se puede hacer?"). ' +
          'Si se da una fecha, solo devuelve las disponibles ese día.',
        parametros: {
          type: 'object',
          properties: { intereses, fecha },
        },
      },
      {
        nombre: 'consultar_informacion_practica',
        descripcion:
          'Información práctica VERIFICADA para el viaje: salud y vacunas, ' +
          'dinero y pagos, clima y ropa, conectividad, frontera y documentos, ' +
          'seguridad, cómo llegar y normas de visita de las comunidades. ' +
          'Úsala SIEMPRE para esos temas en vez de responder de memoria.',
        parametros: {
          type: 'object',
          properties: {
            consulta: {
              type: 'string',
              description: 'La pregunta del turista, con sus palabras clave',
            },
            categoria: { type: 'string', enum: [...CATEGORIAS_FAQ] },
          },
          required: ['consulta'],
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
            // Texto libre: el backend reconoce nombres comunes y
            // autodenominaciones (el LLM no necesita conocerlas).
            lengua: {
              type: 'string',
              description:
                'Nombre de la lengua tal como lo escribió el turista. Si en ' +
                'la conversación ya se habló de una lengua y ahora no menciona ' +
                'otra, usa esa misma. Omítela solo si nunca se mencionó ninguna.',
            },
          },
          required: ['tema'],
        },
      },
    ];
  }

  // mensajesTurista: lo que escribió el turista en esta conversación (el
  // último al final). Solo se usa aquí, en el backend; no va al LLM.
  async ejecutar(
    nombre: string,
    argumentos: Record<string, unknown>,
    idioma: Idioma,
    mensajesTurista: string[] = [],
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
          return await this.contenidoCultural(argumentos, mensajesTurista);
        case 'generar_enlace_pago':
          return this.accesoPago();
        case 'consultar_informacion_practica':
          return await this.informacionPractica(argumentos, idioma);
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
    // Sin intereses ("¿qué se puede hacer?"): muestra variada, una
    // experiencia por emprendimiento.
    const base =
      intereses.length > 0
        ? await this.experiencias.buscarPorIntereses(intereses)
        : [
            ...new Map(
              (await this.experiencias.listar()).map((e) => [
                e.emprendimientoId,
                e,
              ]),
            ).values(),
          ];
    let encontradas = base
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

  // Preguntas frecuentes verificadas + datos de las comunidades nombradas.
  // Es información práctica (no contenido cultural): el LLM la usa para
  // responder, citando la fuente, en vez de responder de memoria.
  private async informacionPractica(
    args: Record<string, unknown>,
    idioma: Idioma,
  ): Promise<ResultadoHerramienta> {
    const consulta = String(args.consulta ?? '').trim();
    const categoria = (CATEGORIAS_FAQ as readonly string[]).includes(
      String(args.categoria),
    )
      ? String(args.categoria)
      : undefined;
    if (!consulta && !categoria) {
      return this.error('Falta la consulta del turista.');
    }
    const sufijo = { es: 'Es', en: 'En', pt: 'Pt' } as const;
    const [preguntas, comunidades] = await Promise.all([
      this.faq.buscar(consulta, categoria),
      this.emprendimientos.comunidadesMencionadas(consulta),
    ]);
    if (preguntas.length === 0 && comunidades.length === 0) {
      return {
        paraModelo: {
          encontrado: false,
          mensaje:
            'No hay información verificada sobre eso. Dilo con honestidad y ' +
            'no inventes datos (salud, requisitos o precios cambian).',
        },
        tarjetas: [],
      };
    }
    return {
      paraModelo: {
        encontrado: true,
        preguntasFrecuentes: preguntas.map((p) => ({
          pregunta: p[`pregunta${sufijo[idioma]}`] ?? p.preguntaEs,
          respuesta: p[`respuesta${sufijo[idioma]}`] ?? p.respuestaEs,
          fuente: p.fuente,
          revisadoEl: p.fechaRevision,
        })),
        // Estos datos solo existen en español en el Excel.
        comunidades: comunidades.map((c) => ({
          nombre: c.nombre,
          ubicacion: c.referenciaUbicacion,
          comoLlegar: c.comoLlegar,
          normasDeVisita: c.normasVisita,
          fuente: c.fuente,
        })),
        nota:
          'Responde solo con esta información, en el idioma del turista, y ' +
          'menciona la fuente. Si no responde exactamente la pregunta, dilo.',
      },
      tarjetas: [],
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
    mensajesTurista: string[],
  ): Promise<ResultadoHerramienta> {
    const tema = normalizar(String(args.tema ?? 'saludo'));

    // Si el LLM no indicó la lengua, se usa la última que nombró el turista
    // en la conversación ("Ahora maloca" después de "…en magüta"). Los LLM no
    // siempre la repiten; esto no depende de ellos. Salvo que pida todas.
    const ultimo = mensajesTurista.at(-1) ?? '';
    const pideTodas = /\b(todas|todos|all|every|todas as)\b/i.test(ultimo);
    if (!args.lengua && !pideTodas) {
      for (const mensaje of [...mensajesTurista].reverse()) {
        const encontrada = await this.cultural.resolverLengua(mensaje);
        if (encontrada) {
          args = { ...args, lengua: encontrada.nombreComun };
          break;
        }
      }
    }

    // La lengua llega como la escribió el turista ("magüta", "huitoto"…):
    // el backend la reconoce. Si no existe, no se muestran fichas de otras
    // lenguas: se le dice al LLM cuáles hay.
    let lengua: { id: string; nombreComun: string } | null = null;
    if (args.lengua) {
      lengua = await this.cultural.resolverLengua(String(args.lengua));
      if (!lengua) {
        return {
          paraModelo: {
            mostradas: 0,
            mensaje:
              `No reconozco la lengua "${String(args.lengua)}". Lenguas con ` +
              `contenido: ${(await this.cultural.nombresDeLenguas()).join(', ')}.`,
          },
          tarjetas: [],
        };
      }
    }
    const lenguaId = lengua?.id;

    let fichas = await this.cultural.listar({ lenguaId, tema });
    if (fichas.length === 0 && tema === 'saludo') {
      fichas = await this.cultural.listar({ lenguaId, tipo: 'saludo' });
    }

    if (fichas.length === 0) {
      // Qué SÍ hay en esa lengua, y en qué otras lenguas está esa palabra,
      // para ofrecer alternativas en vez de inventar.
      const temas = lengua ? await this.cultural.temasDeLengua(lengua.id) : [];
      const enOtrasLenguas = lengua
        ? [
            ...new Set(
              (await this.cultural.listar({ tema })).map(
                (f) => f.lengua.nombreComun,
              ),
            ),
          ]
        : [];
      return {
        paraModelo: {
          mostradas: 0,
          tema,
          ...(lengua && { lengua: lengua.nombreComun }),
          ...(enOtrasLenguas.length > 0 && { enOtrasLenguas }),
          mensaje:
            lengua && temas.length === 0
              ? `${lengua.nombreComun}: contenido en proceso de validación con la comunidad.`
              : `No hay una ficha verificada de "${tema}"` +
                (lengua ? ` en ${lengua.nombreComun}.` : '.') +
                ' No inventes palabras.',
          ...(temas.length > 0 && { temasDisponibles: temas }),
        },
        tarjetas: [],
      };
    }
    return {
      paraModelo: {
        mostradas: fichas.length,
        tema,
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
