// src/seeders/users.seeder.ts
import type { IUsersRepository } from '../users/interfaces/users.repository.interface';
import type { IAreasResponsablesRepository } from '../areasResponsables/interfaces/areas-responsables.repository.interface';
import { UserRole, StaffRole } from '../users/helpers/enum.roles';

export class UsersSeeder {
  constructor(
    private readonly usersRepo: IUsersRepository,
    private readonly areasRepo: IAreasResponsablesRepository,
  ) {}

  async run() {
    console.log('--- Seeding usuarios ---');

    // Obtenemos todas las áreas existentes
    const allAreasResponse = await this.areasRepo.findAll({
      limit: 100,
      page: 1,
    } as any);
    const areaIds = allAreasResponse.data.map((a: any) =>
      String(a._id || a.id),
    );

    if (areaIds.length === 0) {
      console.log('No hay áreas disponibles. Saltando seed de usuarios.');
      return;
    }

    // Datos de nombres para generar usuarios variados
    const firstNames = [
      'Juan',
      'María',
      'Carlos',
      'Ana',
      'Luis',
      'Laura',
      'Pedro',
      'Sofía',
      'Miguel',
      'Elena',
      'Roberto',
      'Carmen',
      'Fernando',
      'Isabel',
      'Javier',
      'Patricia',
      'Diego',
      'Andrea',
      'Ricardo',
      'Lucía',
      'Antonio',
      'Mónica',
      'José',
      'Paula',
      'Manuel',
      'Cristina',
      'Álvaro',
      'Natalia',
      'Francisco',
      'Beatriz',
      'Pablo',
      'Marta',
      'Alejandro',
      'Raquel',
      'Sergio',
      'Elena',
      'David',
      'Silvia',
      'Jorge',
      'Teresa',
      'Víctor',
      'Clara',
      'Rubén',
      'Diana',
      'Andrés',
      'Rosa',
      'Óscar',
      'Celia',
      'Raúl',
      'Inés',
    ];

    const lastNames = [
      'García',
      'Rodríguez',
      'González',
      'Fernández',
      'López',
      'Martínez',
      'Sánchez',
      'Pérez',
      'Gómez',
      'Martín',
      'Jiménez',
      'Ruiz',
      'Hernández',
      'Díaz',
      'Moreno',
      'Álvarez',
      'Muñoz',
      'Romero',
      'Alonso',
      'Gutiérrez',
      'Navarro',
      'Torres',
      'Domínguez',
      'Vázquez',
      'Ramos',
      'Gil',
      'Ramírez',
      'Serrano',
      'Blanco',
      'Suárez',
      'Molina',
      'Morales',
      'Ortega',
      'Delgado',
      'Castro',
      'Ortiz',
      'Rubio',
      'Marín',
      'Sanz',
      'Núñez',
      'Iglesias',
      'Medina',
      'Garrido',
      'Cortés',
      'Castillo',
      'Santos',
      'Lozano',
      'Guerrero',
      'Cano',
      'Prieto',
    ];

    const companies = [
      'TechCorp',
      'DigitalSolutions',
      'InnovateHub',
      'DataSystems',
      'CloudServices',
      'WebDev',
      'SoftWorks',
      'NetSolutions',
      'CodeMasters',
      'DevTeam',
      'BizTech',
      'StartupX',
      'MegaCorp',
      'FastTech',
      'SmartBiz',
    ];

    const password = 'Utnfrvm123!';

    interface UserData {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      role: UserRole | StaffRole;
      areas: string[];
    }

    // Usuarios específicos con datos interesantes para dashboard
    const usuariosEspeciales: UserData[] = [
      {
        firstName: 'Alejandro',
        lastName: 'Martínez',
        email: 'alejandro.martinez@techcorp.com',
        password,
        role: UserRole.CLIENTE,
        areas: [],
      },
      {
        firstName: 'María',
        lastName: 'González',
        email: 'maria.gonzalez@empresa.com',
        password,
        role: StaffRole.ENCARGADO,
        areas: areaIds.slice(0, 3), // Primeras 3 áreas
      },
      {
        firstName: 'Carlos',
        lastName: 'Rodríguez',
        email: 'carlos.rodriguez@empresa.com',
        password,
        role: StaffRole.GERENTE,
        areas: areaIds, // Todas las áreas
      },
    ];

    // Crear usuarios especiales primero
    for (const user of usuariosEspeciales) {
      const existing = await this.usersRepo.findByEmail(user.email);
      if (!existing) {
        try {
          if (user.role === UserRole.CLIENTE) {
            await this.usersRepo.createClient({
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              password: user.password,
              passwordConfirmation: user.password,
            });
            console.log(`Usuario especial creado (CLIENTE): ${user.email}`);
          } else {
            await this.usersRepo.createStaff({
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              password: user.password,
              passwordConfirmation: user.password,
              role: user.role as StaffRole,
              areaIds: user.areas,
            });
            console.log(
              `Usuario especial creado (${user.role}): ${user.email}`,
            );
          }
        } catch (error) {
          console.error(
            `Error al crear usuario especial ${user.email}:`,
            error,
          );
        }
      } else {
        console.log(`Usuario especial ya existente: ${user.email}`);
      }
    }

    // Generar 37 clientes más (40 total incluyendo el especial)
    const clientes: UserData[] = [];
    for (let i = 1; i <= 40; i++) {
      const firstName = firstNames[(i - 1) % firstNames.length];
      const lastName = lastNames[(i - 1) % lastNames.length];
      const company = companies[Math.floor((i - 1) / 3) % companies.length];
      clientes.push({
        firstName,
        lastName,
        email: `cliente${i}@${company.toLowerCase()}.com`,
        password,
        role: UserRole.CLIENTE,
        areas: [],
      });
    }

    // Generar 25 encargados distribuidos en diferentes áreas
    const encargados: UserData[] = [];
    for (let i = 1; i <= 25; i++) {
      const firstName = firstNames[(i + 39) % firstNames.length];
      const lastName = lastNames[(i + 39) % lastNames.length];
      const areasForUser: string[] = [];
      // Asignar 1-3 áreas aleatorias a cada encargado
      const numAreas = Math.floor(Math.random() * 3) + 1;
      const shuffled = [...areaIds].sort(() => 0.5 - Math.random());
      areasForUser.push(...shuffled.slice(0, numAreas));

      encargados.push({
        firstName,
        lastName,
        email: `encargado${i}@empresa.com`,
        password,
        role: StaffRole.ENCARGADO,
        areas: areasForUser,
      });
    }

    // Generar 15 gerentes con acceso a múltiples áreas
    const gerentes: UserData[] = [];
    for (let i = 1; i <= 15; i++) {
      const firstName = firstNames[(i + 64) % firstNames.length];
      const lastName = lastNames[(i + 64) % lastNames.length];
      const areasForUser: string[] = [];
      // Gerentes tienen acceso a más áreas (2-5)
      const numAreas = Math.floor(Math.random() * 4) + 2;
      const shuffled = [...areaIds].sort(() => 0.5 - Math.random());
      areasForUser.push(
        ...shuffled.slice(0, Math.min(numAreas, areaIds.length)),
      );

      gerentes.push({
        firstName,
        lastName,
        email: `gerente${i}@empresa.com`,
        password,
        role: StaffRole.GERENTE,
        areas: areasForUser,
      });
    }

    const allUsers = [...clientes, ...encargados, ...gerentes];
    let created = 0;
    let skipped = 0;

    for (const user of allUsers) {
      const existing = await this.usersRepo.findByEmail(user.email);

      if (existing) {
        console.log(`Usuario ya existente: ${user.email}`);
        skipped++;
        continue;
      }

      try {
        if (user.role === UserRole.CLIENTE) {
          await this.usersRepo.createClient({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            password: user.password,
            passwordConfirmation: user.password,
          });
        } else {
          await this.usersRepo.createStaff({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            password: user.password,
            passwordConfirmation: user.password,
            role: user.role as StaffRole,
            areaIds: user.areas,
          });
        }
        created++;
        if (created % 10 === 0) {
          console.log(`Usuarios creados: ${created}/${allUsers.length}`);
        }
      } catch (error) {
        console.error(`Error al crear usuario ${user.email}:`, error);
      }
    }

    console.log(
      `Usuarios procesados: ${created} creados, ${skipped} ya existentes`,
    );
  }
}
