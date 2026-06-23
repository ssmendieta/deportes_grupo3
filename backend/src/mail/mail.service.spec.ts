import { Test, TestingModule } from "@nestjs/testing";
import { MailService } from "./mail.service";

const sendMailMock = jest.fn().mockResolvedValue({});

jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => ({ sendMail: sendMailMock })),
}));

describe("MailService", () => {
  let service: MailService;

  beforeEach(async () => {
    process.env.SMTP_HOST = "smtp.test.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_USER = "test@test.com";
    process.env.SMTP_PASS = "secret";
    process.env.SMTP_FROM = "test@test.com";

    const module: TestingModule = await Test.createTestingModule({
      providers: [MailService],
    }).compile();

    service = module.get<MailService>(MailService);
    sendMailMock.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const reservaMock = {
    id_reserva: 1,
    nombre_solicitante: "Juan Pérez",
    ci: 12345678,
    complemento: null,
    correo_solicitante: "juan.perez@ucb.edu.bo",
    fecha_reserva: new Date("2026-07-15T12:00:00.000Z"),
    hora_inicio: new Date("1970-01-01T14:00:00.000Z"),
    hora_fin: new Date("1970-01-01T16:00:00.000Z"),
    tipo_reserva: "entrenamiento",
    estado: "confirmada",
    motivo: "Entrenamiento",
    espacios: { nombre_espacio: "Coliseo UCB" },
    personas_aprobador: {
      nombres: "Admin",
      ape_paterno: "Sistema",
      ape_materno: null,
    },
  } as any;

  it("debe enviar correo con el PDF adjunto", async () => {
    const pdfBuffer = Buffer.from("pdf-fake");

    await service.sendReservaConfirmada(reservaMock, pdfBuffer);

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const call = sendMailMock.mock.calls[0][0];
    expect(call.to).toBe("juan.perez@ucb.edu.bo");
    expect(call.subject).toContain("Confirmación de reserva #1");
    expect(call.html).toContain("Coliseo UCB");
    expect(call.html).toContain("entrenamiento");
    expect(call.attachments).toHaveLength(2);
    expect(call.attachments[0].filename).toBe("comprobante-reserva-1.pdf");
    expect(call.attachments[0].content).toBe(pdfBuffer);
  });

  it("no debe enviar correo si no hay correo_solicitante", async () => {
    await service.sendReservaConfirmada({ ...reservaMock, correo_solicitante: null }, Buffer.from(""));

    expect(sendMailMock).not.toHaveBeenCalled();
  });
});
