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

// Nombres de lengua que el Mock reconoce por sí solo. El backend resuelve
// cualquier nombre (incluidas las autodenominaciones del Excel).
const LENGUAS = [
  'tikuna',
  'ticuna',
  'maguta',
  'murui',
  'huitoto',
  'uitoto',
  'witoto',
  'yagua',
  'mirana',
  'bora',
];

// Traducciones comunes (en/pt, sin tildes) -> tema de las fichas (español).
const SINONIMOS_TEMA: Record<string, string> = {
  thank: 'gracias',
  thanks: 'gracias',
  obrigado: 'gracias',
  obrigada: 'gracias',
  hello: 'hola',
  hi: 'hola',
  ola: 'hola',
  oi: 'hola',
  bye: 'adios',
  goodbye: 'adios',
  tchau: 'adios',
  welcome: 'bienvenido',
  dolphin: 'delfin',
  boto: 'delfin',
  golfinho: 'delfin',
  river: 'rio',
  canoe: 'canoa',
  jungle: 'selva',
  rainforest: 'selva',
  floresta: 'selva',
  forest: 'bosque',
  cassava: 'yuca',
  mandioca: 'yuca',
  dog: 'perro',
  cachorro: 'perro',
  parrot: 'loro',
  papagaio: 'loro',
  heart: 'corazon',
  coracao: 'corazon',
  god: 'dios',
  deus: 'dios',
};

// Temas que existen en las fichas: el agente los envía en la definición de
// la herramienta (enum), así el Mock reconoce los nuevos sin cambiar código.
function temasDeLaHerramienta(peticion: PeticionLlm): string[] {
  const definicion = peticion.herramientas.find(
    (h) => h.nombre === 'obtener_contenido_cultural',
  );
  const tema = definicion?.parametros.properties.tema as
    { enum?: string[] } | undefined;
  return (tema?.enum ?? []).filter((t) => t !== 'saludo');
}

// Tema mencionado en el texto (sin tildes): "delfines" -> "delfin",
// "como te llamas" -> "como_te_llamas", "dolphin" -> "delfin".
function detectarTema(texto: string, temas: string[]): string | null {
  const frase = ` ${texto
    .split(/[^a-z]+/)
    .filter(Boolean)
    .join(' ')} `;
  const porNombre = temas
    .filter((t) => new RegExp(` ${t.replace(/_/g, ' ')}(e?s)? `).test(frase))
    .sort((a, b) => b.length - a.length)[0];
  if (porNombre) return porNombre;
  for (const palabra of frase.trim().split(' ')) {
    const tema = SINONIMOS_TEMA[palabra];
    if (tema && temas.includes(tema)) return tema;
  }
  return null;
}

