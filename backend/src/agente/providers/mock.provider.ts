import type { Idioma } from '../../faq/catalogos.js';
import type {
  LlamadaHerramienta,
  LlmProvider,
  PeticionLlm,
  RespuestaLlm,
} from './llm-provider.interface.js';

// Proveedor de desarrollo: sin red y sin gastar cuota. No es inteligente:
// busca palabras clave, pide herramientas y responde con plantillas. Recorre
// el mismo camino que un LLM real (herramientas -> resultados -> respuesta),
// así el frontend se puede construir y probar sin claves de API.

const sinTildes = (t: string) =>
  t.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

// Palabras (es/en/pt, sin tildes) -> etiqueta de interés.
const PALABRAS_INTERES: Record<string, string[]> = {
  aves: ['ave', 'aves', 'pajaro', 'bird', 'passaro'],
  delfines: ['delfin', 'dolphin', 'boto', 'golfinho'],
  pesca: ['pesca', 'pescar', 'fishing', 'peixe'],
  gastronomia: ['comida', 'gastronom', 'food', 'cocina', 'culinaria'],
  artesanias: ['artesan', 'craft', 'artesanato'],
  plantas_medicinales: ['planta', 'medicinal', 'plant'],
  caminata: [
    'caminata',
    'caminar',
    'hike',
    'hiking',
    'walk',
    'trilha',
    'caminhada',
    'sendero',
  ],
  cultura: ['cultura', 'culture', 'tradicion', 'tradition', 'maloca', 'maloka'],
  fotografia: ['foto', 'photo'],
  navegacion: ['navega', 'bote', 'boat', 'barco', 'canoa'],
  musica_danza: ['musica', 'danza', 'music', 'dance', 'danca'],
  aventura: ['aventura', 'adventure', 'canopy', 'tirolesa'],
  fauna: ['fauna', 'animal', 'wildlife', 'mono', 'monkey', 'macaco'],
};

const LENGUAS = [
  'tikuna',
  'ticuna',
  'murui',
  'huitoto',
  'uitoto',
  'yagua',
  'mirana',
  'bora',
];

const TEMAS: Record<string, string[]> = {
  gracias: ['gracias', 'thank', 'obrigad'],
  hola: ['hola', 'hello', 'hi ', 'ola', 'oi '],
  adios: ['adios', 'bye', 'tchau', 'hasta luego'],
  bienvenido: ['bienvenid', 'welcome', 'bem-vind', 'bem vind'],
};

const PALABRAS_CULTURALES = [
  'palabra',
  'como se dice',
  'decir',
  'lengua',
  'idioma',
  'word',
  'say',
  'language',
  'palavra',
  'como se diz',
  'lingua',
  'saludo',
  'greeting',
  ...LENGUAS,
];

const TEXTOS: Record<string, Record<Idioma, string>> = {
  ayuda: {
    es: 'Hola, soy el asistente de Ecoruta. Cuéntame qué te interesa (aves, delfines, artesanías, cultura…) o pregúntame cómo se saluda en una lengua indígena.',
    en: "Hi, I'm the Ecoruta assistant. Tell me what you're interested in (birds, dolphins, crafts, culture…) or ask me how to greet in an Indigenous language.",
    pt: 'Olá, sou o assistente da Ecoruta. Conte o que te interessa (aves, botos, artesanato, cultura…) ou pergunte como se cumprimenta numa língua indígena.',
  },
  encontradas: {
    es: 'Estas son las experiencias que encontré ({n}). Mira las tarjetas y dime cuál te gusta.',
    en: 'Here are the experiences I found ({n}). Check the cards and tell me which one you like.',
    pt: 'Estas são as experiências que encontrei ({n}). Veja os cartões e diga qual prefere.',
  },
  sinResultados: {
    es: 'No encontré experiencias con eso. ¿Te interesa otra cosa?',
    en: "I couldn't find experiences for that. Are you interested in something else?",
    pt: 'Não encontrei experiências com isso. Tem interesse em outra coisa?',
  },
  cultural: {
    es: 'Te muestro el contenido cultural verificado, con su fuente y comunidad de origen.',
    en: 'Here is the verified cultural content, with its source and community of origin.',
    pt: 'Aqui está o conteúdo cultural verificado, com sua fonte e comunidade de origem.',
  },
  culturalVacio: {
    es: 'Todavía no hay contenido verificado para eso. Estamos validándolo con las comunidades.',
    en: 'There is no verified content for that yet. We are validating it with the communities.',
    pt: 'Ainda não há conteúdo verificado para isso. Estamos validando com as comunidades.',
  },
  itinerario: {
    es: 'Te propongo este itinerario. Puedes reservar cada experiencia desde su tarjeta.',
    en: 'Here is a suggested itinerary. You can book each experience from its card.',
    pt: 'Sugiro este roteiro. Você pode reservar cada experiência pelo cartão.',
  },
  formulario: {
    es: 'Completa tus datos en el formulario para apartar el cupo por 15 minutos.',
    en: 'Fill in your details in the form to hold your spot for 15 minutes.',
    pt: 'Preencha seus dados no formulário para reservar a vaga por 15 minutos.',
  },
  noDisponible: {
    es: 'No hay disponibilidad para esa fecha: {motivo}',
    en: 'Not available on that date: {motivo}',
    pt: 'Sem disponibilidade nessa data: {motivo}',
  },
  disponible: {
    es: 'Sí hay disponibilidad: quedan {n} cupos.',
    en: 'Yes, it is available: {n} spots left.',
    pt: 'Sim, há disponibilidade: restam {n} vagas.',
  },
};

