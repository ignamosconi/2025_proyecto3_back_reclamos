import { Test, TestingModule } from '@nestjs/testing';
import { ProyectosService } from './proyecto.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../../users/schemas/user.schema';
import { Area } from '../../areasResponsables/schemas/area.schema';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
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
    cliente: { _id: 'client-id-123' },
    areaResponsable: { _id: 'area-id-123' },
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
      findById: jest.fn(),
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

    it('should create a project successfully', async () => {
      mockRepository.findByName.mockResolvedValue(null);
      mockUserModel.exists.mockResolvedValue(true);
      mockAreaModel.exists.mockResolvedValue(true);
      mockRepository.create.mockResolvedValue(mockProyecto);

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(mockRepository.create).toHaveBeenCalled();
    });

    it('should fail if name already exists', async () => {
      mockRepository.findByName.mockResolvedValue(mockProyecto);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should fail if client does not exist', async () => {
      mockRepository.findByName.mockResolvedValue(null);
      mockUserModel.exists.mockResolvedValue(false);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should fail if area does not exist', async () => {
      mockRepository.findByName.mockResolvedValue(null);
      mockUserModel.exists.mockResolvedValue(true);
      mockAreaModel.exists.mockResolvedValue(false);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll (RBAC)', () => {
    const query = {};

    // Decision Table for findAll
    // | Role      | UserId | Has Areas? | Result Filter |
    // | CLIENTE   | Yes    | -          | clienteFilter = userId |
    // | ENCARGADO | Yes    | Yes        | areasFilter = [areaIds] |
    // | ENCARGADO | Yes    | No         | areasFilter = ['invalid'] |
    // | GERENTE   | -      | -          | No filters |

    it('CLIENTE: should filter by userId', async () => {
      const userId = 'client-id-123';
      await service.findAll(query, userId, 'CLIENTE');
      expect(mockRepository.findAll).toHaveBeenCalledWith(
        query,
        userId,
        undefined,
      );
    });

    it('ENCARGADO: should filter by assigned areas', async () => {
      const userId = 'encargado-id';
      const areas = [{ _id: 'area1' }, { _id: 'area2' }];
      mockUserModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ areas }),
        }),
      });

      await service.findAll(query, userId, 'ENCARGADO');
      expect(mockRepository.findAll).toHaveBeenCalledWith(query, undefined, [
        'area1',
        'area2',
      ]);
    });

    it('ENCARGADO: should filter with invalid ID if no areas assigned', async () => {
      const userId = 'encargado-id';
      mockUserModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ areas: [] }),
        }),
      });

      await service.findAll(query, userId, 'ENCARGADO');
      expect(mockRepository.findAll).toHaveBeenCalledWith(query, undefined, [
        '000000000000000000000000',
      ]);
    });

    it('GERENTE: should not apply filters', async () => {
      await service.findAll(query, 'admin-id', 'GERENTE');
      expect(mockRepository.findAll).toHaveBeenCalledWith(
        query,
        undefined,
        undefined,
      );
    });
  });

  describe('findById (RBAC)', () => {
    const projectId = 'p1';

    // Decision Table for findById
    // | Role      | UserId | Owner/Area Match? | Result |
    // | CLIENTE   | Yes    | Yes (Owner)       | Success |
    // | CLIENTE   | Yes    | No                | Forbidden |
    // | ENCARGADO | Yes    | Yes (Area Match)  | Success |
    // | ENCARGADO | Yes    | No                | Forbidden |
    // | GERENTE   | -      | -                 | Success |

    it('CLIENTE: should return project if owner', async () => {
      const userId = 'client-id-123';
      mockRepository.findById.mockResolvedValue(mockProyecto); // mockProyecto has client-id-123

      const result = await service.findById(projectId, userId, 'CLIENTE');
      expect(result).toEqual(mockProyecto);
    });

    it('CLIENTE: should throw Forbidden if not owner', async () => {
      const userId = 'other-client';
      mockRepository.findById.mockResolvedValue(mockProyecto);

      await expect(
        service.findById(projectId, userId, 'CLIENTE'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('ENCARGADO: should return project if area matches', async () => {
      const userId = 'encargado-id';
      const areas = [{ _id: 'area-id-123' }]; // Matches mockProyecto area
      mockRepository.findById.mockResolvedValue(mockProyecto);
      mockUserModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ areas }),
        }),
      });

      const result = await service.findById(projectId, userId, 'ENCARGADO');
      expect(result).toEqual(mockProyecto);
    });

    it('ENCARGADO: should throw Forbidden if area does not match', async () => {
      const userId = 'encargado-id';
      const areas = [{ _id: 'other-area' }];
      mockRepository.findById.mockResolvedValue(mockProyecto);
      mockUserModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ areas }),
        }),
      });

      await expect(
        service.findById(projectId, userId, 'ENCARGADO'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if project not found', async () => {
      mockRepository.findById.mockResolvedValue(null);
      await expect(service.findById(projectId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto = { nombre: 'Proyecto Beta' };

    it('should update successfully', async () => {
      mockRepository.findRawById.mockResolvedValue(mockProyecto);
      mockRepository.findByName.mockResolvedValue(null);
      mockRepository.update.mockResolvedValue({
        ...mockProyecto,
        ...updateDto,
      });

      const result = await service.update('id', updateDto);
      expect(result.nombre).toBe('Proyecto Beta');
    });

    it('should fail if project is deleted', async () => {
      mockRepository.findRawById.mockResolvedValue({
        ...mockProyecto,
        deletedAt: new Date(),
      });
      await expect(service.update('id', updateDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should fail if name conflict exists', async () => {
      mockRepository.findRawById.mockResolvedValue(mockProyecto);
      mockRepository.findByName.mockResolvedValue({ _id: 'other-id' });
      await expect(service.update('id', updateDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('delete', () => {
    it('should soft delete successfully', async () => {
      mockRepository.softDelete.mockResolvedValue(mockProyecto);
      await service.delete('id');
      expect(mockRepository.softDelete).toHaveBeenCalledWith('id');
    });

    it('should throw NotFound if project not found', async () => {
      mockRepository.softDelete.mockResolvedValue(null);
      await expect(service.delete('id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('restore', () => {
    it('should restore successfully', async () => {
      mockRepository.restore.mockResolvedValue(mockProyecto);
      await service.restore('id');
      expect(mockRepository.restore).toHaveBeenCalledWith('id');
    });

    it('should throw NotFound if project not found or not deleted', async () => {
      mockRepository.restore.mockResolvedValue(null);
      await expect(service.restore('id')).rejects.toThrow(NotFoundException);
    });
  });
});