// "en lengua magüta", "idioma bora", "in Tikuna" -> nombre de la lengua.
// alFinal: en una pregunta cultural, también "…en quechua" / "…in Tikuna"
// (la palabra tras "en/in/em" al final de la frase). No se usa fuera de
// preguntas culturales para no confundir "quiero ir en canoa" con una lengua.
function mencionaLengua(texto: string, alFinal = false): string | null {
  const genericas = ['indigena', 'indigenas', 'nativa', 'indigenous', 'native'];
  const trasPalabra =
    /\b(?:lengua|idioma|language|lingua)\s+(?:de\s+|del\s+|the\s+)?([a-z]+)/.exec(
      texto,
    )?.[1];
  if (trasPalabra && !genericas.includes(trasPalabra)) return trasPalabra;
  const conocida = LENGUAS.find((l) => new RegExp(`\\b${l}\\b`).test(texto));
  if (conocida) return conocida;
  if (!alFinal) return null;
  const limpio = texto
    .replace(/[^a-z ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const final = /\b(?:en|in|em)\s+([a-z]+)$/.exec(limpio)?.[1];
  return final && !genericas.includes(final) ? final : null;
}

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
  culturalSinTema: {
    es: 'Todavía no tenemos esa palabra verificada en {lengua}. Puedes preguntarme por: {temas}.',
    en: "We don't have that word verified in {lengua} yet. You can ask me about: {temas}.",
    pt: 'Ainda não temos essa palavra verificada em {lengua}. Você pode me perguntar sobre: {temas}.',
  },
  preguntarReserva: {
    es: '¡Con gusto! ¿Para qué fecha y cuántas personas? (Por ejemplo: EXP-01 el 2026-10-05 para 2 personas).',
    en: 'Happy to help! For which date and how many people? (For example: EXP-01 on 2026-10-05 for 2 people).',
    pt: 'Com prazer! Para qual data e quantas pessoas? (Por exemplo: EXP-01 no dia 2026-10-05 para 2 pessoas).',
  },
  infoNoEncontrada: {
    es: 'No tengo información verificada sobre eso todavía. Te recomiendo consultarlo con la oficina de turismo de Leticia.',
    en: "I don't have verified information about that yet. Please check with the Leticia tourist office.",
    pt: 'Ainda não tenho informação verificada sobre isso. Recomendo consultar o escritório de turismo de Leticia.',
  },
  culturalEnOtras: {
    es: 'Esa palabra sí está en: {lenguas}.',
    en: 'That word is available in: {lenguas}.',
    pt: 'Essa palavra está disponível em: {lenguas}.',
  },
  lenguaDesconocida: {
    es: 'No reconozco esa lengua. Tenemos contenido en tikuna, murui (huitoto), miraña y bora; el yagua está en validación.',
    en: "I don't recognize that language. We have content in Tikuna, Murui (Huitoto), Miraña and Bora; Yagua is being validated.",
    pt: 'Não reconheço essa língua. Temos conteúdo em tikuna, murui (huitoto), miraña e bora; o yagua está em validação.',
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
  pago: {
    es: 'Aquí puedes pagar tu reserva de forma segura con Wompi (tarjeta, Nequi o PSE).',
    en: 'You can pay for your booking securely with Wompi here (card, Nequi or PSE).',
    pt: 'Aqui você pode pagar sua reserva com segurança pela Wompi (cartão, Nequi ou PSE).',
  },
  pagoNoDisponible: {
    es: 'El pago en línea todavía no está disponible. Tu cupo queda apartado 15 minutos.',
    en: 'Online payment is not available yet. Your spot is held for 15 minutes.',
    pt: 'O pagamento online ainda não está disponível. Sua vaga fica reservada por 15 minutos.',
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
    const ultimoTurno = peticion.turnos.at(-1);
    if (ultimoTurno?.tipo === 'resultado') {
      return Promise.resolve(this.responderResultado(peticion));
    }
    const llamada = this.elegirHerramienta(peticion);
    if (llamada) return Promise.resolve({ texto: null, llamadas: [llamada] });
    // Quiere reservar pero faltan datos: se preguntan (no se suponen).
    const ultimo =
      ultimoTurno?.tipo === 'usuario' ? sinTildes(ultimoTurno.texto) : '';
    const clave = /reserv|\bbook/.test(ultimo) ? 'preguntarReserva' : 'ayuda';
    return Promise.resolve({
      texto: TEXTOS[clave][peticion.idioma],
      llamadas: [],
    });
  }

  private elegirHerramienta(peticion: PeticionLlm): LlamadaHerramienta | null {
    const mensajes = peticion.turnos
      .filter((t) => t.tipo === 'usuario')
      .map((t) => ` ${sinTildes(t.texto)} `);
    const texto = mensajes.at(-1) ?? '';
    const anteriores = mensajes.slice(0, -1);
    const llamada = (nombre: string, argumentos: Record<string, unknown>) => ({
      id: `mock-${nombre}`,
      nombre,
      argumentos,
    });
    const experiencia = /exp-\d+/.exec(texto)?.[0].toUpperCase();
    const fecha = /\d{4}-\d{2}-\d{2}/.exec(texto)?.[0];

    if (/\bpag(ar|o)\b|\bpay\b|pagamento/.test(texto)) {
      return llamada('generar_enlace_pago', {});
    }
    // Quiere reservar pero no dijo qué experiencia o fecha: se pregunta.
    if (/reserv|\bbook/.test(texto) && !(experiencia && fecha)) {
      return null; // responde con el texto "preguntarReserva"
    }
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
    // ¿Pregunta por palabras en una lengua? "Cómo se dice delfín en magüta",
    // o una continuación como "Ahora maloca" después de una pregunta así.
    const temas = temasDeLaHerramienta(peticion);
    const quiereVisitar = (t: string) =>
      /\b(ver|visitar|conocer|reservar|tour|see|visit|book)\b/.test(t);
    const tieneClave = (t: string) =>
      PALABRAS_CULTURALES.filter((p) => !LENGUAS.includes(p)).some((p) =>
        t.includes(p),
      );
    // Mensaje cultural por sí solo: palabra clave ("cómo se dice") o una
    // lengua nombrada (sin intención de visitar).
    const esCultural = (t: string) =>
      tieneClave(t) || (mencionaLengua(t) !== null && !quiereVisitar(t));
    // Se recorre la conversación: "Ahora maloca", "¿Y perro?"… siguen siendo
    // culturales mientras nombren un tema y la anterior también lo fuera.
    let enCultural = false;
    for (const t of anteriores) {
      enCultural =
        esCultural(t) ||
        (enCultural && detectarTema(t, temas) !== null && !quiereVisitar(t));
    }
    const tema = detectarTema(texto, temas);
    const continuaCultural =
      tema !== null && enCultural && !quiereVisitar(texto);
    if (esCultural(texto) || continuaCultural) {
      // La lengua de este mensaje o, si no dice, la de los anteriores.
      const lengua =
        mencionaLengua(texto, tieneClave(texto)) ??
        [...anteriores]
          .reverse()
          .map((t) => mencionaLengua(t, tieneClave(t)))
          .find(Boolean) ??
        null;
      return llamada('obtener_contenido_cultural', {
        tema: tema ?? 'saludo',
        ...(lengua && { lengua }),
      });
    }
    // Preguntas prácticas: salud, dinero, frontera, cómo llegar, normas…
    if (
      /vacun|fiebre|febre|malaria|pasaporte|passport|passaporte|documento|efectivo|cash|dinheiro|tarjeta de credito|credit card|cartao|clima|lluvia|ropa|clothes|roupa|internet|senal|signal|wifi|segur|safe|agua del grifo|tap water|frontera|border|fronteira|como llego|como llegar|how do i get|como chego|normas|puedo tomar fotos|take photos|tirar fotos/.test(
        texto,
      )
    ) {
      return llamada('consultar_informacion_practica', {
        consulta: texto.trim(),
      });
    }
    // Preguntas generales: muestra variada de experiencias.
    if (
      /que se puede hacer|que hacer|que me recomiendas|what can i do|what to do|recommend|o que (posso )?fazer|o que tem para fazer/.test(
        texto,
      )
    ) {
      return llamada('buscar_experiencias', {});
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
      // Con fecha ("¿hay cupo el sábado 2026-10-03?"), solo las disponibles.
      return llamada('buscar_experiencias', {
        intereses,
        ...(fecha && { fecha }),
      });
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
      case 'obtener_contenido_cultural': {
        if (r.mostradas) return { texto: t('cultural'), llamadas: [] };
        const temas = Array.isArray(r.temasDisponibles)
          ? (r.temasDisponibles as string[]).map((x) => x.replace(/_/g, ' '))
          : [];
        if (temas.length) {
          const otras = Array.isArray(r.enOtrasLenguas)
            ? (r.enOtrasLenguas as string[]).join(', ')
            : '';
          return {
            texto:
              t('culturalSinTema', {
                lengua: r.lengua,
                temas: temas.join(', '),
              }) +
              (otras ? ` ${t('culturalEnOtras', { lenguas: otras })}` : ''),
            llamadas: [],
          };
        }
        const desconocida = String(r.mensaje ?? '').startsWith('No reconozco');
        return {
          texto: t(desconocida ? 'lenguaDesconocida' : 'culturalVacio'),
          llamadas: [],
        };
      }
      case 'armar_itinerario':
        return { texto: t('itinerario'), llamadas: [] };
      case 'crear_reserva':
        return {
          texto: r.formularioMostrado
            ? t('formulario')
            : t('noDisponible', { motivo: r.mensaje }),
          llamadas: [],
        };
      case 'consultar_informacion_practica': {
        // El Mock no redacta: entrega la respuesta verificada y su fuente.
        const faq = (
          r.preguntasFrecuentes as
            { respuesta: string; fuente: string | null }[] | undefined
        )?.[0];
        const comunidad = (
          r.comunidades as
            | {
                nombre: string;
                comoLlegar: string | null;
                normasDeVisita: string | null;
              }[]
            | undefined
        )?.[0];
        const partes = [
          faq
            ? `${faq.respuesta}${faq.fuente ? ` (${faq.fuente})` : ''}`
            : null,
          comunidad?.comoLlegar
            ? `${comunidad.nombre}: ${comunidad.comoLlegar}`
            : null,
          comunidad?.normasDeVisita
            ? `${comunidad.nombre}: ${comunidad.normasDeVisita}`
            : null,
        ].filter(Boolean);
        return {
          texto: partes.length ? partes.join(' ') : t('infoNoEncontrada'),
          llamadas: [],
        };
      }
      case 'generar_enlace_pago':
        return {
          texto: r.mostrado ? t('pago') : t('pagoNoDisponible'),
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
