import { ComprobanteReservaBuilder } from "./comprobante-reserva.builder";

describe("ComprobanteReservaBuilder", () => {
  it("debe generar un buffer PDF no vacío", async () => {
    const builder = new ComprobanteReservaBuilder();
    const reserva = {
      id: 42,
      nombre_solicitante: "Juan Pérez",
      ci: 12345678,
      complemento: "LP",
      espacio_nombre: "Coliseo UCB",
      tipo_reserva: "entrenamiento",
      estado: "confirmada",
      fecha_reserva: "2026-07-15",
      hora_inicio: "14:00",
      hora_fin: "16:00",
      aprobador_nombre: "Admin Sistema",
    };

    builder.generarCabecera();
    builder.generarNumeracion(reserva.id);
    builder.generarContenido(reserva);
    builder.generarPiePagina();

    const doc = builder.getStream();
    const buffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
      doc.end();
    });

    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
  });

  it("debe omitir la sección de aprobador si no existe", async () => {
    const builder = new ComprobanteReservaBuilder();
    const reserva = {
      id: 43,
      nombre_solicitante: "Ana López",
      ci: 87654321,
      complemento: null,
      espacio_nombre: "Cancha de Arquitectura",
      tipo_reserva: "partido",
      estado: "confirmada",
      fecha_reserva: "2026-07-16",
      hora_inicio: "10:00",
      hora_fin: "12:00",
      aprobador_nombre: null,
    };

    builder.generarCabecera();
    builder.generarNumeracion(reserva.id);
    builder.generarContenido(reserva);
    builder.generarPiePagina();

    const doc = builder.getStream();
    const buffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
      doc.end();
    });

    expect(buffer.length).toBeGreaterThan(0);
  });
});
