import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { IUSERS_REPOSITORY } from './interfaces/users.repository.interface';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { UserRole } from './helpers/enum.roles';
import { Types } from 'mongoose';

describe('UsersService', () => {
  let service: UsersService;
  let mockRepository: any;
  let mockAreaModel: any;
  let mockMailerService: any;

  const mockUser = {
    _id: 'user-id-123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'hashedPassword',
    role: UserRole.CLIENTE,
    toObject: jest.fn().mockReturnValue({
      _id: 'user-id-123',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'hashedPassword',
      role: UserRole.CLIENTE,
    }),
  };

  beforeEach(async () => {
    mockRepository = {
      findByEmail: jest.fn(),
      createClient: jest.fn(),
      createStaff: jest.fn(),
      findRawById: jest.fn(),
      update: jest.fn(),
      findAll: jest.fn(),
      findDeleted: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
      findByResetToken: jest.fn(),
    };

    mockAreaModel = {
      findById: jest.fn(),
    };

    mockMailerService = {
      sendMail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: IUSERS_REPOSITORY, useValue: mockRepository },
        { provide: getModelToken('Area'), useValue: mockAreaModel },
        { provide: 'IMailerService', useValue: mockMailerService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerClient', () => {
    const createClientDto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'SecurePass123!',
      passwordConfirmation: 'SecurePass123!',
      phone: '123456789',
    };

    it('debería registrar un cliente correctamente', async () => {
      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.createClient.mockResolvedValue(mockUser);

      const result = await service.registerClient(createClientDto);

      expect(result).toBeDefined();
      expect(result.email).toBe(createClientDto.email);
      expect(mockRepository.createClient).toHaveBeenCalled();
      expect(result).not.toHaveProperty('password');
    });

    it('debería fallar si el email ya existe', async () => {
      mockRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(service.registerClient(createClientDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('debería fallar si las contraseñas no coinciden', async () => {
      mockRepository.findByEmail.mockResolvedValue(null);
      const invalidDto = {
        ...createClientDto,
        passwordConfirmation: 'Mismatch123!',
      };

      await expect(service.registerClient(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('createStaff', () => {
    const createStaffDto = {
      firstName: 'Staff',
      lastName: 'User',
      email: 'staff@example.com',
      password: 'SecurePass123!',
      passwordConfirmation: 'SecurePass123!',
      role: UserRole.ENCARGADO,
      areaIds: [new Types.ObjectId().toString()],
    };

    it('debería crear un staff si el área existe', async () => {
      mockRepository.findByEmail.mockResolvedValue(null);
      mockAreaModel.findById.mockResolvedValue({
        _id: createStaffDto.areaIds[0],
      });
      mockRepository.createStaff.mockResolvedValue({
        ...mockUser,
        role: UserRole.ENCARGADO,
      });

      const result = await service.createStaff(createStaffDto);

      expect(result).toBeDefined();
      expect(mockAreaModel.findById).toHaveBeenCalledWith(
        createStaffDto.areaIds[0],
      );
      expect(mockRepository.createStaff).toHaveBeenCalled();
    });

    it('debería fallar si el área no existe', async () => {
      mockRepository.findByEmail.mockResolvedValue(null);
      mockAreaModel.findById.mockResolvedValue(null);

      await expect(service.createStaff(createStaffDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateProfile', () => {
    const updateDto = {
      firstName: 'Jane',
    };

    it('debería actualizar el perfil correctamente', async () => {
      mockRepository.findRawById.mockResolvedValue(mockUser);
      mockRepository.update.mockResolvedValue({
        ...mockUser,
        firstName: 'Jane',
        toObject: jest.fn().mockReturnValue({
          ...mockUser.toObject(),
          firstName: 'Jane',
        }),
      });

      const result = await service.updateProfile('user-id-123', updateDto);

      expect(result.firstName).toBe('Jane');
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('debería fallar si el usuario no existe', async () => {
      mockRepository.findRawById.mockResolvedValue(null);

      await expect(
        service.updateProfile('non-existent', updateDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('softDelete', () => {
    it('debería eliminar lógicamente un usuario', async () => {
      const deletedAt = new Date();
      mockRepository.softDelete.mockResolvedValue({
        ...mockUser,
        deletedAt: deletedAt,
        toObject: jest.fn().mockReturnValue({
          ...mockUser.toObject(),
          deletedAt: deletedAt,
        }),
      });

      const result = await service.softDelete('user-id-123');

      expect(result.deletedAt).toBeDefined();
      expect(mockRepository.softDelete).toHaveBeenCalledWith('user-id-123');
    });

    it('debería fallar si el usuario no existe', async () => {
      mockRepository.softDelete.mockResolvedValue(null);

      await expect(service.softDelete('non-existent')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('restore', () => {
    it('debería restaurar un usuario eliminado', async () => {
      const deletedUser = { ...mockUser, deletedAt: new Date() };
      mockRepository.findRawById.mockResolvedValue(deletedUser);
      mockRepository.restore.mockResolvedValue({
        ...mockUser,
        deletedAt: null,
        toObject: jest.fn().mockReturnValue({
          ...mockUser.toObject(),
          deletedAt: null,
        }),
      });

      const result = await service.restore('user-id-123');

      expect(result.deletedAt).toBeNull();
      expect(mockRepository.restore).toHaveBeenCalledWith('user-id-123');
    });

    it('debería fallar si el usuario no estaba eliminado', async () => {
      mockRepository.findRawById.mockResolvedValue(mockUser); // deletedAt is undefined/null

      await expect(service.restore('user-id-123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateStaff', () => {
    const updateDto = {
      firstName: 'Updated Staff',
      areaIds: [new Types.ObjectId().toString()],
    };

    it('should update staff successfully', async () => {
      mockRepository.findRawById.mockResolvedValue(mockUser);
      mockAreaModel.findById.mockResolvedValue({ _id: updateDto.areaIds[0] });
      mockRepository.update.mockResolvedValue({
        ...mockUser,
        firstName: 'Updated Staff',
        toObject: jest.fn().mockReturnValue({
          ...mockUser.toObject(),
          firstName: 'Updated Staff',
        }),
      });

      const result = await service.updateStaff('user-id', updateDto);
      expect(result.firstName).toBe('Updated Staff');
    });

    it('should fail if area invalid', async () => {
      mockRepository.findRawById.mockResolvedValue(mockUser);
      mockAreaModel.findById.mockResolvedValue(null);
      await expect(service.updateStaff('user-id', updateDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const response = { data: [mockUser], total: 1 };
      mockRepository.findAll.mockResolvedValue(response);
      const result = await service.findAll({});
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).not.toHaveProperty('password');
    });
  });

  describe('findDeleted', () => {
    it('should return deleted users', async () => {
      const response = { data: [mockUser], total: 1 };
      mockRepository.findDeleted.mockResolvedValue(response);
      const result = await service.findDeleted({});
      expect(result.data).toHaveLength(1);
    });
  });

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      mockRepository.findByEmail.mockResolvedValue(mockUser);
      const result = await service.findByEmail('test@test.com');
      expect(result).toBeDefined();
    });
  });

  describe('findById', () => {
    it('should return sanitized user', async () => {
      mockRepository.findRawById.mockResolvedValue(mockUser);
      const result = await service.findById('id');
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('Password Reset', () => {
    it('setResetPasswordToken should call update', async () => {
      await service.setResetPasswordToken('id', 'token', new Date());
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('findByResetToken should call repo', async () => {
      await service.findByResetToken('token');
      expect(mockRepository.findByResetToken).toHaveBeenCalledWith('token');
    });

    it('updatePassword should call update', async () => {
      await service.updatePassword('id', 'newpass');
      expect(mockRepository.update).toHaveBeenCalled();
    });

    it('sendPasswordResetEmail should call mailer', async () => {
      await service.sendPasswordResetEmail('email', 'link');
      expect(mockMailerService.sendMail).toHaveBeenCalled();
    });
  });
});
