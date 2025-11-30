import { Test, TestingModule } from '@nestjs/testing';
import { DashboardGerenteService } from './dashboard-gerente.service';
import { getModelToken } from '@nestjs/mongoose';
import { Reclamo } from '../../reclamo/schemas/reclamo.schema';
import { ReclamoEncargado } from '../../reclamo/schemas/reclamo-encargado.schema';
import { Historial } from '../../historial/schemas/historial.schema';
import { User } from '../../users/schemas/user.schema';
import { DashboardGerenteQueryDto } from '../dto/dashboard-gerente-query.dto';
import { EstadoReclamo } from '../../reclamo/enums/estado.enum';

describe('DashboardGerenteService', () => {
  let service: DashboardGerenteService;
  let reclamoModel: any;
  let reclamoEncargadoModel: any;
  let historialModel: any;

  const mockReclamoModel = {
    aggregate: jest.fn(),
    countDocuments: jest.fn(),
  };

  const mockReclamoEncargadoModel = {
    aggregate: jest.fn(),
  };

  const mockHistorialModel = {
    countDocuments: jest.fn(),
  };

  const mockUserModel = {}; // Not directly used in methods, but injected

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardGerenteService,
        { provide: getModelToken(Reclamo.name), useValue: mockReclamoModel },
        {
          provide: getModelToken(ReclamoEncargado.name),
          useValue: mockReclamoEncargadoModel,
        },
        {
          provide: getModelToken(Historial.name),
          useValue: mockHistorialModel,
        },
        { provide: getModelToken(User.name), useValue: mockUserModel },
      ],
    }).compile();

    service = module.get<DashboardGerenteService>(DashboardGerenteService);
    reclamoModel = module.get(getModelToken(Reclamo.name));
    reclamoEncargadoModel = module.get(getModelToken(ReclamoEncargado.name));
    historialModel = module.get(getModelToken(Historial.name));
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboardMetrics', () => {
    const query: DashboardGerenteQueryDto = {};

    it('should return all metrics correctly', async () => {
      // Mock Data
      const workloadMock = [
        { areaId: 'a1', areaNombre: 'Area 1', cantidad: 10 },
      ];
      const totalClaimsMock = 100;
      const topResolvedMock = [
        {
          empleadoId: 'e1',
          empleadoNombre: 'Emp 1',
          empleadoEmail: 'e@e.com',
          cantidadResueltos: 50,
        },
      ];
      const topEfficiencyMock = [
        {
          empleadoId: 'e1',
          empleadoNombre: 'Emp 1',
          empleadoEmail: 'e@e.com',
          promedioDias: 2.5,
        },
      ];
      const stateChangesMock = 200;
      const distributionMock = [
        { tipoReclamoId: 't1', tipoReclamoNombre: 'Tipo 1', cantidad: 50 },
        { tipoReclamoId: 't2', tipoReclamoNombre: 'Tipo 2', cantidad: 50 },
      ]; // 50%
      const criticalClaimsMock = 10; // 10%

      // Mock Calls
      reclamoModel.aggregate
        .mockResolvedValueOnce(workloadMock) // 1. Workload
        .mockResolvedValueOnce(distributionMock); // 6. Distribution (called later)

      reclamoModel.countDocuments
        .mockResolvedValueOnce(totalClaimsMock) // 2. Total Claims
        .mockResolvedValueOnce(criticalClaimsMock); // 7. Critical Claims

      reclamoEncargadoModel.aggregate
        .mockResolvedValueOnce(topResolvedMock) // 3. Top Resolved
        .mockResolvedValueOnce(topEfficiencyMock); // 4. Top Efficiency

      historialModel.countDocuments.mockResolvedValueOnce(stateChangesMock); // 5. State Changes

      const result = await service.getDashboardMetrics(query);

      expect(result.workloadByArea).toEqual(workloadMock);
      expect(result.totalClaims).toBe(totalClaimsMock);
      expect(result.topEmployeesByResolved).toEqual(topResolvedMock);
      expect(result.topEmployeesByEfficiency).toEqual(topEfficiencyMock);
      expect(result.stateChangesCount).toBe(stateChangesMock);
      expect(result.distributionByType[0].porcentaje).toBe(50); // 50/100
      expect(result.percentageCriticalClaims).toBe(10); // 10/100
    });

    it('should handle zero total claims for percentage calculation', async () => {
      reclamoModel.aggregate
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      reclamoModel.countDocuments
        .mockResolvedValueOnce(0) // Total claims 0
        .mockResolvedValueOnce(0);

      reclamoEncargadoModel.aggregate
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      historialModel.countDocuments.mockResolvedValueOnce(0);

      const result = await service.getDashboardMetrics(query);

      expect(result.percentageCriticalClaims).toBe(0);
      expect(result.distributionByType).toEqual([]);
    });

    it('should apply filters correctly', async () => {
      const queryWithFilter: DashboardGerenteQueryDto = {
        estado: EstadoReclamo.PENDIENTE,
      };

      reclamoModel.aggregate.mockResolvedValue([]);
      reclamoModel.countDocuments.mockResolvedValue(0);
      reclamoEncargadoModel.aggregate.mockResolvedValue([]);
      historialModel.countDocuments.mockResolvedValue(0);

      await service.getDashboardMetrics(queryWithFilter);

      // Check first aggregate call (Workload)
      const firstCallArgs = reclamoModel.aggregate.mock.calls[0][0];
      expect(firstCallArgs[0].$match.estado).toBe(EstadoReclamo.PENDIENTE);
    });
  });
});
