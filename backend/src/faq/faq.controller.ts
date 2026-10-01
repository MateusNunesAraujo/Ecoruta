import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { CATEGORIAS_FAQ, IDIOMAS, type Idioma } from './catalogos.js';
import { FaqService } from './faq.service.js';

@Controller('faq')
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  // GET /api/faq                          -> todas, en los tres idiomas
  // GET /api/faq?categoria=salud&idioma=en -> filtradas, solo en inglés
  @Get()
  listar(
    @Query('categoria') categoria?: string,
    @Query('idioma') idioma?: string,
  ) {
    const cat = categoria?.trim().toLowerCase() || undefined;
    if (cat && !(CATEGORIAS_FAQ as readonly string[]).includes(cat)) {
      throw new BadRequestException(
        `Categoría no válida. Valores posibles: ${CATEGORIAS_FAQ.join(', ')}`,
      );
    }
    const idi = idioma?.trim().toLowerCase() || undefined;
    if (idi && !(IDIOMAS as readonly string[]).includes(idi)) {
      throw new BadRequestException(
        `Idioma no válido. Valores posibles: ${IDIOMAS.join(', ')}`,
      );
    }
    return this.faqService.listar({ categoria: cat, idioma: idi as Idioma });
  }
}
