import { Test, TestingModule } from '@nestjs/testing';
import { AreasResponsablesService } from './areas-responsables.service';
import { IAREAS_RESPONSABLES_REPOSITORY } from './interfaces/areas-responsables.repository.interface';
import { ConflictException, BadRequestException } from '@nestjs/common';

describe('AreasResponsablesService', () => {
  let service: AreasResponsablesService;
  let mockRepository: any;

  const mockArea = {
    _id: 'area-id-123',
    nombre: 'Sistemas',
    deletedAt: null,
  };

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findDeleted: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
      findByName: jest.fn(),
      findRawById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AreasResponsablesService,
        { provide: IAREAS_RESPONSABLES_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<AreasResponsablesService>(AreasResponsablesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create - Tabla de Decisión', () => {
    // Tabla de Decisión:
    // | Caso | Nombre Existe? | Resultado Esperado |
    // |------|----------------|--------------------|
    // | 1    | No             | Crea Área          |
    // | 2    | Sí             | ConflictException  |

    test.each([
      {
        desc: 'Caso 1: Nombre único -> Crea Área',
        nombreExiste: false,
        expectedError: null,
      },
      {
        desc: 'Caso 2: Nombre duplicado -> ConflictException',
        nombreExiste: true,
        expectedError: ConflictException,
      },
    ])('$desc', async ({ nombreExiste, expectedError }) => {
      const dto = { nombre: 'Sistemas' };
      mockRepository.findByName.mockResolvedValue(
        nombreExiste ? mockArea : null,
      );
      mockRepository.create.mockResolvedValue(mockArea);

      if (expectedError) {
        await expect(service.create(dto)).rejects.toThrow(expectedError);
      } else {
        const result = await service.create(dto);
        expect(result).toEqual(mockArea);
        expect(mockRepository.create).toHaveBeenCalledWith(dto);
      }
    });
  });

  describe('update - Tabla de Decisión y Partición de Equivalencia', () => {
    // Tabla de Decisión:
    // | Caso | ID Existe? | Eliminado (Soft)? | Resultado Esperado |
    // |------|------------|-------------------|--------------------|
    // | 1    | Sí         | No                | Actualiza          |
    // | 2    | No         | N/A               | BadRequestException|
    // | 3    | Sí         | Sí                | BadRequestException|

    test.each([
      {
        desc: 'Caso 1: ID existe y activo -> Actualiza',
        exists: true,
        deleted: false,
        expectedError: null,
      },
      {
        desc: 'Caso 2: ID no existe -> BadRequestException',
        exists: false,
        deleted: false, // Irrelevante
        expectedError: BadRequestException,
      },
      {
        desc: 'Caso 3: ID existe pero eliminado -> BadRequestException',
        exists: true,
        deleted: true,
        expectedError: BadRequestException,
      },
    ])('$desc', async ({ exists, deleted, expectedError }) => {
      const dto = { nombre: 'Nuevo Nombre' };

      let foundArea = null;
      if (exists) {
        foundArea = { ...mockArea, deletedAt: deleted ? new Date() : null };
      }

      mockRepository.findRawById.mockResolvedValue(foundArea);
      mockRepository.update.mockResolvedValue({ ...mockArea, ...dto });

      if (expectedError) {
        await expect(service.update('id-123', dto)).rejects.toThrow(
          expectedError,
        );
      } else {
        const result = await service.update('id-123', dto);
        expect(result.nombre).toBe(dto.nombre);
      }
    });
  });

  describe('findAll', () => {
    it('should return paginated areas', async () => {
      const response = { data: [mockArea], total: 1 };
      mockRepository.findAll.mockResolvedValue(response);
      const result = await service.findAll({});
      expect(result).toEqual(response);
    });
  });

  describe('findDeleted', () => {
    it('should return deleted areas', async () => {
      const response = { data: [mockArea], total: 1 };
      mockRepository.findDeleted.mockResolvedValue(response);
      const result = await service.findDeleted({});
      expect(result).toEqual(response);
    });
  });

  describe('findOne', () => {
    it('should return an area by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockArea);
      const result = await service.findOne('id-123');
      expect(result).toEqual(mockArea);
    });
  });

  describe('softDelete', () => {
    it('should call repository softDelete', async () => {
      mockRepository.softDelete.mockResolvedValue(mockArea);
      const result = await service.softDelete('id-123');
      expect(result).toEqual(mockArea);
      expect(mockRepository.softDelete).toHaveBeenCalledWith('id-123');
    });
  });

  describe('restore', () => {
    it('should call repository restore', async () => {
      mockRepository.restore.mockResolvedValue(mockArea);
      const result = await service.restore('id-123');
      expect(result).toEqual(mockArea);
      expect(mockRepository.restore).toHaveBeenCalledWith('id-123');
    });
  });

  describe('findByName', () => {
    it('should return an area by name', async () => {
      mockRepository.findByName.mockResolvedValue(mockArea);
      const result = await service.findByName('Sistemas');
      expect(result).toEqual(mockArea);
      expect(mockRepository.findByName).toHaveBeenCalledWith('Sistemas');
    });
  });
});
