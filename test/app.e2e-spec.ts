import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let AppModule: typeof import('../src/app.module').AppModule;

  beforeEach(async () => {
      process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';
      process.env.DB_HOST = process.env.DB_HOST ?? 'localhost';
      process.env.DB_PORT = process.env.DB_PORT ?? '5432';
      process.env.DB_USER = process.env.DB_USER ?? 'test';
      process.env.DB_PASSWORD = process.env.DB_PASSWORD ?? 'test';
      process.env.DB_NAME = process.env.DB_NAME ?? 'test';
      AppModule = AppModule ?? require('../src/app.module').AppModule;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('/api (GET)', () => {
    return request(app.getHttpServer())
      .get('/api')
      .expect(200)
      .expect((response) => {
        expect(response.text).toContain('Proyecto Juntas Directivas Cloud');
      });
  });

  it('/api/v4 (GET) is not registered internally', () => {
    return request(app.getHttpServer()).get('/api/v4').expect(404);
  });
});
