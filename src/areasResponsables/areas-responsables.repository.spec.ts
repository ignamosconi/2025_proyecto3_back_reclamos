import { Test, TestingModule } from '@nestjs/testing';
import { AreasResponsablesRepository } from './areas-responsables.repository';
import { getModelToken } from '@nestjs/mongoose';
import { Area } from './schemas/area.schema';
import { BadRequestException } from '@nestjs/common';

describe('AreasResponsablesRepository', () => {
  let repository: AreasResponsablesRepository;
  let mockModel: any;

  const mockArea = {
    _id: 'area-id-123',
    nombre: 'Sistemas',
    deletedAt: null,
    save: jest.fn(),
  };

  beforeEach(async () => {
    mockModel = {
      create: jest.fn(),
      countDocuments: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AreasResponsablesRepository,
        { provide: getModelToken(Area.name), useValue: mockModel },
      ],
    }).compile();

    repository = module.get<AreasResponsablesRepository>(
      AreasResponsablesRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('softDelete - Edge Cases', () => {
    it('debería eliminar lógicamente si existe y no está eliminado', async () => {
      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockArea),
      });
      mockArea.save.mockResolvedValue({ ...mockArea, deletedAt: new Date() });

      const result = await repository.softDelete('area-id-123');

      expect(result.deletedAt).toBeDefined();
      expect(mockArea.save).toHaveBeenCalled();
    });

    it('debería lanzar BadRequestException si el área no existe', async () => {
      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(repository.softDelete('non-existent')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debería lanzar BadRequestException si ya está eliminada', async () => {
      const deletedArea = { ...mockArea, deletedAt: new Date() };
      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(deletedArea),
      });

      await expect(repository.softDelete('area-id-123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('create', () => {
    it('should create an area', async () => {
      const dto = { nombre: 'Sistemas' };
      mockModel.create.mockReturnValue({
        save: jest.fn().mockResolvedValue(mockArea),
      });
      const result = await repository.create(dto);
      expect(result).toEqual(mockArea);
    });
  });

  describe('findAll', () => {
    it('should return paginated areas', async () => {
      mockModel.countDocuments.mockResolvedValue(1);
      mockModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockArea]),
      });
      const result = await repository.findAll({});
      expect(result.data).toEqual([mockArea]);
      expect(result.total).toBe(1);
    });
  });

  describe('findDeleted', () => {
    it('should return deleted areas', async () => {
      mockModel.countDocuments.mockResolvedValue(1);
      mockModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockArea]),
      });
      const result = await repository.findDeleted({});
      expect(result.data).toEqual([mockArea]);
      expect(result.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return an area by id', async () => {
      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockArea),
      });
      const result = await repository.findOne('id-123');
      expect(result).toEqual(mockArea);
    });
  });

  describe('update', () => {
    it('should update an area', async () => {
      mockModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockArea),
      });
      const result = await repository.update('id-123', { nombre: 'New' });
      expect(result).toEqual(mockArea);
    });
  });

  describe('restore', () => {
    it('should restore an area', async () => {
      mockModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockArea),
      });
      const result = await repository.restore('id-123');
      expect(result).toEqual(mockArea);
    });
  });

  describe('findByName', () => {
    it('should return an area by name', async () => {
      mockModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockArea),
      });
      const result = await repository.findByName('Sistemas');
      expect(result).toEqual(mockArea);
    });
  });

  describe('findRawById', () => {
    it('should return raw area by id', async () => {
      mockModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockArea),
      });
      const result = await repository.findRawById('id-123');
      expect(result).toEqual(mockArea);
    });
  });
});
