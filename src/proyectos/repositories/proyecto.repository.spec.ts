import { Test, TestingModule } from '@nestjs/testing';
import { ProyectosRepository } from './proyecto.repository';
import { getModelToken } from '@nestjs/mongoose';
import { Proyecto } from '../schemas/proyecto.schema';
import { Types } from 'mongoose';

describe('ProyectosRepository', () => {
  let repository: ProyectosRepository;
  let model: any;

  const mockExec = jest.fn();
  const mockSort = jest.fn().mockReturnThis();
  const mockSkip = jest.fn().mockReturnThis();
  const mockLimit = jest.fn().mockReturnThis();
  const mockPopulate = jest.fn().mockReturnThis();

  // Mock constructor for new Model(data)
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
    static findOne = jest.fn().mockReturnValue({
      populate: mockPopulate,
      exec: mockExec,
    });
    static findById = jest.fn().mockReturnValue({
      exec: mockExec,
    });
    static findOneAndUpdate = jest.fn().mockReturnValue({
      populate: mockPopulate,
      exec: mockExec,
    });
    static countDocuments = jest.fn().mockReturnValue({
      exec: mockExec,
    });
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProyectosRepository,
        {
          provide: getModelToken(Proyecto.name),
          useValue: MockModel,
        },
      ],
    }).compile();

    repository = module.get<ProyectosRepository>(ProyectosRepository);
    model = module.get(getModelToken(Proyecto.name));

    jest.clearAllMocks();

    // Reset chain mocks
    mockSort.mockReturnThis();
    mockSkip.mockReturnThis();
    mockLimit.mockReturnThis();
    mockPopulate.mockReturnThis();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a new project', async () => {
      const data = { nombre: 'Test Project' };
      const result = await repository.create(data as any);
      expect(result).toEqual(data);
    });
  });

  describe('findById', () => {
    it('should find by id and populate', async () => {
      const id = 'p1';
      mockExec.mockResolvedValue({ _id: id });

      await repository.findById(id);

      expect(MockModel.findOne).toHaveBeenCalledWith({
        _id: id,
        deletedAt: null,
      });
      expect(mockPopulate).toHaveBeenCalled();
    });
  });

  describe('findByName', () => {
    it('should find by name', async () => {
      const name = 'Project A';
      mockExec.mockResolvedValue({ nombre: name });

      await repository.findByName(name);

      expect(MockModel.findOne).toHaveBeenCalledWith({
        nombre: name,
        deletedAt: null,
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated results with filters', async () => {
      const query = { page: 1, limit: 10, search: 'test' };
      const mockData = [{ nombre: 'test' }];
      mockExec.mockResolvedValueOnce(1); // count
      mockExec.mockResolvedValueOnce(mockData); // find

      const result = await repository.findAll(query);

      expect(result.total).toBe(1);
      expect(result.data).toEqual(mockData);
      expect(MockModel.find).toHaveBeenCalled();

      // Check search filter construction
      const findArgs = MockModel.find.mock.calls[0][0];
      expect(findArgs.$or).toBeDefined();
    });

    it('should apply cliente filter', async () => {
      const clienteId = new Types.ObjectId().toHexString();
      mockExec.mockResolvedValueOnce(0);
      mockExec.mockResolvedValueOnce([]);

      await repository.findAll({}, clienteId);

      const findArgs = MockModel.find.mock.calls[0][0];
      expect(findArgs.cliente).toBeDefined();
    });

    it('should apply areas filter', async () => {
      const areaId = new Types.ObjectId().toHexString();
      mockExec.mockResolvedValueOnce(0);
      mockExec.mockResolvedValueOnce([]);

      await repository.findAll({}, undefined, [areaId]);

      const findArgs = MockModel.find.mock.calls[0][0];
      expect(findArgs.areaResponsable.$in).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update and return new document', async () => {
      const id = 'p1';
      const data = { nombre: 'New Name' };
      mockExec.mockResolvedValue({ _id: id, ...data });

      await repository.update(id, data);

      expect(MockModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: id, deletedAt: null },
        data,
        { new: true },
      );
    });
  });

  describe('softDelete', () => {
    it('should set deletedAt', async () => {
      const id = 'p1';
      mockExec.mockResolvedValue({ _id: id, deletedAt: new Date() });

      await repository.softDelete(id);

      const updateArgs = MockModel.findOneAndUpdate.mock.calls[0][1];
      expect(updateArgs.deletedAt).toBeDefined();
    });
  });

  describe('restore', () => {
    it('should unset deletedAt', async () => {
      const id = 'p1';
      mockExec.mockResolvedValue({ _id: id, deletedAt: null });

      await repository.restore(id);

      expect(MockModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: id, deletedAt: { $ne: null } },
        { deletedAt: null },
        { new: true },
      );
    });
  });
});
