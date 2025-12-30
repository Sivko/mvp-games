import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Включаем CORS для WebSocket соединений
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  
  // Настраиваем статическую раздачу файлов для тестового HTML
  app.useStaticAssets(join(__dirname, '..', 'public'));
  
  await app.listen(process.env.NEST_PORT);
  console.log(`Application is running on: http://localhost:${process.env.NEST_PORT}`);
  console.log(`WebSocket server is ready`);
  console.log(`Test WebSocket client: http://localhost:${process.env.NEST_PORT}/test-websocket.html`);
}
bootstrap();
