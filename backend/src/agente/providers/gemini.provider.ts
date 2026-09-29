import {
  ErrorProveedorLlm,
  type Fetch,
  type LlamadaHerramienta,
  type LlmProvider,
  type PeticionLlm,
  type RespuestaLlm,
} from './llm-provider.interface.js';

// Gemini (Google), API REST generateContent.
// Nivel gratuito: Google usa los datos para entrenar y personas pueden leerlos
// (por eso las reglas 2 y 3 de CLAUDE.md).
// Docs: https://ai.google.dev/gemini-api/docs/function-calling
interface ParteGemini {
  text?: string;
  functionCall?: { name: string; args?: Record<string, unknown>; id?: string };
  functionResponse?: { name: string; response: unknown; id?: string };
  thoughtSignature?: string;
}
interface ContenidoGemini {
  role: 'user' | 'model';
  parts: ParteGemini[];
}

export class GeminiProvider implements LlmProvider {
  readonly nombre = 'gemini';

  constructor(
    private readonly apiKey: string,
    private readonly modelo: string,
    private readonly fetchFn: Fetch = fetch,
  ) {}

  async generar(peticion: PeticionLlm): Promise<RespuestaLlm> {
    const contents: ContenidoGemini[] = [];
    for (const turno of peticion.turnos) {
      if (turno.tipo === 'usuario') {
        contents.push({ role: 'user', parts: [{ text: turno.texto }] });
      } else if (turno.tipo === 'asistente') {
        // Se devuelve el contenido original para conservar thoughtSignature.
        contents.push(
          (turno.crudo as ContenidoGemini | undefined) ?? {
            role: 'model',
            parts: [
              ...(turno.texto ? [{ text: turno.texto }] : []),
              ...turno.llamadas.map((l) => ({
                functionCall: { name: l.nombre, args: l.argumentos },
              })),
            ],
          },
        );
      } else {
        // Los resultados de herramientas van con rol "user".
        contents.push({
          role: 'user',
          parts: [
            {
              functionResponse: {
                name: turno.nombre,
                response: { resultado: turno.resultado },
              },
            },
          ],
        });
      }
    }

    const cuerpo = {
      systemInstruction: { parts: [{ text: peticion.sistema }] },
      contents,
      tools: [
        {
          functionDeclarations: peticion.herramientas.map((h) => ({
            name: h.nombre,
            description: h.descripcion,
            parameters: h.parametros,
          })),
        },
      ],
      toolConfig: { functionCallingConfig: { mode: 'AUTO' } },
      generationConfig: { temperature: 0.4, maxOutputTokens: 800 },
    };

    const url =
      'https://generativelanguage.googleapis.com/v1beta/models/' +
      `${encodeURIComponent(this.modelo)}:generateContent`;
    let respuesta: Response;
    try {
      respuesta = await this.fetchFn(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify(cuerpo),
        signal: AbortSignal.timeout(20_000),
      });
    } catch (error) {
      throw new ErrorProveedorLlm(
        this.nombre,
        `sin conexión: ${String(error)}`,
      );
    }
    if (!respuesta.ok) {
      const detalle = (await respuesta.text()).slice(0, 300);
      throw new ErrorProveedorLlm(
        this.nombre,
        `HTTP ${respuesta.status}: ${detalle}`,
      );
    }

    const datos = (await respuesta.json()) as {
      candidates?: { content?: ContenidoGemini }[];
    };
    const contenido = datos.candidates?.[0]?.content;
    if (!contenido?.parts) {
      throw new ErrorProveedorLlm(this.nombre, 'respuesta sin contenido');
    }

    const textos: string[] = [];
    const llamadas: LlamadaHerramienta[] = [];
    contenido.parts.forEach((parte, i) => {
      if (parte.text) textos.push(parte.text);
      if (parte.functionCall) {
        llamadas.push({
          id: parte.functionCall.id ?? `gemini-${i}`,
          nombre: parte.functionCall.name,
          argumentos: parte.functionCall.args ?? {},
        });
      }
    });
    return {
      texto: textos.join('').trim() || null,
      llamadas,
      crudo: { role: 'model', parts: contenido.parts },
    };
  }
}
