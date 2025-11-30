import { Test, TestingModule } from '@nestjs/testing';
import { SintesisRepository } from './sintesis.repository';
import { getModelToken } from '@nestjs/mongoose';
import { Sintesis } from '../schemas/sintesis.schema';
import { Types } from 'mongoose';

describe('SintesisRepository', () => {
  let repository: SintesisRepository;
  let model: any;

  const mockExec = jest.fn();
  const mockSort = jest.fn().mockReturnThis();
  const mockPopulate = jest.fn().mockReturnThis();

  class MockModel {
    static create = jest.fn();
    static find = jest.fn().mockReturnValue({
      sort: mockSort,
      populate: mockPopulate,
      exec: mockExec,
    });
    static findById = jest.fn().mockReturnValue({
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
        SintesisRepository,
        {
          provide: getModelToken(Sintesis.name),
          useValue: MockModel,
        },
      ],
    }).compile();

    repository = module.get<SintesisRepository>(SintesisRepository);
    model = module.get(getModelToken(Sintesis.name));

    jest.clearAllMocks();
    mockSort.mockReturnThis();
    mockPopulate.mockReturnThis();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a sintesis', async () => {
      const data = { descripcion: 'desc', nombre: 'name' };
      const reclamoId = new Types.ObjectId().toString();
      const creadorId = new Types.ObjectId().toString();
      const areaId = new Types.ObjectId().toString();

      MockModel.create.mockResolvedValue({ _id: 's1', ...data });

      const result = await repository.create(
        data,
        reclamoId,
        creadorId,
        areaId,
      );

      expect(MockModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          descripcion: data.descripcion,
          nombre: data.nombre,
        }),
      );
      expect(result).toBeDefined();
    });
  });

  describe('findByReclamoId', () => {
    it('should find by reclamo id, sort and populate', async () => {
      const reclamoId = new Types.ObjectId().toString();
      mockExec.mockResolvedValue([]);

      await repository.findByReclamoId(reclamoId);

      expect(MockModel.find).toHaveBeenCalled();
      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockPopulate).toHaveBeenCalledTimes(2); // creador and area
    });
  });

  describe('countByReclamoId', () => {
    it('should count documents', async () => {
      const reclamoId = new Types.ObjectId().toString();
      mockExec.mockResolvedValue(5);

      const result = await repository.countByReclamoId(reclamoId);

      expect(MockModel.countDocuments).toHaveBeenCalled();
      expect(result).toBe(5);
    });
  });

  describe('findById', () => {
    it('should find by id and populate', async () => {
      const id = 's1';
      mockExec.mockResolvedValue({ _id: id });

      await repository.findById(id);

      expect(MockModel.findById).toHaveBeenCalledWith(id);
      expect(mockPopulate).toHaveBeenCalledTimes(3); // reclamo, creador, area
    });
  });
});
