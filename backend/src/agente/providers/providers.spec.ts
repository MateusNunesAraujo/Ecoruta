import { GeminiProvider } from './gemini.provider.js';
import { GroqProvider } from './groq.provider.js';
import {
  ErrorProveedorLlm,
  type Fetch,
  type PeticionLlm,
} from './llm-provider.interface.js';
import { MockProvider } from './mock.provider.js';

// fetch simulado: guarda lo que se envió y responde lo indicado.
function fetchFalso(status: number, cuerpo: unknown) {
  const enviado: { url: string; init: RequestInit }[] = [];
  const fn = ((url: string, init: RequestInit) => {
    enviado.push({ url, init });
    return Promise.resolve(new Response(JSON.stringify(cuerpo), { status }));
  }) as unknown as Fetch;
  return {
    fn,
    enviado,
    json: () => JSON.parse(enviado[0].init.body as string),
  };
}

const peticion: PeticionLlm = {
  sistema: 'Eres un asistente',
  idioma: 'es',
  herramientas: [
    {
      nombre: 'buscar_experiencias',
      descripcion: 'Busca',
      parametros: { type: 'object', properties: {}, required: [] },
    },
  ],
  turnos: [
    { tipo: 'usuario', texto: 'quiero ver aves' },
    {
      tipo: 'asistente',
      texto: null,
      llamadas: [
        {
          id: 'c1',
          nombre: 'buscar_experiencias',
          argumentos: { intereses: ['aves'] },
        },
      ],
      crudo: {
        role: 'model',
        parts: [
          {
            functionCall: {
              name: 'buscar_experiencias',
              args: { intereses: ['aves'] },
            },
            thoughtSignature: 'firma-123',
          },
        ],
      },
    },
    {
      tipo: 'resultado',
      llamadaId: 'c1',
      nombre: 'buscar_experiencias',
      resultado: { experiencias: [] },
    },
  ],
};

describe('GeminiProvider', () => {
  it('arma la petición y devuelve la thoughtSignature tal cual', async () => {
    const f = fetchFalso(200, {
      candidates: [{ content: { role: 'model', parts: [{ text: 'Listo' }] } }],
    });
    const r = await new GeminiProvider('clave', 'gemini-x', f.fn).generar(
      peticion,
    );

    expect(r.texto).toBe('Listo');
    expect(f.enviado[0].url).toContain('/models/gemini-x:generateContent');
    expect(
      (f.enviado[0].init.headers as Record<string, string>)['x-goog-api-key'],
    ).toBe('clave');
    const cuerpo = f.json();
    expect(cuerpo.systemInstruction.parts[0].text).toBe('Eres un asistente');
    expect(cuerpo.tools[0].functionDeclarations[0].name).toBe(
      'buscar_experiencias',
    );
    expect(cuerpo.contents[1].parts[0].thoughtSignature).toBe('firma-123');
    expect(cuerpo.contents[2]).toEqual({
      role: 'user',
      parts: [
        {
          functionResponse: {
            name: 'buscar_experiencias',
            response: { resultado: { experiencias: [] } },
          },
        },
      ],
    });
  });

  it('lee las llamadas a herramientas', async () => {
    const f = fetchFalso(200, {
      candidates: [
        {
          content: {
            role: 'model',
            parts: [
              { functionCall: { name: 'armar_itinerario', args: { dias: 2 } } },
            ],
          },
        },
      ],
    });
    const r = await new GeminiProvider('k', 'm', f.fn).generar(peticion);
    expect(r.llamadas).toEqual([
      { id: 'gemini-0', nombre: 'armar_itinerario', argumentos: { dias: 2 } },
    ]);
  });

  it('un 429 (cuota agotada) es ErrorProveedorLlm para activar el respaldo', async () => {
    const f = fetchFalso(429, { error: 'quota' });
    await expect(
      new GeminiProvider('k', 'm', f.fn).generar(peticion),
    ).rejects.toBeInstanceOf(ErrorProveedorLlm);
  });
});

describe('GroqProvider', () => {
  it('usa el formato de OpenAI y lee tool_calls con argumentos en texto', async () => {
    const f = fetchFalso(200, {
      choices: [
        {
          message: {
            content: null,
            tool_calls: [
              {
                id: 't1',
                function: {
                  name: 'crear_reserva',
                  arguments: '{"personas":2}',
                },
              },
            ],
          },
        },
      ],
    });
    const r = await new GroqProvider('clave', 'llama', f.fn).generar(peticion);

    expect(r.llamadas).toEqual([
      { id: 't1', nombre: 'crear_reserva', argumentos: { personas: 2 } },
    ]);
    expect(
      (f.enviado[0].init.headers as Record<string, string>).Authorization,
    ).toBe('Bearer clave');
    const cuerpo = f.json();
    expect(cuerpo.messages[0]).toEqual({
      role: 'system',
      content: 'Eres un asistente',
    });
    expect(cuerpo.messages[2].tool_calls[0].function.arguments).toBe(
      '{"intereses":["aves"]}',
    );
    expect(cuerpo.messages[3]).toEqual({
      role: 'tool',
      tool_call_id: 'c1',
      content: '{"experiencias":[]}',
    });
  });

  it('pide razonamiento bajo solo a los modelos gpt-oss', async () => {
    const respuesta = { choices: [{ message: { content: 'ok' } }] };
    const conGptOss = fetchFalso(200, respuesta);
    await new GroqProvider('k', 'openai/gpt-oss-120b', conGptOss.fn).generar(
      peticion,
    );
    expect(conGptOss.json().reasoning_effort).toBe('low');

    const otroModelo = fetchFalso(200, respuesta);
    await new GroqProvider('k', 'qwen/qwen3.8-27b', otroModelo.fn).generar(
      peticion,
    );
    expect(otroModelo.json().reasoning_effort).toBeUndefined();
  });

  it('argumentos inválidos no rompen: se usan como {}', async () => {
    const f = fetchFalso(200, {
      choices: [
        {
          message: {
            tool_calls: [
              { id: 't1', function: { name: 'x', arguments: 'no es json' } },
            ],
          },
        },
      ],
    });
    const r = await new GroqProvider('k', 'm', f.fn).generar(peticion);
    expect(r.llamadas[0].argumentos).toEqual({});
  });
});

describe('MockProvider', () => {
  const mock = new MockProvider();
  const preguntar = (texto: string) =>
    mock.generar({ ...peticion, turnos: [{ tipo: 'usuario', texto }] });

  it.each([
    ['Quiero ver delfines', 'buscar_experiencias'],
    ['How do you say thank you in Tikuna?', 'obtener_contenido_cultural'],
    ['Arma un itinerario de 3 días con aves', 'armar_itinerario'],
    ['Quiero reservar EXP-01 el 2026-10-05 para 2 personas', 'crear_reserva'],
    ['¿Hay cupo en EXP-02 el 2026-10-07?', 'consultar_disponibilidad'],
    ['Me interesan las plantas medicinales', 'buscar_experiencias'],
  ])('"%s" -> %s', async (texto, herramienta) => {
    expect((await preguntar(texto)).llamadas[0]?.nombre).toBe(herramienta);
  });

  it('sin intención clara responde con ayuda y sin herramientas', async () => {
    const r = await preguntar('buenas');
    expect(r.llamadas).toHaveLength(0);
    expect(r.texto).toContain('Ecoruta');
  });
});
