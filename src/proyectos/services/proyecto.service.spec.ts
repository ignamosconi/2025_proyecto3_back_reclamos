import { Test, TestingModule } from '@nestjs/testing';
import { ProyectosService } from './proyecto.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../../users/schemas/user.schema';
import { Area } from '../../areasResponsables/schemas/area.schema';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Types } from 'mongoose';

describe('ProyectosService', () => {
  let service: ProyectosService;
  let mockRepository: any;
  let mockUserModel: any;
  let mockAreaModel: any;

  const mockProyecto = {
    _id: 'proyecto-id-123',
    nombre: 'Proyecto Alpha',
    cliente: 'client-id-123',
    areaResponsable: 'area-id-123',
    deletedAt: null,
  };

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findRawById: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      findDeleted: jest.fn(),
      restore: jest.fn(),
    };

    mockUserModel = {
      exists: jest.fn(),
    };

    mockAreaModel = {
      exists: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProyectosService,
        { provide: 'IProyectosRepository', useValue: mockRepository },
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(Area.name), useValue: mockAreaModel },
      ],
    }).compile();

    service = module.get<ProyectosService>(ProyectosService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      nombre: 'Proyecto Alpha',
      cliente: new Types.ObjectId().toHexString(),
      areaResponsable: new Types.ObjectId().toHexString(),
      descripcion: 'Desc',
      fechaInicio: new Date(),
    };

    it('debería crear un proyecto exitosamente', async () => {
      mockRepository.findByName.mockResolvedValue(null);
      mockUserModel.exists.mockResolvedValue(true);
      mockAreaModel.exists.mockResolvedValue(true);
      mockRepository.create.mockResolvedValue(mockProyecto);

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(mockRepository.create).toHaveBeenCalled();
    });

    it('debería fallar si el nombre ya existe', async () => {
      mockRepository.findByName.mockResolvedValue(mockProyecto);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('debería fallar si el cliente no existe', async () => {
      mockRepository.findByName.mockResolvedValue(null);
      mockUserModel.exists.mockResolvedValue(false);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debería fallar si el área no existe', async () => {
      mockRepository.findByName.mockResolvedValue(null);
      mockUserModel.exists.mockResolvedValue(true);
      mockAreaModel.exists.mockResolvedValue(false);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto = { nombre: 'Proyecto Beta' };

    it('debería actualizar un proyecto exitosamente', async () => {
      mockRepository.findRawById.mockResolvedValue(mockProyecto);
      mockRepository.findByName.mockResolvedValue(null);
      mockRepository.update.mockResolvedValue({
        ...mockProyecto,
        nombre: 'Proyecto Beta',
      });

      const result = await service.update('proyecto-id-123', updateDto);

      expect(result.nombre).toBe('Proyecto Beta');
    });

    it('debería fallar si el proyecto está eliminado', async () => {
      mockRepository.findRawById.mockResolvedValue({
        ...mockProyecto,
        deletedAt: new Date(),
      });

      await expect(
        service.update('proyecto-id-123', updateDto),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
