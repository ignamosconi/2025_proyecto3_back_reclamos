import { Test, TestingModule } from '@nestjs/testing';
import { ExportService } from './export.service';
import { IDASHBOARD_CLIENTE_SERVICE } from './interfaces/dashboard-cliente.service.interface';
import { IDASHBOARD_ENCARGADO_SERVICE } from './interfaces/dashboard-encargado.service.interface';
import { IDASHBOARD_GERENTE_SERVICE } from './interfaces/dashboard-gerente.service.interface';
import { ExportFormat } from '../dto/export-query.dto';
import { Response } from 'express';

describe('ExportService', () => {
  let service: ExportService;
  let clienteService: any;
  let encargadoService: any;
  let gerenteService: any;

  const mockClienteService = {
    getDashboardMetrics: jest.fn(),
  };
  const mockEncargadoService = {
    getDashboardMetrics: jest.fn(),
  };
  const mockGerenteService = {
    getDashboardMetrics: jest.fn(),
  };

  const mockResponse = {
    setHeader: jest.fn(),
    send: jest.fn(),
    end: jest.fn(),
  } as unknown as Response;

  // Mock ExcelJS write to stream/buffer if needed, but here we mock the whole library behavior or just check calls.
  // Since ExcelJS is imported, we might need to mock it if we want to avoid real file generation logic,
  // but for unit tests of the service logic, we can check if it calls the right methods.
  // However, `workbook.xlsx.write(res)` writes to the response stream.
  // We can mock the private methods if we wanted to isolate, but they are private.
  // We will let ExcelJS run but mock the response object to capture output.
  // Note: ExcelJS might fail if `res` is not a real stream.
  // Let's mock the `xlsx.write` method of the workbook instance created inside.
  // Since we can't easily access the instance created inside, we might need to mock the module 'exceljs'.

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportService,
        { provide: IDASHBOARD_CLIENTE_SERVICE, useValue: mockClienteService },
        {
          provide: IDASHBOARD_ENCARGADO_SERVICE,
          useValue: mockEncargadoService,
        },
        { provide: IDASHBOARD_GERENTE_SERVICE, useValue: mockGerenteService },
      ],
    }).compile();

    service = module.get<ExportService>(ExportService);
    clienteService = module.get(IDASHBOARD_CLIENTE_SERVICE);
    encargadoService = module.get(IDASHBOARD_ENCARGADO_SERVICE);
    gerenteService = module.get(IDASHBOARD_GERENTE_SERVICE);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('exportClienteDashboard', () => {
    const userId = 'u1';
    const query = {};
    const metricsMock = {
      claimsPerProject: [],
      claimsByStatus: [],
      averageResolutionTime: 5,
      totalClaims: 10,
      dateRange: { start: new Date(), end: new Date() },
    };

    beforeEach(() => {
      mockClienteService.getDashboardMetrics.mockResolvedValue(metricsMock);
    });

    it('should export CSV', async () => {
      await service.exportClienteDashboard(
        userId,
        query,
        ExportFormat.CSV,
        mockResponse,
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/csv',
      );
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.stringContaining('Reclamos por Proyecto'),
      );
    });

    // Skipping Excel test to avoid complex stream mocking for ExcelJS in this environment
    // or we can mock the private method if we cast to any
    it('should call exportClienteToExcel when format is XLSX', async () => {
      const spy = jest
        .spyOn(service as any, 'exportClienteToExcel')
        .mockImplementation(() => Promise.resolve());
      await service.exportClienteDashboard(
        userId,
        query,
        ExportFormat.XLSX,
        mockResponse,
      );
      expect(spy).toHaveBeenCalledWith(metricsMock, mockResponse);
    });
  });

  describe('exportEncargadoDashboard', () => {
    const encargadoId = 'e1';
    const query = {};
    const metricsMock = {
      claimsPerMonth: [],
      claimsByType: [],
      averageResolutionTimeByType: [],
      resolvedClaimsByPeriod: [],
      averageResolvedPerPeriod: 0,
      totalClaims: 0,
      dateRange: { start: new Date(), end: new Date() },
    };

    beforeEach(() => {
      mockEncargadoService.getDashboardMetrics.mockResolvedValue(metricsMock);
    });

    it('should export CSV', async () => {
      await service.exportEncargadoDashboard(
        encargadoId,
        query,
        ExportFormat.CSV,
        mockResponse,
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/csv',
      );
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.stringContaining('Reclamos por Mes'),
      );
    });
  });

  describe('exportGerenteDashboard', () => {
    const query = {};
    const metricsMock = {
      workloadByArea: [],
      topEmployeesByResolved: [],
      topEmployeesByEfficiency: [],
      distributionByType: [],
      totalClaims: 0,
      stateChangesCount: 0,
      percentageCriticalClaims: 0,
      dateRange: { start: new Date(), end: new Date() },
    };

    beforeEach(() => {
      mockGerenteService.getDashboardMetrics.mockResolvedValue(metricsMock);
    });

    it('should export CSV', async () => {
      await service.exportGerenteDashboard(
        query,
        ExportFormat.CSV,
        mockResponse,
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/csv',
      );
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.stringContaining('Carga de Trabajo por Área'),
      );
    });
  });
});
