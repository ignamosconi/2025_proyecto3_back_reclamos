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
    const ventas = await this.areasRepo.findByName('Ventas');
    const soporte = await this.areasRepo.findByName('Soporte Técnico');
    const facturacion = await this.areasRepo.findByName('Facturación');

    const defaultAreas = [ventas, soporte, facturacion]
      .filter(Boolean)
      .map(a => a!.id);

    const users = [
      {
        firstName: 'Cliente 1',
        lastName: 'Test 1',
        email: 'cliente1@test.com',
        password: 'Utnfrvm123!',
        role: UserRole.CLIENTE,
        areas: [],
      },
      {
        firstName: 'Cliente 2',
        lastName: 'Test 2',
        email: 'cliente2@test.com',
        password: 'Utnfrvm123!',
        role: UserRole.CLIENTE,
        areas: [],
      },
      {
        firstName: 'Encargado 1',
        lastName: 'Test 1',
        email: 'encargado1@test.com',
        password: 'Utnfrvm123!',
        role: StaffRole.ENCARGADO,
        areas: defaultAreas,
      },
      {
        firstName: 'Encargado 2',
        lastName: 'Test 2',
        email: 'encargado2@test.com',
        password: 'Utnfrvm123!',
        role: StaffRole.ENCARGADO,
        areas: defaultAreas,
      },
      {
        firstName: 'Gerente 1',
        lastName: 'Test 1',
        email: 'gerente1@test.com',
        password: 'Utnfrvm123!',
        role: StaffRole.GERENTE,
        areas: defaultAreas,
      },
      {
        firstName: 'Gerente 2',
        lastName: 'Test 2',
        email: 'gerente2@test.com',
        password: 'Utnfrvm123!',
        role: StaffRole.GERENTE,
        areas: defaultAreas,
      },
    ];


    for (const user of users) {
      const existing = await this.usersRepo.findByEmail(user.email);

      if (existing) {
        console.log(`Usuario ya existente: ${user.email}`);
        continue;
      }

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
      console.log(`Usuario creado: ${user.email}`);
    }
  }
}
