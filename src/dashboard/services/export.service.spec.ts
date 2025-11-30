import { Test, TestingModule } from '@nestjs/testing';
import { ExportService } from './export.service';
import { IDASHBOARD_CLIENTE_SERVICE } from './interfaces/dashboard-cliente.service.interface';
import { IDASHBOARD_ENCARGADO_SERVICE } from './interfaces/dashboard-encargado.service.interface';
import { IDASHBOARD_GERENTE_SERVICE } from './interfaces/dashboard-gerente.service.interface';
import { ExportFormat } from '../dto/export-query.dto';
import { Response } from 'express';

// Mock ExcelJS
const mockAddRow = jest.fn();
const mockAddWorksheet = jest.fn().mockReturnValue({
  addRow: mockAddRow,
});
const mockWrite = jest.fn().mockResolvedValue(undefined);

jest.mock('exceljs', () => {
  return {
    Workbook: jest.fn().mockImplementation(() => ({
      addWorksheet: mockAddWorksheet,
      xlsx: {
        write: mockWrite,
      },
    })),
  };
});

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
    mockAddRow.mockClear();
    mockAddWorksheet.mockClear();
    mockWrite.mockClear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // --- Decision Table & Equivalence Partitioning for Cliente Dashboard ---
  describe('exportClienteDashboard', () => {
    const userId = 'u1';
    const query = {};
    const baseMetrics = {
      claimsPerProject: [{ proyectoNombre: 'P1', cantidad: 5 }],
      claimsByStatus: [{ estado: 'Abierto', cantidad: 2 }],
      averageResolutionTime: 5,
      totalClaims: 10,
      dateRange: { start: new Date('2023-01-01'), end: new Date('2023-01-31') },
    };

    const testCases = [
      {
        description: 'Format CSV with populated metrics',
        format: ExportFormat.CSV,
        metrics: baseMetrics,
        expectedContentType: 'text/csv',
        expectedContentChecks: [
          'Reclamos por Proyecto',
          'P1',
          '5',
          'Abierto',
          '2',
        ],
      },
      {
        description: 'Format XLSX with populated metrics',
        format: ExportFormat.XLSX,
        metrics: baseMetrics,
        expectedContentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        expectedExcelRows: [
          ['Reclamos por Proyecto'],
          ['P1', 5],
          ['Abierto', 2],
        ],
      },
      {
        description: 'Format CSV with empty arrays (Edge Case)',
        format: ExportFormat.CSV,
        metrics: { ...baseMetrics, claimsPerProject: [], claimsByStatus: [] },
        expectedContentType: 'text/csv',
        expectedContentChecks: ['Reclamos por Proyecto', 'Reclamos por Estado'],
      },
    ];

    testCases.forEach(
      ({
        description,
        format,
        metrics,
        expectedContentType,
        expectedContentChecks,
        expectedExcelRows,
      }) => {
        it(description, async () => {
          mockClienteService.getDashboardMetrics.mockResolvedValue(metrics);

          await service.exportClienteDashboard(
            userId,
            query,
            format,
            mockResponse,
          );

          expect(mockResponse.setHeader).toHaveBeenCalledWith(
            'Content-Type',
            expectedContentType,
          );

          if (format === ExportFormat.CSV) {
            expect(mockResponse.send).toHaveBeenCalled();
            const csvOutput = (mockResponse.send as jest.Mock).mock.calls[0][0];
            expectedContentChecks.forEach((check) => {
              expect(csvOutput).toContain(check);
            });
          } else {
            expect(mockWrite).toHaveBeenCalledWith(mockResponse);
            expect(mockResponse.end).toHaveBeenCalled();
            // Verify some key rows were added
            expectedExcelRows.forEach((row) => {
              // This is a loose check to see if addRow was called with something resembling our data
              // Since addRow is called many times, we check if ANY call matches
              const calls = mockAddRow.mock.calls;
              const match = calls.some(
                (call) => JSON.stringify(call[0]) === JSON.stringify(row),
              );
              expect(match).toBeTruthy();
            });
          }
        });
      },
    );
  });

  // --- Decision Table & Equivalence Partitioning for Encargado Dashboard ---
  describe('exportEncargadoDashboard', () => {
    const encargadoId = 'e1';
    const query = {};
    const baseMetrics = {
      claimsPerMonth: [
        { year: 2023, month: 1, resueltos: 1, noResueltos: 1, total: 2 },
      ],
      claimsByType: [{ tipoReclamoNombre: 'T1', cantidad: 3 }],
      averageResolutionTimeByType: [
        { tipoReclamoNombre: 'T1', promedioDias: 2.5 },
      ],
      resolvedClaimsByPeriod: [{ periodo: '2023-01', cantidad: 1 }],
      averageResolvedPerPeriod: 1,
      totalClaims: 5,
      dateRange: { start: new Date('2023-01-01'), end: new Date('2023-01-31') },
    };

    const testCases = [
      {
        description: 'Format CSV with populated metrics',
        format: ExportFormat.CSV,
        metrics: baseMetrics,
        expectedContentType: 'text/csv',
        expectedContentChecks: [
          'Reclamos por Mes',
          '2023',
          '1',
          'T1',
          '3',
          '2.5',
        ],
      },
      {
        description: 'Format XLSX with populated metrics',
        format: ExportFormat.XLSX,
        metrics: baseMetrics,
        expectedContentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        expectedExcelRows: [
          ['T1', 3],
          ['T1', 2.5],
        ],
      },
      {
        description:
          'Format XLSX with empty averageResolutionTimeByType (Edge Case)',
        format: ExportFormat.XLSX,
        metrics: { ...baseMetrics, averageResolutionTimeByType: [] },
        expectedContentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        expectedExcelRows: [['No hay datos disponibles', '-']],
      },
    ];

    testCases.forEach(
      ({
        description,
        format,
        metrics,
        expectedContentType,
        expectedContentChecks,
        expectedExcelRows,
      }) => {
        it(description, async () => {
          mockEncargadoService.getDashboardMetrics.mockResolvedValue(metrics);

          await service.exportEncargadoDashboard(
            encargadoId,
            query,
            format,
            mockResponse,
          );

          expect(mockResponse.setHeader).toHaveBeenCalledWith(
            'Content-Type',
            expectedContentType,
          );

          if (format === ExportFormat.CSV) {
            expect(mockResponse.send).toHaveBeenCalled();
            const csvOutput = (mockResponse.send as jest.Mock).mock.calls[0][0];
            expectedContentChecks.forEach((check) => {
              expect(csvOutput).toContain(check);
            });
          } else {
            expect(mockWrite).toHaveBeenCalledWith(mockResponse);
            expectedExcelRows.forEach((row) => {
              const calls = mockAddRow.mock.calls;
              const match = calls.some(
                (call) => JSON.stringify(call[0]) === JSON.stringify(row),
              );
              expect(match).toBeTruthy();
            });
          }
        });
      },
    );
  });

  // --- Decision Table & Equivalence Partitioning for Gerente Dashboard ---
  describe('exportGerenteDashboard', () => {
    const query = {};
    const baseMetrics = {
      workloadByArea: [{ areaNombre: 'A1', cantidad: 10 }],
      topEmployeesByResolved: [
        {
          empleadoNombre: 'Emp1',
          empleadoEmail: 'e@e.com',
          cantidadResueltos: 5,
        },
      ],
      topEmployeesByEfficiency: [
        { empleadoNombre: 'Emp1', empleadoEmail: 'e@e.com', promedioDias: 2 },
      ],
      distributionByType: [
        { tipoReclamoNombre: 'T1', cantidad: 5, porcentaje: 50 },
      ],
      totalClaims: 10,
      stateChangesCount: 20,
      percentageCriticalClaims: 10,
      dateRange: { start: new Date('2023-01-01'), end: new Date('2023-01-31') },
    };

    const testCases = [
      {
        description: 'Format CSV with populated metrics',
        format: ExportFormat.CSV,
        metrics: baseMetrics,
        expectedContentType: 'text/csv',
        expectedContentChecks: [
          'Carga de Trabajo por Área',
          'A1',
          '10',
          'Emp1',
          'e@e.com',
          '50%',
        ],
      },
      {
        description: 'Format XLSX with populated metrics',
        format: ExportFormat.XLSX,
        metrics: baseMetrics,
        expectedContentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        expectedExcelRows: [
          ['A1', 10],
          ['Emp1', 'e@e.com', 5],
          ['T1', 5, '50%'],
        ],
      },
      {
        description:
          'Format XLSX with empty topEmployeesByEfficiency (Edge Case)',
        format: ExportFormat.XLSX,
        metrics: { ...baseMetrics, topEmployeesByEfficiency: [] },
        expectedContentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        expectedExcelRows: [['No hay datos disponibles', '-', '-']],
      },
    ];

    testCases.forEach(
      ({
        description,
        format,
        metrics,
        expectedContentType,
        expectedContentChecks,
        expectedExcelRows,
      }) => {
        it(description, async () => {
          mockGerenteService.getDashboardMetrics.mockResolvedValue(metrics);

          await service.exportGerenteDashboard(query, format, mockResponse);

          expect(mockResponse.setHeader).toHaveBeenCalledWith(
            'Content-Type',
            expectedContentType,
          );

          if (format === ExportFormat.CSV) {
            expect(mockResponse.send).toHaveBeenCalled();
            const csvOutput = (mockResponse.send as jest.Mock).mock.calls[0][0];
            expectedContentChecks.forEach((check) => {
              expect(csvOutput).toContain(check);
            });
          } else {
            expect(mockWrite).toHaveBeenCalledWith(mockResponse);
            expectedExcelRows.forEach((row) => {
              const calls = mockAddRow.mock.calls;
              const match = calls.some(
                (call) => JSON.stringify(call[0]) === JSON.stringify(row),
              );
              expect(match).toBeTruthy();
            });
          }
        });
      },
    );
  });
});
