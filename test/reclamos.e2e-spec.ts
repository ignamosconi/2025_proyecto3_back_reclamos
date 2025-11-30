import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { UserRole } from 'src/users/helpers/enum.roles';
import { ReclamoController } from '../src/reclamo/controllers/reclamo.controller';

// Mock Guards globally
jest.mock('../src/auth/guards/auth.guard', () => ({
  AuthGuard: class {
    canActivate(context) {
      const req = context.switchToHttp().getRequest();
      req.user = {
        _id: '60c72b2f9c3f9a0015b67e7d',
        email: 'test@example.com',
        rol: UserRole.CLIENTE,
        role: UserRole.CLIENTE,
      };
      return true;
    }
  },
}));

jest.mock('../src/auth/guards/roles.guard', () => ({
  RolesGuard: class {
    canActivate() {
      return true;
    }
  },
}));

import { AuthGuard } from '../src/auth/guards/auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';

describe('ReclamoController (e2e)', () => {
  let app: INestApplication;

  const mockUser = {
    _id: '60c72b2f9c3f9a0015b67e7d',
    email: 'test@example.com',
    rol: UserRole.CLIENTE,
    role: UserRole.CLIENTE,
  };

  const mockReclamoService = {
    create: jest.fn().mockImplementation((dto) => ({
      toObject: () => ({ ...dto, _id: 'reclamo123', estado: 'PENDIENTE' }),
    })),
    findAll: jest.fn().mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
    }),
    findById: jest.fn().mockImplementation((id) => ({
      toObject: () => ({ _id: id, titulo: 'Test Reclamo' }),
    })),
    update: jest.fn().mockImplementation((id, dto) => ({
      toObject: () => ({ _id: id, ...dto }),
    })),
    softDelete: jest.fn().mockResolvedValue(undefined),
    restore: jest.fn().mockImplementation((id) => ({
      toObject: () => ({ _id: id, deletedAt: null }),
    })),
    changeState: jest.fn().mockImplementation((id, dto) => ({
      toObject: () => ({ _id: id, estado: dto.estado }),
    })),
    findDeleted: jest.fn().mockResolvedValue([]),
    reassignAreaWithActor: jest.fn().mockImplementation((id) => ({
      toObject: () => ({ _id: id }),
    })),
  };

  const mockImagenService = {
    update: jest.fn().mockResolvedValue({
      toObject: () => ({ _id: 'img123' }),
    }),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ReclamoController],
      providers: [
        AuthGuard,
        RolesGuard,
        {
          provide: 'IReclamoService',
          useValue: mockReclamoService,
        },
        {
          provide: 'IImagenService',
          useValue: mockImagenService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/reclamos (POST)', () => {
    it('should create a reclamo', () => {
      return request(app.getHttpServer())
        .post('/reclamos')
        .send({
          titulo: 'Test Reclamo',
          descripcion: 'Descripcion test',
          prioridad: 'alta',
          criticidad: 'SÍ',
          fkProyecto: '60c72b2f9c3f9a0015b67e7d',
          fkTipoReclamo: '60c72b2f9c3f9a0015b67e7e',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.titulo).toEqual('Test Reclamo');
          expect(mockReclamoService.create).toHaveBeenCalled();
        });
    });
  });

  describe('/reclamos (GET)', () => {
    it('should return paginated reclamos', () => {
      return request(app.getHttpServer())
        .get('/reclamos')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(mockReclamoService.findAll).toHaveBeenCalled();
        });
    });
  });

  describe('/reclamos/:id (GET)', () => {
    it('should return a reclamo by id', () => {
      return request(app.getHttpServer())
        .get('/reclamos/60c72b2f9c3f9a0015b67e7d')
        .expect(200)
        .expect((res) => {
          expect(res.body._id).toEqual('60c72b2f9c3f9a0015b67e7d');
          expect(mockReclamoService.findById).toHaveBeenCalled();
        });
    });
  });

  describe('/reclamos/:id (PUT)', () => {
    it('should update a reclamo', () => {
      return request(app.getHttpServer())
        .put('/reclamos/60c72b2f9c3f9a0015b67e7d')
        .send({
          titulo: 'Updated Title',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.titulo).toEqual('Updated Title');
          expect(mockReclamoService.update).toHaveBeenCalled();
        });
    });
  });

  describe('/reclamos/:id/estado (PATCH)', () => {
    it('should change reclamo state', () => {
      return request(app.getHttpServer())
        .patch('/reclamos/60c72b2f9c3f9a0015b67e7d/estado')
        .send({
          estado: 'En Revisión',
          sintesis: 'Iniciando',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.estado).toEqual('En Revisión');
          expect(mockReclamoService.changeState).toHaveBeenCalled();
        });
    });
  });

  describe('/reclamos/:id (DELETE)', () => {
    it('should soft delete a reclamo', () => {
      return request(app.getHttpServer())
        .delete('/reclamos/60c72b2f9c3f9a0015b67e7d')
        .expect(204)
        .expect(() => {
          expect(mockReclamoService.softDelete).toHaveBeenCalled();
        });
    });
  });
});
