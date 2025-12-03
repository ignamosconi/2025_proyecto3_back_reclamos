import type { IUsersRepository } from '../users/interfaces/users.repository.interface';
import type { IAreasResponsablesRepository } from '../areasResponsables/interfaces/areas-responsables.repository.interface';
import { UserRole } from '../users/helpers/enum.roles';
import { IProyectosRepository } from 'src/proyectos/repositories/proyecto.repository.interface';

export class ProyectosSeeder {
  constructor(
    private readonly proyectosRepo: IProyectosRepository,
    private readonly usersRepo: IUsersRepository,
    private readonly areasRepo: IAreasResponsablesRepository,
  ) {}

  async run() {
    console.log('--- Seeding Proyectos ---');

    // Obtener todos los clientes
    const usersResponse = await this.usersRepo.findAll({ limit: 100, page: 1 } as any);
    const clientes = usersResponse.data.filter((u: any) => u.role === UserRole.CLIENTE);

    if (clientes.length === 0) {
      console.error('ERROR: No se encontraron clientes. Saltando seeder de proyectos.');
      return;
    }

    // Obtener todas las áreas
    const areasResponse = await this.areasRepo.findAll({ limit: 100, page: 1 } as any);
    const areas = areasResponse.data;

    if (areas.length === 0) {
      console.error('ERROR: No se encontraron áreas. Saltando seeder de proyectos.');
      return;
    }

    const areaIds = areas.map((a: any) => String(a._id || a.id));

    // Nombres de proyectos variados
    const proyectoNames = [
      'Plataforma de E-commerce v1.0',
      'Sistema de Gestión de Clientes (CRM)',
      'Migración a Cloud AWS',
      'App Móvil iOS y Android',
      'Portal de Clientes Web',
      'Sistema de Facturación Electrónica',
      'API Gateway para Microservicios',
      'Dashboard de Analytics en Tiempo Real',
      'Sistema de Gestión de Inventario',
      'Plataforma de E-learning',
      'Marketplace B2B',
      'Sistema de Reservas Online',
      'App de Delivery',
      'Plataforma de Pagos Digitales',
      'Sistema de Seguimiento de Envíos',
      'CRM Avanzado con IA',
      'Plataforma de Videoconferencias',
      'Sistema de Gestión Documental',
      'Portal de Proveedores',
      'Plataforma de Marketing Automation',
      'Sistema de Gestión de Recursos Humanos',
      'App de Gestión Financiera',
      'Plataforma de Monitoreo de Servidores',
      'Sistema de Gestión de Tickets',
      'Portal de Autoservicio',
      'Plataforma de Comercio B2C',
      'Sistema de Gestión de Proyectos',
      'App de Fidelización de Clientes',
      'Plataforma de Reportes Avanzados',
      'Sistema de Integración con ERP',
      'App de Gestión de Almacenes',
      'Plataforma de Comunicación Interna',
      'Sistema de Gestión de Calidad',
      'Portal de Capacitación Online',
      'Plataforma de Análisis Predictivo',
      'Sistema de Gestión de Contratos',
      'App de Control de Asistencia',
      'Plataforma de Gestión de Redes Sociales',
      'Sistema de Gestión de Seguridad',
      'Portal de Reportes Ejecutivos',
      'Plataforma de Gestión de Activos',
      'Sistema de Gestión de Mantenimiento',
      'App de Gestión de Flotas',
      'Plataforma de Business Intelligence',
      'Sistema de Gestión de Compras',
      'Portal de Gestión de Calidad',
      'Plataforma de Gestión de Riesgos',
      'Sistema de Gestión de Compliance',
      'App de Gestión de Ventas',
      'Plataforma de Gestión de Clientes VIP',
    ];

    interface ProyectoData {
      nombre: string;
      cliente: string;
      areaResponsable: string;
    }

    // Buscar cliente especial (Alejandro Martínez) para darle más proyectos
    const clienteEspecial = clientes.find(
      (c: any) => (c.email && c.email.includes('alejandro.martinez')) || 
                   (c.firstName === 'Alejandro' && c.lastName === 'Martínez')
    );

    // Generar proyectos distribuidos entre diferentes clientes y áreas
    const proyectos: ProyectoData[] = [];

    // Primero crear varios proyectos para el cliente especial (8 proyectos)
    if (clienteEspecial) {
      for (let i = 0; i < 8; i++) {
        const area = areas[Math.floor(Math.random() * areas.length)];
        proyectos.push({
          nombre: `${proyectoNames[i]}${i > 0 ? ` - Proyecto ${i + 1}` : ''}`,
          cliente: String((clienteEspecial as any)._id || (clienteEspecial as any).id),
          areaResponsable: String((area as any)._id || (area as any).id),
        } as ProyectoData);
      }
    }

    // Luego crear el resto de proyectos distribuidos
    for (let i = proyectos.length; i < 45; i++) {
      const cliente = clientes[Math.floor(Math.random() * clientes.length)];
      const area = areas[Math.floor(Math.random() * areas.length)];
      const proyectoIndex = i % proyectoNames.length;

      proyectos.push({
        nombre: `${proyectoNames[proyectoIndex]}${i > proyectoNames.length - 1 ? ` - Instancia ${Math.floor(i / proyectoNames.length) + 1}` : ''}`,
        cliente: String((cliente as any)._id || (cliente as any).id),
        areaResponsable: String((area as any)._id || (area as any).id),
      } as ProyectoData);
    }

    let created = 0;
    let skipped = 0;

    for (const proyecto of proyectos) {
      const existing = await this.proyectosRepo.findByName(proyecto.nombre);

      if (!existing) {
        try {
          await this.proyectosRepo.create(proyecto);
          created++;
          if (created % 10 === 0) {
            console.log(`Proyectos creados: ${created}/${proyectos.length}`);
          }
        } catch (error) {
          console.error(`Error al crear proyecto ${proyecto.nombre}:`, error);
        }
      } else {
        skipped++;
      }
    }

    console.log(`Proyectos procesados: ${created} creados, ${skipped} ya existentes`);
  }
}