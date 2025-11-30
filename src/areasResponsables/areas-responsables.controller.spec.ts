import { Test, TestingModule } from '@nestjs/testing';
import { AreasResponsablesController } from './areas-responsables.controller';
import { IAREAS_RESPONSABLES_SERVICE } from './interfaces/areas-responsables.service.interface';

describe('AreasResponsablesController', () => {
  let controller: AreasResponsablesController;
  let mockService: any;

  beforeEach(async () => {
    mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findDeleted: jest.fn(),
      findOne: jest.fn(),
      findByName: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AreasResponsablesController],
      providers: [
        { provide: IAREAS_RESPONSABLES_SERVICE, useValue: mockService },
      ],
    }).compile();

    controller = module.get<AreasResponsablesController>(
      AreasResponsablesController,
    );
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('debería llamar al servicio create', async () => {
      const dto = { nombre: 'Test' };
      await controller.create(dto);
      expect(mockService.create).toHaveBeenCalledWith(dto);
    });
  });
});
