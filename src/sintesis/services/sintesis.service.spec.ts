import { Test, TestingModule } from '@nestjs/testing';
import { SintesisService } from './sintesis.service';
import { ISINTESIS_REPOSITORY } from '../repositories/interfaces/sintesis.repository.interface';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../../users/schemas/user.schema';
import { ModuleRef } from '@nestjs/core';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateSintesisDto } from '../dto/create-sintesis.dto';

describe('SintesisService', () => {
  let service: SintesisService;
  let mockRepository: any;
  let mockReclamoService: any;
  let mockUserModel: any;
  let mockModuleRef: any;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      findByReclamoId: jest.fn(),
      findById: jest.fn(),
    };

    mockReclamoService = {
      findById: jest.fn(),
    };

    mockUserModel = {};

    mockModuleRef = {
      get: jest.fn().mockReturnValue(mockReclamoService),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SintesisService,
        { provide: ISINTESIS_REPOSITORY, useValue: mockRepository },
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: ModuleRef, useValue: mockModuleRef },
      ],
    }).compile();

    service = module.get<SintesisService>(SintesisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const dto: CreateSintesisDto = {
      descripcion: 'Valid description',
      nombre: 'Valid name',
    };
    const reclamoId = 'r1';
    const creadorId = 'u1';
    const areaId = 'a1';

    it('should create a sintesis successfully', async () => {
      mockRepository.create.mockResolvedValue({ _id: 's1', ...dto });

      const result = await service.create(dto, reclamoId, creadorId, areaId);

      expect(result).toBeDefined();
      expect(mockRepository.create).toHaveBeenCalledWith(
        dto,
        reclamoId,
        creadorId,
        areaId,
      );
    });

    it('should throw BadRequestException if description is too long', async () => {
      const longDto = { ...dto, descripcion: 'a'.repeat(1001) };
      await expect(
        service.create(longDto, reclamoId, creadorId, areaId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if name is too long', async () => {
      const longDto = { ...dto, nombre: 'a'.repeat(256) };
      await expect(
        service.create(longDto, reclamoId, creadorId, areaId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findByReclamoId', () => {
    it('should return sintesis list after validating access', async () => {
      const reclamoId = 'r1';
      const userId = 'u1';
      const userRole = 'CLIENTE';

      mockReclamoService.findById.mockResolvedValue({ _id: reclamoId });
      mockRepository.findByReclamoId.mockResolvedValue([{ _id: 's1' }]);

      const result = await service.findByReclamoId(reclamoId, userRole, userId);

      expect(mockReclamoService.findById).toHaveBeenCalledWith(
        reclamoId,
        userId,
        userRole,
      );
      expect(mockRepository.findByReclamoId).toHaveBeenCalledWith(reclamoId);
      expect(result).toHaveLength(1);
    });
  });

  describe('findById', () => {
    const id = 's1';
    const reclamoId = 'r1';
    const userId = 'u1';
    const userRole = 'CLIENTE';

    it('should return sintesis if found and belongs to reclamo', async () => {
      mockRepository.findById.mockResolvedValue({
        _id: id,
        fkReclamo: reclamoId, // String match
      });
      mockReclamoService.findById.mockResolvedValue({ _id: reclamoId });

      const result = await service.findById(id, reclamoId, userRole, userId);

      expect(result).toBeDefined();
      expect(mockReclamoService.findById).toHaveBeenCalledWith(
        reclamoId,
        userId,
        userRole,
      );
    });

    it('should return sintesis if found and belongs to reclamo (ObjectId)', async () => {
      mockRepository.findById.mockResolvedValue({
        _id: id,
        fkReclamo: { _id: reclamoId }, // Object match
      });
      mockReclamoService.findById.mockResolvedValue({ _id: reclamoId });

      const result = await service.findById(id, reclamoId, userRole, userId);

      expect(result).toBeDefined();
    });

    it('should return null if sintesis not found', async () => {
      mockRepository.findById.mockResolvedValue(null);
      const result = await service.findById(id, reclamoId, userRole, userId);
      expect(result).toBeNull();
    });

    it('should throw NotFoundException if sintesis does not belong to reclamo', async () => {
      mockRepository.findById.mockResolvedValue({
        _id: id,
        fkReclamo: 'other-reclamo',
      });

      await expect(
        service.findById(id, reclamoId, userRole, userId),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
