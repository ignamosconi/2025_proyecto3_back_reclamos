import type { ITipoReclamoRepository } from '../tipoReclamo/interfaces/tipo-reclamo.repository.interface';

export class TipoReclamoSeeder {
  constructor(private readonly repo: ITipoReclamoRepository) {}

  async run() {
    console.log('--- Seeding Tipo de Reclamos ---');
    const defaults = [
      { nombre: 'Reclamo Técnico', descripcion: 'Relacionado al hardware, software y tecnología en general' },
      { nombre: 'Reclamo de Servicio', descripcion: 'Problemas relacionados con servicios prestados' },
      { nombre: 'Reclamo de Facturación', descripcion: 'Errores o dudas sobre facturación' },
      { nombre: 'Bug Crítico', descripcion: 'Errores graves que afectan funcionalidad principal del sistema' },
      { nombre: 'Feature Request', descripcion: 'Solicitud de nuevas funcionalidades o mejoras' },
      { nombre: 'Problema de Rendimiento', descripcion: 'Cuellos de botella o lentitud en el sistema' },
      { nombre: 'Error de Integración', descripcion: 'Problemas en la comunicación entre sistemas o servicios' },
      { nombre: 'Problema de Seguridad', descripcion: 'Vulnerabilidades o problemas relacionados con la seguridad' },
      { nombre: 'Error de UI/UX', descripcion: 'Problemas relacionados con la interfaz de usuario o experiencia' },
      { nombre: 'Problema de Base de Datos', descripcion: 'Errores en consultas, pérdida de datos o problemas de integridad' },
      { nombre: 'Problema de Acceso', descripcion: 'Dificultades para acceder al sistema o permisos incorrectos' },
      { nombre: 'Problema de Reportes', descripcion: 'Errores en generación de reportes o datos incorrectos' },
      { nombre: 'Problema de Notificaciones', descripcion: 'Errores en el envío o recepción de notificaciones' },
      { nombre: 'Problema de Backup', descripcion: 'Fallos en respaldos o recuperación de información' },
      { nombre: 'Consulta General', descripcion: 'Dudas o consultas generales sobre el funcionamiento del sistema' },
    ];

    let created = 0;
    let skipped = 0;

    for (const tipo of defaults) {
      const existing = await this.repo.findByName(tipo.nombre);
      if (!existing) {
        await this.repo.create(tipo);
        console.log(`Tipo de reclamo creado: ${tipo.nombre}`);
        created++;
      } else {
        console.log(`Tipo de reclamo ya existente: ${tipo.nombre}`);
        skipped++;
      }
    }

    console.log(`Tipos de reclamo procesados: ${created} creados, ${skipped} ya existentes`);
  }
}