export class MockProvider implements LlmProvider {
  readonly nombre = 'mock';

  generar(peticion: PeticionLlm): Promise<RespuestaLlm> {
    const ultimo = peticion.turnos.at(-1);
    if (ultimo?.tipo === 'resultado') {
      return Promise.resolve(this.responderResultado(peticion));
    }
    const texto = ultimo?.tipo === 'usuario' ? ultimo.texto : '';
    const llamada = this.elegirHerramienta(texto);
    return Promise.resolve(
      llamada
        ? { texto: null, llamadas: [llamada] }
        : { texto: TEXTOS.ayuda[peticion.idioma], llamadas: [] },
    );
  }

  private elegirHerramienta(original: string): LlamadaHerramienta | null {
    const texto = ` ${sinTildes(original)} `;
    const llamada = (nombre: string, argumentos: Record<string, unknown>) => ({
      id: `mock-${nombre}`,
      nombre,
      argumentos,
    });
    const experiencia = /exp-\d+/.exec(texto)?.[0].toUpperCase();
    const fecha = /\d{4}-\d{2}-\d{2}/.exec(texto)?.[0];

    if (experiencia && fecha && /reserv|book/.test(texto)) {
      const personas = Number(
        /(\d+)\s*(personas|people|pessoas)/.exec(texto)?.[1] ?? 1,
      );
      return llamada('crear_reserva', {
        experienciaId: experiencia,
        fecha,
        personas,
      });
    }
    if (experiencia && fecha) {
      return llamada('consultar_disponibilidad', {
        experienciaId: experiencia,
        fecha,
      });
    }
    if (PALABRAS_CULTURALES.some((p) => texto.includes(p))) {
      const tema =
        Object.entries(TEMAS).find(([, palabras]) =>
          palabras.some((p) => texto.includes(p)),
        )?.[0] ?? 'saludo';
      const lengua = LENGUAS.find((l) => texto.includes(l));
      return llamada('obtener_contenido_cultural', {
        tema,
        ...(lengua && { lengua }),
      });
    }
    const intereses = Object.entries(PALABRAS_INTERES)
      .filter(([, palabras]) => palabras.some((p) => texto.includes(p)))
      .map(([interes]) => interes);
    // \b = palabra completa: "plan" sí, "plantas" no.
    if (/itinerar|roteiro|\bplan\b/.test(texto)) {
      const dias = Number(/(\d+)\s*(dias|days)/.exec(texto)?.[1] ?? 2);
      return llamada('armar_itinerario', { intereses, dias });
    }
    if (intereses.length > 0) {
      return llamada('buscar_experiencias', { intereses });
    }
    return null;
  }

  private responderResultado(peticion: PeticionLlm): RespuestaLlm {
    const resultado = peticion.turnos.at(-1);
    if (resultado?.tipo !== 'resultado') return { texto: null, llamadas: [] };
    const r = (resultado.resultado ?? {}) as Record<string, unknown>;
    const t = (clave: string, valores: Record<string, unknown> = {}) =>
      Object.entries(valores).reduce<string>(
        (texto, [k, v]) => texto.replace(`{${k}}`, String(v)),
        TEXTOS[clave][peticion.idioma],
      );

    switch (resultado.nombre) {
      case 'buscar_experiencias': {
        const n = Array.isArray(r.experiencias) ? r.experiencias.length : 0;
        return {
          texto: n ? t('encontradas', { n }) : t('sinResultados'),
          llamadas: [],
        };
      }
      case 'obtener_contenido_cultural':
        return {
          texto: r.mostradas ? t('cultural') : t('culturalVacio'),
          llamadas: [],
        };
      case 'armar_itinerario':
        return { texto: t('itinerario'), llamadas: [] };
      case 'crear_reserva':
        return {
          texto: r.formularioMostrado
            ? t('formulario')
            : t('noDisponible', { motivo: r.mensaje }),
          llamadas: [],
        };
      case 'consultar_disponibilidad':
        return {
          texto: r.disponible
            ? t('disponible', { n: r.cuposLibres })
            : t('noDisponible', { motivo: r.mensaje ?? r.error }),
          llamadas: [],
        };
      default:
        return { texto: t('ayuda'), llamadas: [] };
    }
  }
}
