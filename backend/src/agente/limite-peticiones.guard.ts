import { Injectable, type ExecutionContext } from '@nestjs/common';
import {
  ThrottlerException,
  ThrottlerGuard,
  type ThrottlerLimitDetail,
} from '@nestjs/throttler';
import { IDIOMAS, type Idioma } from '../faq/catalogos.js';
import { detectarIdioma } from './idioma.js';

// Cada mensaje al agente gasta cuota gratuita del LLM: se limita por IP.
// - 10 por minuto: frena ráfagas (scripts, doble clic repetido).
// - 100 por hora: frena el abuso sostenido.
export const LIMITES_AGENTE = [
  { name: 'minuto', ttl: 60_000, limit: 10 },
  { name: 'hora', ttl: 3_600_000, limit: 100 },
];

const MENSAJES: Record<Idioma, string> = {
  es: 'Has enviado muchos mensajes seguidos. Espera un momento y vuelve a intentarlo; mientras tanto puedes explorar el catálogo.',
  en: "You've sent a lot of messages in a row. Please wait a moment and try again; meanwhile you can browse the catalog.",
  pt: 'Você enviou muitas mensagens seguidas. Espere um pouco e tente de novo; enquanto isso, pode explorar o catálogo.',
};

// Igual que ThrottlerGuard, pero responde 429 en el idioma del turista.
@Injectable()
export class LimitePeticionesGuard extends ThrottlerGuard {
  protected throwThrottlingException(
    context: ExecutionContext,
    _detalle: ThrottlerLimitDetail,
  ): Promise<void> {
    const cuerpo = (context.switchToHttp().getRequest<{ body?: unknown }>()
      .body ?? {}) as { mensaje?: unknown; idioma?: unknown };
    const idiomaInterfaz = (IDIOMAS as readonly unknown[]).includes(
      cuerpo.idioma,
    )
      ? (cuerpo.idioma as Idioma)
      : 'es';
    const idioma =
      typeof cuerpo.mensaje === 'string'
        ? detectarIdioma(cuerpo.mensaje, idiomaInterfaz)
        : idiomaInterfaz;
    throw new ThrottlerException(MENSAJES[idioma]);
  }
}
