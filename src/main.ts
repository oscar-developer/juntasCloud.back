import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

const { version: apiVersion } = JSON.parse(
  require('node:fs').readFileSync(
    require('node:path').join(process.cwd(), 'package.json'),
    'utf8',
  ),
) as { version: string };

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // const app = await NestFactory.create(AppModule,{
  //   logger: ['error', 'warn'],
  // });

  // ✅ Prefijo global para TODA la API
  app.setGlobalPrefix('api');
  const config = new DocumentBuilder()
    .setTitle('JuntasCloud API v4')
    .setDescription('Documentacion de endpoints para JuntasCloud API v4')
    .setVersion(apiVersion)
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  
  // ✅ Ahora swagger queda en /api/docs (sin repetir api/api)
  SwaggerModule.setup('api/docs', app, document);

  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
  Logger.log(`Server running on ${await app.getUrl()}`, 'Bootstrap');

}
bootstrap();
