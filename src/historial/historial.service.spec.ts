import { Test, TestingModule } from '@nestjs/testing';
import { HistorialService } from './historial.service';
import { HistorialRepository } from './historial.repository';
import { AccionesHistorial } from './helpers/acciones-historial.enum';
import { Types } from 'mongoose';

describe('HistorialService', () => {
  let service: HistorialService;
  let repository: any;

  const mockRepository = {
    create: jest.fn(),
    findByReclamoId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HistorialService,
        { provide: HistorialRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<HistorialService>(HistorialService);
    repository = module.get(HistorialRepository);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    // Decision Table for Create
    // | reclamoId | accion | detalle | responsableId | metadata | Result |
    // |-----------|--------|---------|---------------|----------|--------|
    // | Valid     | Valid  | Valid   | Valid         | Valid    | Success|
    // | Valid     | Valid  | Valid   | Valid         | Undefined| Success|

    it('should create a historial entry with metadata', async () => {
      const reclamoId = new Types.ObjectId();
      const responsableId = new Types.ObjectId();
      const accion = AccionesHistorial.CREACION;
      const detalle = 'Reclamo creado';
      const metadata = { ip: '127.0.0.1' };

      const expectedData = {
        reclamoId,
        accion,
        detalle,
        responsable: responsableId,
        fecha_hora: expect.any(Date),
        metadata,
      };

      mockRepository.create.mockResolvedValue({ _id: 'h1', ...expectedData });

      const result = await service.create(
        reclamoId,
        accion,
        detalle,
        responsableId,
        metadata,
      );

      expect(mockRepository.create).toHaveBeenCalledWith(expectedData);
      expect(result).toBeDefined();
    });

    it('should create a historial entry without metadata', async () => {
      const reclamoId = 'r1';
      const responsableId = 'u1';
      const accion = AccionesHistorial.CAMBIO_ESTADO;
      const detalle = 'Cambio de estado';

      const expectedData = {
        reclamoId,
        accion,
        detalle,
        responsable: responsableId,
        fecha_hora: expect.any(Date),
        metadata: undefined,
      };

      mockRepository.create.mockResolvedValue({ _id: 'h2', ...expectedData });

      await service.create(reclamoId, accion, detalle, responsableId);

      expect(mockRepository.create).toHaveBeenCalledWith(expectedData);
    });
  });

  describe('findAllByReclamo', () => {
    it('should return all historial entries for a reclamo', async () => {
      const reclamoId = 'r1';
      const mockHistorial = [{ _id: 'h1', accion: 'test' }];
      mockRepository.findByReclamoId.mockResolvedValue(mockHistorial);

      const result = await service.findAllByReclamo(reclamoId);

      expect(mockRepository.findByReclamoId).toHaveBeenCalledWith(reclamoId);
      expect(result).toEqual(mockHistorial);
    });

    it('should return empty array if no entries found', async () => {
      const reclamoId = 'r2';
      mockRepository.findByReclamoId.mockResolvedValue([]);

      const result = await service.findAllByReclamo(reclamoId);

      expect(result).toEqual([]);
    });
  });
});
