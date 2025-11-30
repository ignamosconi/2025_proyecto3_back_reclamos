import { Test, TestingModule } from '@nestjs/testing';
import { ReclamoRepository } from './reclamo.repository';
import { getModelToken } from '@nestjs/mongoose';
import { Reclamo } from '../schemas/reclamo.schema';
import { ReclamoEncargado } from '../schemas/reclamo-encargado.schema';
import { Types } from 'mongoose';

describe('ReclamoRepository', () => {
  let repository: ReclamoRepository;
  let model: any;
  let encargadoModel: any;

  const mockExec = jest.fn();
  const mockSort = jest.fn().mockReturnThis();
  const mockSkip = jest.fn().mockReturnThis();
  const mockLimit = jest.fn().mockReturnThis();
  const mockPopulate = jest.fn().mockReturnThis();

  class MockModel {
    save: any;
    constructor(public data: any) {
      this.save = jest.fn().mockResolvedValue(this.data);
    }
    static find = jest.fn().mockReturnValue({
      populate: mockPopulate,
      sort: mockSort,
      skip: mockSkip,
      limit: mockLimit,
      exec: mockExec,
    });
    static findById = jest.fn().mockReturnValue({
      populate: mockPopulate,
      exec: mockExec,
    });
    static findByIdAndUpdate = jest.fn().mockReturnValue({
      exec: mockExec,
    });
    static countDocuments = jest.fn().mockReturnValue({
      exec: mockExec,
    });
    static deleteMany = jest.fn().mockReturnValue({
      exec: mockExec,
    });
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReclamoRepository,
        {
          provide: getModelToken(Reclamo.name),
          useValue: MockModel,
        },
        {
          provide: getModelToken(ReclamoEncargado.name),
          useValue: MockModel,
        },
      ],
    }).compile();

    repository = module.get<ReclamoRepository>(ReclamoRepository);
    model = module.get(getModelToken(Reclamo.name));
    encargadoModel = module.get(getModelToken(ReclamoEncargado.name));

    jest.clearAllMocks();
    mockPopulate.mockReturnThis();
    mockSort.mockReturnThis();
    mockSkip.mockReturnThis();
    mockLimit.mockReturnThis();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a new reclamo', async () => {
      const data = { titulo: 'Test' } as any;
      const result = await repository.create(data, 'client-id', 'area-id');
      expect(result).toBeDefined();
    });
  });

  describe('findById', () => {
    it('should find by id without populate', async () => {
      const id = new Types.ObjectId().toString();
      mockExec.mockResolvedValue({ _id: id });
      await repository.findById(id, false);
      expect(MockModel.findById).toHaveBeenCalledWith(id);
      expect(mockPopulate).not.toHaveBeenCalled();
    });

    it('should find by id with populate', async () => {
      const id = new Types.ObjectId().toString();
      mockExec.mockResolvedValue({ _id: id });
      await repository.findById(id, true);
      expect(MockModel.findById).toHaveBeenCalledWith(id);
      expect(mockPopulate).toHaveBeenCalled();
    });
  });

  describe('findAllPaginated', () => {
    it('should return paginated results with filters', async () => {
      const query = { page: 1, limit: 10 };
      mockExec.mockResolvedValueOnce([]); // find
      mockExec.mockResolvedValueOnce(0); // count

      const result = await repository.findAllPaginated(query);
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should apply cliente filter', async () => {
      mockExec.mockResolvedValueOnce([]);
      mockExec.mockResolvedValueOnce(0);
      await repository.findAllPaginated({ page: 1, limit: 10 }, 'client-id');
      const findArgs = MockModel.find.mock.calls[0][0];
      expect(findArgs.fkCliente).toBe('client-id');
    });

    it('should apply areas filter', async () => {
      mockExec.mockResolvedValueOnce([]);
      mockExec.mockResolvedValueOnce(0);
      const areaId = new Types.ObjectId().toString();
      await repository.findAllPaginated({ page: 1, limit: 10 }, undefined, [
        areaId,
      ]);
      const findArgs = MockModel.find.mock.calls[0][0];
      expect(findArgs.fkArea.$in).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update specific fields', async () => {
      const id = new Types.ObjectId().toString();
      const updateDto = { titulo: 'New Title' };
      mockExec.mockResolvedValue({ _id: id, ...updateDto });
      await repository.update(id, updateDto);
      expect(MockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        id,
        { $set: { titulo: 'New Title' } },
        { new: true },
      );
    });
  });

  describe('softDelete', () => {
    it('should set deletedAt', async () => {
      const id = new Types.ObjectId().toString();
      await repository.softDelete(id);
      const updateArgs = MockModel.findByIdAndUpdate.mock.calls[0][1];
      expect(updateArgs.$set.deletedAt).toBeDefined();
    });
  });

  describe('clearEncargados', () => {
    it('should delete assignments', async () => {
      const id = new Types.ObjectId().toString();
      await repository.clearEncargados(id);
      expect(MockModel.deleteMany).toHaveBeenCalled();
    });
  });
});
