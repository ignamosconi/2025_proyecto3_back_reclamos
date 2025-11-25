import type { ITipoReclamoRepository } from '../tipoReclamo/interfaces/tipo-reclamo.repository.interface';

export class TipoReclamoSeeder {
  constructor(private readonly repo: ITipoReclamoRepository) {}

  async run() {
    console.log('--- Seeding Tipo de Reclamos ---');
    const defaults = [
      { nombre: 'Reclamo Técnico', descripcion: 'Relacionado al hardware, software y tecnología en general' },
      { nombre: 'Reclamo de Servicio', descripcion: 'Problemas relacionados con servicios prestados' },
      { nombre: 'Reclamo de Facturación', descripcion: 'Errores o dudas sobre facturación' },
    ];

    for (const tipo of defaults) {
      const existing = await this.repo.findByName(tipo.nombre);
      if (!existing) {
        await this.repo.create(tipo);
        console.log(`Tipo de reclamo creado: ${tipo.nombre}`);
      } else {
        console.log(`Tipo de reclamo ya existente: ${tipo.nombre}`);
      }
    }
  }
}
