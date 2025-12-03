import {
  Injectable,
  Inject,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { IUsersService } from './interfaces/users.service.interface';
import type { IUsersRepository } from './interfaces/users.repository.interface';
import { IUSERS_REPOSITORY } from './interfaces/users.repository.interface';
import { CreateClientDto } from './dto/create-client.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { validatePasswordStrength } from './helpers/password.validator';
import { PaginationResponseUserDto } from './dto/pag-response-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Area } from 'src/areasResponsables/schemas/area.schema';
import { UserDocument } from './schemas/user.schema';
import { hashSync } from 'bcrypt';
import type { IMailerService } from 'src/mailer/interfaces/mailer.service.interface';

@Injectable()
export class UsersService implements IUsersService {
  constructor(
    @Inject(IUSERS_REPOSITORY)
    private readonly repository: IUsersRepository,

    @InjectModel('Area')
    private readonly areaModel: Model<Area>,

    @Inject('IMailerService')
    private readonly mailerService: IMailerService,
  ) {}

  //Sacamos el password para la respuesta
  private sanitize(user: any) {
    if (!user) return null;
    if (typeof user.toObject === 'function') {
      const { password, ...clean } = user.toObject();
      return clean;
    }
    const { password, ...clean } = user;
    return clean;
  }

  //Sacamos el password para una respuesta paginada.
  private sanitizePagination(response: PaginationResponseUserDto) {
    return {
      ...response,
      data: response.data.map((u) => this.sanitize(u)),
    };
  }

  async registerClient(
    dto: CreateClientDto,
  ): Promise<Omit<UserDocument, 'password'>> {
    if (await this.repository.findByEmail(dto.email))
      throw new ConflictException('El email ya está registrado');
    // Validar fuerza de la contraseña principal
    validatePasswordStrength(
      dto.password,
      dto.email,
      dto.firstName,
      dto.lastName,
    );

    // Validar que coincida con passwordConfirmation
    if (dto.password !== dto.passwordConfirmation) {
      throw new BadRequestException({
        message: 'Las contraseñas no coinciden',
        errors: ['passwordConfirmation debe ser igual a password'],
      });
    }
    const user = await this.repository.createClient(dto);
    const welcomeMessage = `
      <h2>Bienvenido al Sistema de Gestión de Reclamos</h2>
      <p>Estimado/a ${dto.firstName} ${dto.lastName},</p>
      <p>Tu cuenta ha sido creada exitosamente como usuario cliente.</p>
      <p><strong>Detalles de tu cuenta:</strong></p>
      <ul>
        <li><strong>Nombre:</strong> ${dto.firstName} ${dto.lastName}</li>
        <li><strong>Email:</strong> ${dto.email}</li>
      </ul>
      <p><strong>Instrucciones para el primer ingreso:</strong></p>
      <ol>
        <li>Accedé al sistema utilizando tu correo electrónico: <strong>${dto.email}</strong></li>
        <li>Ingresá la contraseña que definiste durante el registro</li>
        <li>Te recomendamos cambiar tu contraseña periódicamente para mayor seguridad</li>
      </ol>
      <p>Si tenés alguna duda o inconveniente, podés contactarte con el equipo de soporte.</p>
      <p>Saludos cordiales,<br>Equipo de Programación Avanzada</p>
    `;
    this.mailerService.sendMail(
      dto.email,
      'Bienvenido al Sistema de Gestión de Reclamos',
      welcomeMessage,
    );
    return this.sanitize(user);
  }

  async createStaff(
    dto: CreateStaffDto,
  ): Promise<Omit<UserDocument, 'password'>> {
    if (await this.repository.findByEmail(dto.email))
      throw new ConflictException('El email ya está registrado');

    validatePasswordStrength(
      dto.password,
      dto.email,
      dto.firstName,
      dto.lastName,
    );

    if (dto.password !== dto.passwordConfirmation) {
      throw new BadRequestException({
        message: 'Las contraseñas no coinciden',
        errors: ['passwordConfirmation debe ser igual a password'],
      });
    }

    // Validar que las áreas existan
    for (const areaId of dto.areaIds) {
      const exists = await this.areaModel.findById(areaId);
      if (!exists)
        throw new BadRequestException(`Área no encontrada: ${areaId}`);
    }

    const user = await this.repository.createStaff(dto);

    // Enviar correo de bienvenida
    const areasNames = await Promise.all(
      dto.areaIds.map(async (areaId) => {
        const area = await this.areaModel.findById(areaId);
        return area ? area.nombre : '';
      }),
    );

    const welcomeMessage = `
      <h2>Bienvenido al Sistema de Gestión de Reclamos</h2>
      <p>Estimado/a ${dto.firstName} ${dto.lastName},</p>
      <p>Su cuenta ha sido creada exitosamente en el sistema.</p>
      <p><strong>Detalles de su cuenta:</strong></p>
      <ul>
        <li><strong>Rol:</strong> ${dto.role}</li>
        <li><strong>Email:</strong> ${dto.email}</li>
        <li><strong>Áreas Responsables:</strong> ${areasNames.filter((n) => n).join(', ') || 'Sin áreas asignadas'}</li>
      </ul>
      <p><strong>Instrucciones para el primer inicio de sesión:</strong></p>
      <ol>
        <li>Acceda al sistema utilizando su correo electrónico: <strong>${dto.email}</strong></li>
        <li>Ingrese la contraseña temporal que le fue proporcionada</li>
        <li>Le recomendamos cambiar su contraseña después del primer inicio de sesión para mayor seguridad</li>
      </ol>
      <p>Si tiene alguna pregunta o necesita asistencia, no dude en contactarnos.</p>
      <p>Saludos cordiales,<br>Equipo de Gestión de Reclamos</p>
    `;

    this.mailerService.sendMail(
      dto.email,
      'Bienvenido al Sistema de Gestión de Reclamos',
      welcomeMessage,
    );

    return this.sanitize(user);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<Omit<UserDocument, 'password'> | null> {
    const existing = await this.repository.findRawById(userId);
    if (!existing) throw new BadRequestException('Usuario no encontrado');
    if (existing.deletedAt)
      throw new BadRequestException(
        'No se puede modificar un usuario eliminado',
      );

    if (dto.password) {
      validatePasswordStrength(
        dto.password,
        existing.email,
        existing.firstName,
        existing.lastName,
      );

      if (dto.password !== dto.passwordConfirmation) {
        throw new BadRequestException({
          message: 'Las contraseñas no coinciden',
          errors: ['passwordConfirmation debe ser igual a password'],
        });
      }
    }

    if (dto.email && dto.email !== existing.email) {
      const emailTaken = await this.repository.findByEmail(dto.email);
      if (emailTaken)
        throw new ConflictException('El email ya está registrado');
    }

    const updated = await this.repository.update(userId, dto);
    return this.sanitize(updated);
  }

  async updateStaff(
    userId: string,
    dto: UpdateStaffDto,
  ): Promise<Omit<UserDocument, 'password'> | null> {
    delete dto.passwordConfirmation;

    const existing = await this.repository.findRawById(userId);
    if (!existing) throw new BadRequestException('Usuario no encontrado');
    if (existing.deletedAt)
      throw new BadRequestException(
        'No se puede modificar un usuario eliminado',
      );

    if (dto.password) {
      validatePasswordStrength(
        dto.password,
        existing.email,
        existing.firstName,
        existing.lastName,
      );
    }

    if (dto.areaIds) {
      if (dto.areaIds.length === 0) {
        throw new BadRequestException(
          'Un staff debe tener al menos un área asignada',
        );
      }

      for (const areaId of dto.areaIds) {
        if (!Types.ObjectId.isValid(areaId)) {
          throw new BadRequestException(`Área inválida: ${areaId}`);
        }
        const exists = await this.areaModel.findById(areaId);
        if (!exists)
          throw new BadRequestException(`Área no encontrada: ${areaId}`);
      }
    }

    if (dto.email && dto.email !== existing.email) {
      const emailTaken = await this.repository.findByEmail(dto.email);
      if (emailTaken)
        throw new ConflictException('El email ya está registrado');
    }

    const updated = await this.repository.update(userId, dto);
    return this.sanitize(updated);
  }

  async findAll(query: GetUsersQueryDto): Promise<PaginationResponseUserDto> {
    const response = await this.repository.findAll(query);
    return this.sanitizePagination(response);
  }

  async findDeleted(
    query: GetUsersQueryDto,
  ): Promise<PaginationResponseUserDto> {
    const response = await this.repository.findDeleted(query);
    return this.sanitizePagination(response);
  }

  //No usamos sanitize(user) acá pq este método lo usamos para el login. Si sacamos el pwd, no login.
  async findByEmail(email: string): Promise<UserDocument | null> {
    return await this.repository.findByEmail(email);
  }

  async findById(
    userId: string,
  ): Promise<Omit<UserDocument, 'password'> | null> {
    const user = await this.repository.findRawById(userId);
    return this.sanitize(user);
  }

  async softDelete(
    userId: string,
    emailConfirmation: string,
  ): Promise<Omit<UserDocument, 'password'> | null> {
    const user = await this.repository.findRawById(userId);
    if (!user)
      throw new BadRequestException(`Usuario con id ${userId} no existe`);
    if (user.deletedAt)
      throw new BadRequestException('El usuario ya está eliminado');

    // Validar que el email de confirmación coincida con el email del usuario
    if (user.email.toLowerCase() !== emailConfirmation.toLowerCase()) {
      throw new BadRequestException(
        'El email de confirmación no coincide con el email del usuario',
      );
    }

    const deletedUser = await this.repository.softDelete(userId);
    return this.sanitize(deletedUser);
  }

  async restore(
    userId: string,
  ): Promise<Omit<UserDocument, 'password'> | null> {
    const user = await this.repository.findRawById(userId);

    if (!user)
      throw new BadRequestException(`Usuario con id ${userId} no existe`);
    if (!user.deletedAt)
      throw new BadRequestException('El usuario no está eliminado');

    const restoredUser = await this.repository.restore(userId);
    return this.sanitize(restoredUser);
  }

  //Métodos para recuperación de contraseña
  /*
    RECUPERACIÓN CONTRASEÑA
  */
  async setResetPasswordToken(
    userId: string,
    token: string,
    expires: Date,
  ): Promise<void> {
    await this.repository.update(userId, {
      resetPasswordToken: token,
      resetPasswordExpires: expires,
    });
  }

  async findByResetToken(token: string): Promise<UserDocument | null> {
    return this.repository.findByResetToken(token);
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    await this.repository.update(userId, {
      password: newPassword, //Lo pasamos plano pq el repository es el que hashea.
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });
  }

  async sendPasswordResetEmail(
    email: string,
    resetLink: string,
  ): Promise<void> {
    await this.mailerService.sendMail(
      email,
      'Recuperación de contraseña',
      `<p>Para restablecer tu contraseña haz clic en el siguiente enlace:</p>
      <a href="${resetLink}">${resetLink}</a>`,
    );
  }

  async findEncargadosByArea(
    areaId: string,
  ): Promise<Omit<UserDocument, 'password'>[]> {
    const encargados = await this.repository.findEncargadosByArea(areaId);
    return encargados.map((e) => this.sanitize(e));
  }

  async sendTwoFactorEmail(email: string, code: string): Promise<void> {
    await this.mailerService.sendMail(
      email,
      'Código de verificación 2FA',
      `<p>Tu código de verificación es: <strong>${code}</strong></p>
       <p>Este código expirará en 10 minutos.</p>`,
    );
  }

  async setTwoFactorCode(
    userId: string,
    code: string,
    expires: Date,
  ): Promise<void> {
    await this.repository.update(userId, {
      twoFactorCode: code,
      twoFactorCodeExpires: expires,
    });
  }
}
