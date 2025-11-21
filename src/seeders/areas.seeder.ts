/*
    ESTE SEEDER PERMITE CUMPLIR CON LA US 6, que especifica que el sistema debe contar con
    tres áreas por defecto: Ventas, Soporte Técnico y Facturación.
*/

import type { IAreasResponsablesService } from '../areasResponsables/interfaces/areas-responsables.service.interface';

export class AreasSeeder {
  constructor(private readonly service: IAreasResponsablesService) {}

  async run() {
    const defaults = [
      { nombre: 'Ventas', descripcion: 'Área encargada de ventas y clientes' },
      { nombre: 'Soporte Técnico', descripcion: 'Área encargada de soporte técnico' },
      { nombre: 'Facturación', descripcion: 'Área encargada de facturación y cobros' },
    ];

    for (const area of defaults) {
      const existing = await this.service.findByName(area.nombre);
      if (!existing) {
        await this.service.create(area);
        console.log(`Área creada: ${area.nombre}`);
      } else {
        console.log(`Área ya existente: ${area.nombre}`);
      }
    }
  }
}
