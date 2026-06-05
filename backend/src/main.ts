import "dotenv/config";
import helmet from "helmet";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module.js";
import { ValidationPipe } from "@nestjs/common";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";
import { RequestLoggingInterceptor } from "./common/interceptors/request-logging.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",")
    : ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"];

  app.enableCors({
    origin: corsOrigins,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new RequestLoggingInterceptor());

  const config = new DocumentBuilder()
    .addBearerAuth()
    .setTitle("API de Gestión de Espacios y Disciplinas")
    .setDescription(
      "Documentación técnica de los endpoints de la API. " +
        "Autenticación mediante JWT Bearer Token (RS256).",
    )
    .setVersion("1.0")
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
