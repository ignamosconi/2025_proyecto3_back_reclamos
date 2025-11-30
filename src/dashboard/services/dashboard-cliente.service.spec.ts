import { Test, TestingModule } from '@nestjs/testing';
import { DashboardClienteService } from './dashboard-cliente.service';
import { getModelToken } from '@nestjs/mongoose';
import { Reclamo } from '../../reclamo/schemas/reclamo.schema';
import { DashboardClienteQueryDto } from '../dto/dashboard-cliente-query.dto';
import { Types } from 'mongoose';
import { EstadoReclamo } from '../../reclamo/enums/estado.enum';

describe('DashboardClienteService', () => {
  let service: DashboardClienteService;
  let reclamoModel: any;

  const mockReclamoModel = {
    aggregate: jest.fn(),
    countDocuments: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardClienteService,
        {
          provide: getModelToken(Reclamo.name),
          useValue: mockReclamoModel,
        },
      ],
    }).compile();

    service = module.get<DashboardClienteService>(DashboardClienteService);
    reclamoModel = module.get(getModelToken(Reclamo.name));
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboardMetrics', () => {
    const userId = new Types.ObjectId().toHexString();
    const query: DashboardClienteQueryDto = {
      startDate: '2023-01-01',
      endDate: '2023-01-31',
    };

    it('should return dashboard metrics with correct structure', async () => {
      // Mock responses
      const claimsPerProjectMock = [
        { proyectoId: 'p1', proyectoNombre: 'Proyecto 1', cantidad: 5 },
      ];
      const claimsByStatusMock = [
        { _id: EstadoReclamo.PENDIENTE, cantidad: 3 },
      ];
      const resolutionTimeMock = [{ totalDays: 10, count: 2 }];
      const totalClaimsMock = 10;

      // Mock aggregate calls in order
      reclamoModel.aggregate
        .mockResolvedValueOnce(claimsPerProjectMock) // 1. Claims per project
        .mockResolvedValueOnce(claimsByStatusMock) // 2. Claims by status
        .mockResolvedValueOnce(resolutionTimeMock); // 3. Resolution time

      reclamoModel.countDocuments.mockResolvedValueOnce(totalClaimsMock);

      const result = await service.getDashboardMetrics(userId, query);

      expect(result).toBeDefined();
      expect(result.claimsPerProject).toEqual(claimsPerProjectMock);
      expect(result.claimsByStatus).toEqual([
        { estado: EstadoReclamo.PENDIENTE, cantidad: 3 },
      ]);
      expect(result.averageResolutionTime).toBe(5); // 10 / 2
      expect(result.totalClaims).toBe(totalClaimsMock);
      expect(reclamoModel.aggregate).toHaveBeenCalledTimes(3);
      expect(reclamoModel.countDocuments).toHaveBeenCalledTimes(1);
    });

    it('should handle empty resolution time data', async () => {
      reclamoModel.aggregate
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]); // Empty resolution time

      reclamoModel.countDocuments.mockResolvedValueOnce(0);

      const result = await service.getDashboardMetrics(userId, query);

      expect(result.averageResolutionTime).toBe(0);
    });

    it('should filter by proyectoId if provided', async () => {
      const queryWithProject: DashboardClienteQueryDto = {
        ...query,
        proyectoId: new Types.ObjectId().toHexString(),
      };

      reclamoModel.aggregate
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      reclamoModel.countDocuments.mockResolvedValueOnce(0);

      await service.getDashboardMetrics(userId, queryWithProject);

      // Check the second aggregate call (claimsByStatus) which uses the project filter
      const secondCallArgs = reclamoModel.aggregate.mock.calls[1][0];
      const matchStage = secondCallArgs[0].$match;
      expect(matchStage.fkProyecto).toBeDefined();
      expect(matchStage.fkProyecto.toString()).toBe(
        queryWithProject.proyectoId,
      );
    });

    // Decision Table for Date Range Logic (Implicitly testing helper integration via service)
    it('should use specificDay if provided', async () => {
      const queryDay: DashboardClienteQueryDto = {
        specificDay: '2023-10-10',
      };

      reclamoModel.aggregate.mockResolvedValue([]);
      reclamoModel.countDocuments.mockResolvedValue(0);

      const result = await service.getDashboardMetrics(userId, queryDay);

      expect(result.dateRange.start).toEqual(expect.any(Date));
      expect(result.dateRange.end).toEqual(expect.any(Date));
      // Verify start and end are same day
      expect(result.dateRange.start.getDate()).toBe(
        result.dateRange.end.getDate(),
      );
    });
  });
});
