import { Test, TestingModule } from '@nestjs/testing';
import { TipoReclamoRepository } from './tipo-reclamo.repository';
import { getModelToken } from '@nestjs/mongoose';
import { TipoReclamo } from './schemas/tipo-reclamo.schema';
import { BadRequestException } from '@nestjs/common';

describe('TipoReclamoRepository', () => {
  let repository: TipoReclamoRepository;
  let model: any;

  const mockExec = jest.fn();
  const mockSort = jest.fn().mockReturnThis();
  const mockSkip = jest.fn().mockReturnThis();
  const mockLimit = jest.fn().mockReturnThis();

  class MockModel {
    save: any;
    deletedAt: Date | null;
    nombre: string;

    constructor(public data: any) {
      this.save = jest.fn().mockResolvedValue(this.data);
      this.deletedAt = data.deletedAt || null;
      this.nombre = data.nombre;
    }
    static create = jest.fn();
    static find = jest.fn().mockReturnValue({
      sort: mockSort,
      skip: mockSkip,
      limit: mockLimit,
      exec: mockExec,
    });
    static findById = jest.fn().mockReturnValue({
      exec: mockExec,
    });
    static findOne = jest.fn().mockReturnValue({
      exec: mockExec,
    });
    static findByIdAndUpdate = jest.fn().mockReturnValue({
      exec: mockExec,
    });
    static countDocuments = jest.fn().mockReturnValue(0);
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TipoReclamoRepository,
        {
          provide: getModelToken(TipoReclamo.name),
          useValue: MockModel,
        },
      ],
    }).compile();

    repository = module.get<TipoReclamoRepository>(TipoReclamoRepository);
    model = module.get(getModelToken(TipoReclamo.name));

    jest.clearAllMocks();
    mockSort.mockReturnThis();
    mockSkip.mockReturnThis();
    mockLimit.mockReturnThis();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create and save', async () => {
      const data = { nombre: 'Test' };
      const mockInstance = new MockModel(data);
      MockModel.create.mockResolvedValue(mockInstance);

      const result = await repository.create(data as any);
      expect(MockModel.create).toHaveBeenCalledWith(data);
      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      mockExec.mockResolvedValue([]);
      const result = await repository.findAll({});
      expect(MockModel.find).toHaveBeenCalledWith({ deletedAt: null });
      expect(result.data).toEqual([]);
    });
  });

  describe('softDelete', () => {
    it('should soft delete', async () => {
      const mockDoc = new MockModel({ _id: '1', nombre: 'Test' });
      mockDoc.save = jest.fn().mockResolvedValue(mockDoc);
      mockExec.mockResolvedValue(mockDoc);

      await repository.softDelete('1');
      expect(mockDoc.deletedAt).toBeDefined();
      expect(mockDoc.save).toHaveBeenCalled();
    });

    it('should throw BadRequest if not found', async () => {
      mockExec.mockResolvedValue(null);
      await expect(repository.softDelete('1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequest if already deleted', async () => {
      const mockDoc = new MockModel({ _id: '1', deletedAt: new Date() });
      mockExec.mockResolvedValue(mockDoc);
      await expect(repository.softDelete('1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
