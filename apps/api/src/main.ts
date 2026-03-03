import { NestFactory } from '@nestjs/core';
import { AppModule } from '@app/app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('FinEase Wealth Architect API')
    .setDescription(
      'Personal finance management API for tracking wealth, assets, and goals.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter Firebase ID token',
        in: 'header',
      },
      'bearer', // This name must match the one used in @ApiBearerAuth()
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.enableCors();
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap().catch(console.error);
