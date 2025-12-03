/*
    ESTE SEEDER PERMITE CUMPLIR CON LA US 6, que especifica que el sistema debe contar con
    tres áreas por defecto: Ventas, Soporte Técnico y Facturación.
*/
import type { IAreasResponsablesRepository } from '../areasResponsables/interfaces/areas-responsables.repository.interface';

export class AreasSeeder {
  constructor(private readonly repo: IAreasResponsablesRepository) {}

  async run() {
    console.log('--- Seeding áreas | US 6 ---');
    const defaults = [
      { nombre: 'Ventas', descripcion: 'Área encargada de ventas y clientes' },
      { nombre: 'Soporte Técnico', descripcion: 'Área encargada de soporte técnico' },
      { nombre: 'Facturación', descripcion: 'Área encargada de facturación y cobros' },
      { nombre: 'Desarrollo', descripcion: 'Área encargada del desarrollo de software y nuevas funcionalidades' },
      { nombre: 'QA', descripcion: 'Área de control de calidad y testing de aplicaciones' },
      { nombre: 'DevOps', descripcion: 'Área encargada de infraestructura, despliegues y operaciones técnicas' },
      { nombre: 'Marketing', descripcion: 'Área encargada de estrategias de marketing y comunicación' },
      { nombre: 'Recursos Humanos', descripcion: 'Área encargada de gestión de personal y administración' },
      { nombre: 'Administración', descripcion: 'Área encargada de tareas administrativas y gestión general' },
      { nombre: 'Seguridad', descripcion: 'Área encargada de la seguridad informática y protección de datos' },
      { nombre: 'Logística', descripcion: 'Área encargada de la gestión logística y distribución' },
      { nombre: 'Atención al Cliente', descripcion: 'Área encargada del contacto directo con clientes y resolución de consultas' },
      { nombre: 'Proyectos', descripcion: 'Área encargada de la gestión y coordinación de proyectos' },
      { nombre: 'Capacitación', descripcion: 'Área encargada de la formación y capacitación del personal' },
      { nombre: 'Innovación', descripcion: 'Área encargada de investigación y desarrollo de nuevas tecnologías' },
    ];

    let created = 0;
    let skipped = 0;

    for (const area of defaults) {
      const existing = await this.repo.findByName(area.nombre);
      if (!existing) {
        await this.repo.create(area);
        console.log(`Área creada: ${area.nombre}`);
        created++;
      } else {
        console.log(`Área ya existente: ${area.nombre}`);
        skipped++;
      }
    }

    console.log(`Áreas procesadas: ${created} creadas, ${skipped} ya existentes`);
  }
}
