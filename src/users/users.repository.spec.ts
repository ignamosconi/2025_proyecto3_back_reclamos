import { Test, TestingModule } from '@nestjs/testing';
import { UsersRepository } from './users.repository';
import { getModelToken } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { BadRequestException } from '@nestjs/common';
import { ClienteRole, StaffRole } from './helpers/enum.roles';
import { Types } from 'mongoose';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('UsersRepository', () => {
  let repository: UsersRepository;
  let model: any;

  const mockExec = jest.fn();
  const mockSort = jest.fn().mockReturnThis();
  const mockSkip = jest.fn().mockReturnThis();
  const mockLimit = jest.fn().mockReturnThis();
  const mockPopulate = jest.fn().mockReturnThis();

  class MockModel {
    save: any;
    data: any;
    constructor(data: any) {
      this.data = data;
      this.save = jest.fn().mockResolvedValue(this.data);
    }
    static create = jest.fn();
    static findOne = jest.fn().mockReturnValue({
      populate: mockPopulate,
      exec: mockExec,
      then: (resolve) => mockExec().then(resolve),
    });
    static findById = jest.fn().mockReturnValue({
      populate: mockPopulate,
      exec: mockExec,
      then: (resolve) => mockExec().then(resolve),
    });
    static find = jest.fn().mockReturnValue({
      populate: mockPopulate,
      sort: mockSort,
      skip: mockSkip,
      limit: mockLimit,
      exec: mockExec,
      then: (resolve) => mockExec().then(resolve),
    });
    static countDocuments = jest.fn().mockReturnValue(0);
    static findByIdAndUpdate = jest.fn().mockReturnValue({
      populate: mockPopulate,
      exec: mockExec,
      then: (resolve) => mockExec().then(resolve),
    });
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        {
          provide: getModelToken(User.name),
          useValue: MockModel,
        },
      ],
    }).compile();

    repository = module.get<UsersRepository>(UsersRepository);
    model = module.get(getModelToken(User.name));

    jest.clearAllMocks();
    mockPopulate.mockReturnThis();
    mockSort.mockReturnThis();
    mockSkip.mockReturnThis();
    mockLimit.mockReturnThis();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('createClient', () => {
    it('should create a client', async () => {
      const dto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password',
        passwordConfirmation: 'password',
        phone: '123',
      };
      const expectedUser = { ...dto, role: ClienteRole.CLIENTE };
      MockModel.create.mockResolvedValue(expectedUser);

      const result = await repository.createClient(dto);
      expect(MockModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: dto.email,
          role: ClienteRole.CLIENTE,
        }),
      );
      expect(result).toEqual(expectedUser);
    });
  });

  describe('createStaff', () => {
    it('should create a staff', async () => {
      const dto = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        password: 'password',
        passwordConfirmation: 'password',
        role: StaffRole.ENCARGADO,
        areaIds: [new Types.ObjectId().toString()],
      };
      MockModel.create.mockResolvedValue(dto);

      const result = await repository.createStaff(dto);
      expect(MockModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: dto.email,
          role: StaffRole.ENCARGADO,
        }),
      );
      expect(result).toEqual(dto);
    });
  });

  describe('findByEmail', () => {
    it('should find by email', async () => {
      mockExec.mockResolvedValue({ email: 'test@test.com' });
      await repository.findByEmail('test@test.com');
      expect(MockModel.findOne).toHaveBeenCalledWith({
        email: 'test@test.com',
      });
    });
  });

  describe('findRawById', () => {
    it('should find by id', async () => {
      mockExec.mockResolvedValue({ _id: '1' });
      await repository.findRawById('1');
      expect(MockModel.findById).toHaveBeenCalledWith('1');
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      mockExec.mockResolvedValue([]);
      const result = await repository.findAll({});
      expect(MockModel.find).toHaveBeenCalled();
      expect(result.data).toEqual([]);
    });

    it('should apply search filter', async () => {
      mockExec.mockResolvedValue([]);
      await repository.findAll({ search: 'test' });
      const findArgs = MockModel.find.mock.calls[0][0];
      expect(findArgs.$or).toBeDefined();
    });
  });

  describe('findDeleted', () => {
    it('should return deleted users', async () => {
      mockExec.mockResolvedValue([]);
      await repository.findDeleted({});
      const findArgs = MockModel.find.mock.calls[0][0];
      expect(findArgs.deletedAt).toEqual({ $ne: null });
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      mockExec.mockResolvedValue({ _id: '1' });
      await repository.update('1', { firstName: 'New' });
      expect(MockModel.findByIdAndUpdate).toHaveBeenCalled();
    });
  });

  describe('softDelete', () => {
    it('should soft delete user', async () => {
      const mockUser = new MockModel({ _id: '1' });
      mockExec.mockResolvedValue(mockUser);

      await repository.softDelete('1');
      expect(mockUser.save).toHaveBeenCalled();
      expect((mockUser as any).deletedAt).toBeDefined();
    });

    it('should throw BadRequest if not found', async () => {
      mockExec.mockResolvedValue(null);
      await expect(repository.softDelete('1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequest if already deleted', async () => {
      const mockUser = new MockModel({ _id: '1' });
      (mockUser as any).deletedAt = new Date();
      mockExec.mockResolvedValue(mockUser);
      await expect(repository.softDelete('1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('restore', () => {
    it('should restore user', async () => {
      await repository.restore('1');
      expect(MockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '1',
        { deletedAt: null },
        { new: true },
      );
    });
  });

  describe('findByResetToken', () => {
    it('should find by reset token', async () => {
      await repository.findByResetToken('token');
      expect(MockModel.findOne).toHaveBeenCalledWith({
        resetPasswordToken: 'token',
      });
    });
  });
});
