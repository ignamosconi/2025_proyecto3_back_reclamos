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
        nombre: 'Cliente',
        apellido: 'Test',
        email: 'cliente@test.com',
        password: 'Utnfrvm123!',
        rol: UserRole.CLIENTE,
        areas: [],
      },
      {
        nombre: 'Encargado',
        apellido: 'Test',
        email: 'encargado@test.com',
        password: 'Utnfrvm123!',
        rol: StaffRole.ENCARGADO,
        areas: defaultAreas,
      },
      {
        nombre: 'Gerente',
        apellido: 'Test',
        email: 'gerente@test.com',
        password: 'Utnfrvm123!',
        rol: StaffRole.GERENTE,
        areas: defaultAreas,
      },
    ];


    for (const user of users) {
      const existing = await this.usersRepo.findByEmail(user.email);

      if (existing) {
        console.log(`Usuario ya existente: ${user.email}`);
        continue;
      }

      if (user.rol === UserRole.CLIENTE) {
        await this.usersRepo.createClient({
          nombre: user.nombre,
          apellido: user.apellido,
          email: user.email,
          password: user.password,
          passwordConfirmation: user.password,
        });
      } else {
        await this.usersRepo.createStaff({
          nombre: user.nombre,
          apellido: user.apellido,
          email: user.email,
          password: user.password,
          passwordConfirmation: user.password,
          rol: user.rol as StaffRole,
          areaIds: user.areas,
        });
      }
      console.log(`Usuario creado: ${user.email}`);
    }
  }
}
