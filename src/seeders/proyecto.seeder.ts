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

    // 1. OBTENER IDS NECESARIOS PARA INTEGRIDAD REFERENCIAL
    // Buscamos el cliente de prueba
    const clienteTest = await this.usersRepo.findByEmail('cliente1@test.com');
    
    // Buscamos alguna de las 3 áreas por defecto, según US 6.
    const areaVentas = await this.areasRepo.findByName('Ventas');
    const areaFacturacion = await this.areasRepo.findByName('Facturación');

    if (!clienteTest || clienteTest.role !== UserRole.CLIENTE) {
      console.error('ERROR: No se encontró el usuario de prueba "cliente1@test.com" con rol Cliente. Saltando seeder de proyectos.');
      return;
    }

    if (!areaVentas) {
      console.error('ERROR: No se encontró el área de prueba "Ventas". Saltando seeder de proyectos.');
      return;
    }
    
    const clienteId = clienteTest.id;
    const areaVentasId = areaVentas.id;
    const areaFacturacionId = areaFacturacion?.id;

    // 2. DEFINICIÓN DE PROYECTOS
    const defaults = [
      {
        nombre: 'Plataforma de E-commerce v1.0',
        descripcion: 'Implementación inicial de la plataforma de ventas online.',
        cliente: clienteId,
        areaResponsable: areaVentasId,
        fechaInicio: new Date('2025-01-15'),
        fechaFinPrevista: new Date('2025-06-30'),
      },
      {
        nombre: 'Sistema de Gestión de Clientes (CRM)',
        descripcion: 'Desarrollo de un CRM interno para seguimiento de ventas.',
        cliente: clienteId,
        areaResponsable: areaVentasId,
        fechaInicio: new Date('2025-07-01'),
        fechaFinPrevista: new Date('2025-12-31'),
      },
      {
        nombre: 'Pago de Servidores Web',
        descripcion: 'Migración de la infraestructura a AWS.',
        cliente: clienteId,
        areaResponsable: areaFacturacionId,
        fechaInicio: new Date('2024-10-01'),
        fechaFinPrevista: new Date('2024-12-15'),
      },
    ];

    // 3. EJECUCIÓN DEL SEEDING
    for (const proyecto of defaults) {
      const existing = await this.proyectosRepo.findByName(proyecto.nombre);
      
      if (!existing) {
        await this.proyectosRepo.create(proyecto);
        console.log(`Proyecto creado: ${proyecto.nombre}`);
      } else {
        console.log(`Proyecto ya existente: ${proyecto.nombre}`);
      }
    }
  }
}