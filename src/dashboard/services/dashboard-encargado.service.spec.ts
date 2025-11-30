import { Test, TestingModule } from '@nestjs/testing';
import { DashboardEncargadoService } from './dashboard-encargado.service';
import { getModelToken } from '@nestjs/mongoose';
import { Reclamo } from '../../reclamo/schemas/reclamo.schema';
import { ReclamoEncargado } from '../../reclamo/schemas/reclamo-encargado.schema';
import { DashboardEncargadoQueryDto } from '../dto/dashboard-encargado-query.dto';
import { Types } from 'mongoose';
import { EstadoReclamo } from '../../reclamo/enums/estado.enum';

describe('DashboardEncargadoService', () => {
  let service: DashboardEncargadoService;
  let reclamoModel: any;
  let reclamoEncargadoModel: any;

  const mockReclamoModel = {
    aggregate: jest.fn(),
    countDocuments: jest.fn(),
  };

  const mockReclamoEncargadoModel = {
    find: jest.fn(),
  };

  const mockExec = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardEncargadoService,
        {
          provide: getModelToken(Reclamo.name),
          useValue: mockReclamoModel,
        },
        {
          provide: getModelToken(ReclamoEncargado.name),
          useValue: mockReclamoEncargadoModel,
        },
      ],
    }).compile();

    service = module.get<DashboardEncargadoService>(DashboardEncargadoService);
    reclamoModel = module.get(getModelToken(Reclamo.name));
    reclamoEncargadoModel = module.get(getModelToken(ReclamoEncargado.name));

    jest.clearAllMocks();
    mockReclamoEncargadoModel.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        exec: mockExec,
      }),
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboardMetrics', () => {
    const encargadoId = new Types.ObjectId().toHexString();
    const query: DashboardEncargadoQueryDto = {};

    it('should return empty metrics if no reclamos assigned', async () => {
      mockExec.mockResolvedValueOnce([]); // No assigned reclamos

      const result = await service.getDashboardMetrics(encargadoId, query);

      expect(result.totalClaims).toBe(0);
      expect(result.claimsPerMonth).toEqual([]);
      expect(reclamoModel.aggregate).not.toHaveBeenCalled();
    });

    it('should return metrics when reclamos are assigned', async () => {
      const assignedReclamos = [{ fkReclamo: new Types.ObjectId() }];
      mockExec.mockResolvedValueOnce(assignedReclamos);

      // Mock aggregations
      const claimsPerMonthMock = [
        { year: 2023, month: 1, resueltos: 5, noResueltos: 2, total: 7 },
      ];
      const claimsByTypeMock = [
        { tipoReclamoId: 't1', tipoReclamoNombre: 'Tipo 1', cantidad: 10 },
      ];
      const avgResTimeMock = [
        { tipoReclamoId: 't1', tipoReclamoNombre: 'Tipo 1', promedioDias: 2.5 },
      ];
      const resolvedPerMonthMock = [{ periodo: '2023-1', cantidad: 5 }];
      const resolvedPerWeekMock = [{ periodo: '2023-W1', cantidad: 5 }];
      const resolvedPerDayMock = [{ periodo: '2023-1-1', cantidad: 5 }];
      const totalClaimsMock = 20;

      reclamoModel.aggregate
        .mockResolvedValueOnce(claimsPerMonthMock)
        .mockResolvedValueOnce(claimsByTypeMock)
        .mockResolvedValueOnce(avgResTimeMock)
        .mockResolvedValueOnce(resolvedPerMonthMock)
        .mockResolvedValueOnce(resolvedPerWeekMock)
        .mockResolvedValueOnce(resolvedPerDayMock);

      reclamoModel.countDocuments.mockResolvedValueOnce(totalClaimsMock);

      const result = await service.getDashboardMetrics(encargadoId, query);

      expect(result.claimsPerMonth).toEqual(claimsPerMonthMock);
      expect(result.claimsByType).toEqual(claimsByTypeMock);
      expect(result.averageResolutionTimeByType).toEqual(avgResTimeMock);
      expect(result.resolvedClaimsByPeriod.length).toBe(3); // Month + Week + Day
      expect(result.totalClaims).toBe(totalClaimsMock);
    });

    it('should filter by estado if provided', async () => {
      const assignedReclamos = [{ fkReclamo: new Types.ObjectId() }];
      mockExec.mockResolvedValueOnce(assignedReclamos);

      const queryWithEstado: DashboardEncargadoQueryDto = {
        estado: EstadoReclamo.RESUELTO,
      };

      reclamoModel.aggregate.mockResolvedValue([]); // Mock all aggregates returning empty
      reclamoModel.countDocuments.mockResolvedValue(0);

      await service.getDashboardMetrics(encargadoId, queryWithEstado);

      const firstCallArgs = reclamoModel.aggregate.mock.calls[0][0];
      const matchStage = firstCallArgs[0].$match;
      expect(matchStage.estado).toBe(EstadoReclamo.RESUELTO);
    });
  });
});
