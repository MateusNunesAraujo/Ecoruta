import {
  ErrorProveedorLlm,
  type Fetch,
  type LlmProvider,
  type PeticionLlm,
  type RespuestaLlm,
} from './llm-provider.interface.js';

// Groq, API compatible con OpenAI (chat/completions). Respaldo de Gemini.
// Docs: https://console.groq.com/docs/tool-use
type MensajeGroq =
  | { role: 'system' | 'user'; content: string }
  | {
      role: 'assistant';
      content: string | null;
      tool_calls?: {
        id: string;
        type: 'function';
        function: { name: string; arguments: string };
      }[];
    }
  | { role: 'tool'; tool_call_id: string; content: string };

export class GroqProvider implements LlmProvider {
  readonly nombre = 'groq';

  constructor(
    private readonly apiKey: string,
    private readonly modelo: string,
    private readonly fetchFn: Fetch = fetch,
  ) {}

  async generar(peticion: PeticionLlm): Promise<RespuestaLlm> {
    const messages: MensajeGroq[] = [
      { role: 'system', content: peticion.sistema },
    ];
    for (const turno of peticion.turnos) {
      if (turno.tipo === 'usuario') {
        messages.push({ role: 'user', content: turno.texto });
      } else if (turno.tipo === 'asistente') {
        messages.push({
          role: 'assistant',
          content: turno.texto,
          ...(turno.llamadas.length > 0 && {
            tool_calls: turno.llamadas.map((l) => ({
              id: l.id,
              type: 'function' as const,
              function: {
                name: l.nombre,
                arguments: JSON.stringify(l.argumentos),
              },
            })),
          }),
        });
      } else {
        messages.push({
          role: 'tool',
          tool_call_id: turno.llamadaId,
          content: JSON.stringify(turno.resultado),
        });
      }
    }

    const cuerpo = {
      model: this.modelo,
      messages,
      tools: peticion.herramientas.map((h) => ({
        type: 'function',
        function: {
          name: h.nombre,
          description: h.descripcion,
          parameters: h.parametros,
        },
      })),
      tool_choice: 'auto',
      temperature: 0.4,
      max_tokens: 800,
    };

    let respuesta: Response;
    try {
      respuesta = await this.fetchFn(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(cuerpo),
          signal: AbortSignal.timeout(20_000),
        },
      );
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
      choices?: {
        message?: {
          content?: string | null;
          tool_calls?: {
            id: string;
            function: { name: string; arguments: string };
          }[];
        };
      }[];
    };
    const mensaje = datos.choices?.[0]?.message;
    if (!mensaje) {
      throw new ErrorProveedorLlm(this.nombre, 'respuesta sin mensaje');
    }

    return {
      texto: mensaje.content?.trim() || null,
      llamadas: (mensaje.tool_calls ?? []).map((l) => ({
        id: l.id,
        nombre: l.function.name,
        argumentos: this.leerArgumentos(l.function.arguments),
      })),
    };
  }

  // Groq envía los argumentos como texto JSON.
  private leerArgumentos(texto: string): Record<string, unknown> {
    try {
      const valor: unknown = JSON.parse(texto || '{}');
      return valor && typeof valor === 'object'
        ? (valor as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }
}
