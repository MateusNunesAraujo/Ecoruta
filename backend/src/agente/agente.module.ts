import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CulturalModule } from '../cultural/cultural.module.js';
import { EmprendimientosModule } from '../emprendimientos/emprendimientos.module.js';
import { ReservasModule } from '../reservas/reservas.module.js';
import { AgenteController } from './agente.controller.js';
import { AgenteService } from './agente.service.js';
import { HerramientasAgente } from './herramientas.js';
import { GeminiProvider } from './providers/gemini.provider.js';
import { GroqProvider } from './providers/groq.provider.js';
import {
  LLM_PROVIDER,
  type LlmProvider,
} from './providers/llm-provider.interface.js';
import { MockProvider } from './providers/mock.provider.js';

// Elige los proveedores según LLM_PROVIDER en el .env:
// - mock:   sin red ni cuota (desarrollo).
// - gemini: Gemini, con Groq de respaldo si hay GROQ_API_KEY.
// - groq:   Groq, con Gemini de respaldo si hay GEMINI_API_KEY.
function crearProveedores(config: ConfigService): LlmProvider[] {
  const tipo = config.get<string>('LLM_PROVIDER', 'mock').trim().toLowerCase();
  const claveGemini = config.get<string>('GEMINI_API_KEY', '').trim();
  const claveGroq = config.get<string>('GROQ_API_KEY', '').trim();
  const gemini = () =>
    new GeminiProvider(
      claveGemini,
      config.get<string>('GEMINI_MODEL') || 'gemini-3.5-flash-lite',
    );
  const groq = () =>
    new GroqProvider(
      claveGroq,
      config.get<string>('GROQ_MODEL') || 'llama-3.3-70b-versatile',
    );

  let proveedores: LlmProvider[];
  switch (tipo) {
    case 'mock':
      proveedores = [new MockProvider()];
      break;
    case 'gemini':
      if (!claveGemini) {
        throw new Error(
          'LLM_PROVIDER=gemini pero GEMINI_API_KEY está vacía en .env',
        );
      }
      proveedores = [gemini(), ...(claveGroq ? [groq()] : [])];
      break;
    case 'groq':
      if (!claveGroq) {
        throw new Error(
          'LLM_PROVIDER=groq pero GROQ_API_KEY está vacía en .env',
        );
      }
      proveedores = [groq(), ...(claveGemini ? [gemini()] : [])];
      break;
    default:
      throw new Error(
        `LLM_PROVIDER="${tipo}" no válido. Usa gemini, groq o mock.`,
      );
  }
  new Logger('AgenteModule').log(
    `Proveedores LLM: ${proveedores.map((p) => p.nombre).join(' -> ')}`,
  );
  return proveedores;
}

@Module({
  imports: [EmprendimientosModule, CulturalModule, ReservasModule],
  controllers: [AgenteController],
  providers: [
    AgenteService,
    HerramientasAgente,
    {
      provide: LLM_PROVIDER,
      inject: [ConfigService],
      useFactory: crearProveedores,
    },
  ],
})
export class AgenteModule {}
