import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module.js";
import { ValidationPipe } from "@nestjs/common"; 

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-rol", "Authorization"],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, 
      transform: true, 
    }),
  );

  const config = new DocumentBuilder()
    .setTitle("API de Gestión de Espacios y Disciplinas")
    .setDescription(
      "Documentación técnica de los endpoints de la API. " +
        "Nota: El sistema utiliza un header 'x-rol' para la autorización (Mock Auth).",
    )
    .setVersion("1.0")
    .addApiKey(
      {
        type: "apiKey",
        name: "x-rol",
        in: "header",
        description:
          'Ingresa "admin" para autorizar las peticiones del middleware',
      },
      "permisos-rol",
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup("docs", app, document);

  const port = process.env.PORT ?? 4000;
  await app.listen(port);

  console.log(`\n----------------------------------------------------------`);
  console.log(`🚀 Servidor corriendo en: http://localhost:${port}`);
  console.log(`📑 Documentación en: http://localhost:${port}/docs`);
  console.log(`----------------------------------------------------------\n`);
}

bootstrap();