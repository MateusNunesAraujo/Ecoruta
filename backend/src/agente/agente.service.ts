import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Idioma } from '../faq/catalogos.js';
import { ocultarDatosPersonales } from './datos-personales.js';
import { HerramientasAgente } from './herramientas.js';
import { detectarIdioma } from './idioma.js';
import type { MensajeAgenteDto } from './mensaje-agente.dto.js';
import { crearPromptSistema } from './prompt.js';
import {
  ErrorProveedorLlm,
  LLM_PROVIDER,
  type LlmProvider,
  type PeticionLlm,
  type RespuestaLlm,
  type TurnoLlm,
} from './providers/llm-provider.interface.js';
import { MockProvider } from './providers/mock.provider.js';
import type { Tarjeta } from './tarjetas.js';

// Máximo de vueltas "LLM pide herramienta -> backend responde" por mensaje.
const MAX_VUELTAS = 4;
// Mensajes anteriores que se reenvían al LLM (menos texto = menos cuota).
const MAX_HISTORIAL = 10;

const SIN_RESPUESTA: Record<Idioma, string> = {
  es: 'Perdona, no pude completar tu solicitud. ¿Puedes decirlo de otra forma?',
  en: "Sorry, I couldn't complete your request. Could you rephrase it?",
  pt: 'Desculpe, não consegui concluir seu pedido. Pode dizer de outra forma?',
};
const NO_DISPONIBLE: Record<Idioma, string> = {
  es: 'El asistente no está disponible en este momento. Puedes explorar el catálogo mientras tanto.',
  en: 'The assistant is not available right now. You can browse the catalog in the meantime.',
  pt: 'O assistente não está disponível agora. Enquanto isso, você pode explorar o catálogo.',
};

export interface RespuestaAgente {
  idioma: Idioma;
  texto: string;
  tarjetas: Tarjeta[];
  proveedor: string;
}

@Injectable()
export class AgenteService {
  private readonly logger = new Logger(AgenteService.name);

  constructor(
    // Lista en orden de preferencia: si el primero falla, se usa el siguiente.
    @Inject(LLM_PROVIDER) private readonly proveedores: LlmProvider[],
    private readonly herramientas: HerramientasAgente,
  ) {}

  async responder(dto: MensajeAgenteDto): Promise<RespuestaAgente> {
    const idioma = detectarIdioma(dto.mensaje, dto.idioma ?? 'es');

    // Regla 3: emails y teléfonos se ocultan antes de llegar al LLM.
    // Lo que escribió el turista (para herramientas que necesitan contexto,
    // ej. la lengua de la conversación). Se queda en el backend.
    const mensajesTurista = [
      ...(dto.historial ?? [])
        .filter((t) => t.rol === 'usuario')
        .map((t) => t.texto),
      dto.mensaje,
    ];
    const turnos: TurnoLlm[] = [
      ...(dto.historial ?? [])
        .slice(-MAX_HISTORIAL)
        .map((t): TurnoLlm =>
          t.rol === 'usuario'
            ? { tipo: 'usuario', texto: ocultarDatosPersonales(t.texto) }
            : { tipo: 'asistente', texto: t.texto, llamadas: [] },
        ),
      { tipo: 'usuario', texto: ocultarDatosPersonales(dto.mensaje) },
    ];
    const peticion: PeticionLlm = {
      sistema: crearPromptSistema(idioma),
      turnos,
      herramientas: await this.herramientas.definiciones(),
      idioma,
    };

    const tarjetas: Tarjeta[] = [];
    let proveedor: LlmProvider | null = null;

    for (let vuelta = 0; vuelta < MAX_VUELTAS; vuelta++) {
      const intento = await this.generar(peticion, proveedor, idioma);
      proveedor = intento.proveedor;
      const respuesta = intento.respuesta;

      if (respuesta.llamadas.length === 0) {
        return {
          idioma,
          texto: respuesta.texto ?? SIN_RESPUESTA[idioma],
          tarjetas,
          proveedor: proveedor.nombre,
        };
      }

      // El LLM pidió herramientas: se ejecutan y se le devuelven los
      // resultados (solo "paraModelo"; las tarjetas van al frontend).
      turnos.push({
        tipo: 'asistente',
        texto: respuesta.texto,
        llamadas: respuesta.llamadas,
        crudo: respuesta.crudo,
      });
      for (const llamada of respuesta.llamadas) {
        this.logger.log(
          `Herramienta: ${llamada.nombre} ${JSON.stringify(llamada.argumentos)}`,
        );
        const resultado = await this.herramientas.ejecutar(
          llamada.nombre,
          llamada.argumentos,
          idioma,
          mensajesTurista,
        );
        tarjetas.push(...resultado.tarjetas);
        turnos.push({
          tipo: 'resultado',
          llamadaId: llamada.id,
          nombre: llamada.nombre,
          resultado: resultado.paraModelo,
        });
      }
    }

    // Se acabaron las vueltas: se entregan las tarjetas obtenidas.
    return {
      idioma,
      texto: SIN_RESPUESTA[idioma],
      tarjetas,
      proveedor: proveedor?.nombre ?? 'ninguno',
    };
  }

  // Primera vuelta: prueba los proveedores en orden (respaldo). Siguientes
  // vueltas: sigue con el mismo, para no mezclar formatos a mitad de camino
  // (Gemini 3 exige su "firma" en los turnos anteriores). Si ese falla, pasa
  // al Mock, que puede continuar desde el resultado de cualquier herramienta.
  private async generar(
    peticion: PeticionLlm,
    fijo: LlmProvider | null,
    idioma: Idioma,
  ): Promise<{ proveedor: LlmProvider; respuesta: RespuestaLlm }> {
    const candidatos = fijo
      ? [
          fijo,
          ...this.proveedores.filter(
            (p) => p instanceof MockProvider && p !== fijo,
          ),
        ]
      : this.proveedores;
    for (const proveedor of candidatos) {
      try {
        return { proveedor, respuesta: await proveedor.generar(peticion) };
      } catch (error) {
        if (!(error instanceof ErrorProveedorLlm)) throw error;
        this.logger.warn(`Falló ${proveedor.nombre}: ${error.message}`);
      }
    }
    throw new ServiceUnavailableException(NO_DISPONIBLE[idioma]);
  }
}
