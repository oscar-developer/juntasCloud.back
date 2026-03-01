import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // const app = await NestFactory.create(AppModule,{
  //   logger: ['error', 'warn'],
  // });

  // ✅ Prefijo global para TODA la API
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('JuntasCloud API')
    .setDescription('Documentacion de endpoints para JuntasCloud')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  
  // ✅ Ahora swagger queda en /api/docs (sin repetir api/api)
  SwaggerModule.setup('docs', app, document);

  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
  Logger.log(`Server running on ${await app.getUrl()}`, 'Bootstrap');

}
bootstrap();
