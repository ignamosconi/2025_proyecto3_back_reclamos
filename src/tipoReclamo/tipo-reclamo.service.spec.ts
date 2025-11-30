import { Test, TestingModule } from '@nestjs/testing';
import { TipoReclamoService } from './tipo-reclamo.service';
import { ITIPO_RECLAMO_REPOSITORY } from './interfaces/tipo-reclamo.repository.interface';
import { ConflictException, BadRequestException } from '@nestjs/common';

describe('TipoReclamoService', () => {
  let service: TipoReclamoService;
  let mockRepository: any;

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
        TipoReclamoService,
        { provide: ITIPO_RECLAMO_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<TipoReclamoService>(TipoReclamoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const dto = { nombre: 'Test', descripcion: 'Desc' };

    it('should create successfully', async () => {
      mockRepository.findByName.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue({ _id: '1', ...dto });

      const result = await service.create(dto);
      expect(result).toBeDefined();
      expect(mockRepository.create).toHaveBeenCalledWith(dto);
    });

    it('should throw ConflictException if name exists', async () => {
      mockRepository.findByName.mockResolvedValue({ _id: '1', ...dto });
      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    const id = '1';
    const dto = { nombre: 'Updated' };

    it('should update successfully', async () => {
      mockRepository.findRawById.mockResolvedValue({
        _id: id,
        deletedAt: null,
      });
      mockRepository.update.mockResolvedValue({ _id: id, ...dto });

      const result = await service.update(id, dto);
      expect(result).toBeDefined();
    });

    it('should throw BadRequest if not found', async () => {
      mockRepository.findRawById.mockResolvedValue(null);
      await expect(service.update(id, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequest if deleted', async () => {
      mockRepository.findRawById.mockResolvedValue({
        _id: id,
        deletedAt: new Date(),
      });
      await expect(service.update(id, dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const result = { data: [], total: 0 };
      mockRepository.findAll.mockResolvedValue(result);
      expect(await service.findAll({})).toBe(result);
    });
  });

  describe('softDelete', () => {
    it('should call repository softDelete', async () => {
      await service.softDelete('1');
      expect(mockRepository.softDelete).toHaveBeenCalledWith('1');
    });
  });
});
