import type { ITipoReclamoService } from '../tipoReclamo/interfaces/tipo-reclamo.service.interface';

export class TipoReclamoSeeder {
  constructor(private readonly service: ITipoReclamoService) {}

  async run() {
    const defaults = [
      { nombre: 'Reclamo Técnico', descripcion: 'Relacionado al hardware, software y tecnología en general' },
      { nombre: 'Reclamo de Servicio', descripcion: 'Problemas relacionados con servicios prestados' },
      { nombre: 'Reclamo de Facturación', descripcion: 'Errores o dudas sobre facturación' },
    ];

    for (const tipo of defaults) {
      const existing = await this.service.findByName(tipo.nombre);
      if (!existing) {
        await this.service.create(tipo);
        console.log(`Tipo de reclamo creado: ${tipo.nombre}`);
      } else {
        console.log(`Tipo de reclamo ya existente: ${tipo.nombre}`);
      }
    }
  }
}
