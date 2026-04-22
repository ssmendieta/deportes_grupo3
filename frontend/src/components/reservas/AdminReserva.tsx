import { useState } from 'react';
import { jsPDF } from 'jspdf';

const AdminReserva = () => {
  const [reservas, setReservas] = useState([
    { id: 1, nombre: "Juan Perez", fecha: "2026-04-25", hora: "14:00 - 16:00", espacio: "Cancha Arquitectura", carrera: "Arquitectura" },
    { id: 2, nombre: "Maria Lopez", fecha: "2026-04-26", hora: "09:00 - 12:00", espacio: "Coliseo", carrera: "Derecho" },
  ]);

  const [seleccionada, setSeleccionada] = useState<any>(null);

  const generarPDF = (reserva: any) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Universidad Católica Boliviana", 20, 20);

    doc.setFontSize(14);
    doc.text("Dirección de Deportes", 20, 30);

    doc.setFontSize(16);
    doc.text("CARTA DE ACEPTACIÓN DE RESERVA", 20, 50);

    doc.setFontSize(12);
    doc.text(`Estimado/a: ${reserva.nombre}`, 20, 70);

    doc.text(
      `Se le informa que su solicitud de reserva ha sido ACEPTADA con los siguientes detalles:`,
      20,
      85,
      { maxWidth: 170 }
    );

    doc.text(`Carrera: ${reserva.carrera}`, 20, 105);
    doc.text(`Espacio: ${reserva.espacio}`, 20, 115);
    doc.text(`Fecha: ${reserva.fecha}`, 20, 125);
    doc.text(`Horario: ${reserva.hora}`, 20, 135);

    doc.text("Atentamente,", 20, 170);
    doc.text("Dirección de Deportes", 20, 180);

    doc.save(`Reserva_${reserva.nombre}.pdf`);
  };

  const aceptarReserva = (reserva: any) => {
    generarPDF(reserva);
    setReservas(prev => prev.filter(r => r.id !== reserva.id));
    setSeleccionada(null);
  };

  const cancelarReserva = (id: number) => {
    setReservas(prev => prev.filter(r => r.id !== id));
    setSeleccionada(null);
  };

  return (
    <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', padding: '30px', fontFamily: 'Arial' }}>

      <div style={{ display: 'flex', gap: '30px', marginTop: '70px' }}>

        {/* LISTA */}
        <div style={{ width: '300px' }}>
          <h3 style={{ fontSize: '12px', color: '#aaa', letterSpacing: '1px' }}>
            SOLICITUDES PENDIENTES
          </h3>

          {reservas.map(res => (
            <div
              key={res.id}
              onClick={() => setSeleccionada(res)}
              style={{
                backgroundColor: seleccionada?.id === res.id ? '#003366' : 'white',
                color: seleccionada?.id === res.id ? 'white' : '#333',
                padding: '20px',
                borderRadius: '15px',
                marginBottom: '10px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}>
              {res.nombre}
            </div>
          ))}
        </div>

        {/* DETALLE (ESTILO ORIGINAL RESTAURADO) */}
        <div style={{
          flex: 1,
          backgroundColor: 'white',
          borderRadius: '30px',
          padding: '50px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
        }}>
          {seleccionada ? (
            <div>
              <h2 style={{ color: '#333', margin: 0 }}>Información de la Solicitud</h2>
              <p style={{ color: '#0066cc', fontWeight: 'bold', fontSize: '14px' }}>
                UCSP - Gestión de Deportes
              </p>

              {/* 🔥 ESTE ES EL CAMBIO EXACTO QUE QUERÍAS */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '40px',
                marginTop: '40px'
              }}>
                <div>
                  <label style={{ color: '#999', fontSize: '11px', fontWeight: 'bold' }}>
                    NOMBRE COMPLETO
                  </label>
                  <div style={{ fontSize: '18px', fontWeight: '500' }}>
                    {seleccionada.nombre}
                  </div>
                </div>

                <div>
                  <label style={{ color: '#999', fontSize: '11px', fontWeight: 'bold' }}>
                    CARRERA
                  </label>
                  <div style={{ fontSize: '18px', fontWeight: '500' }}>
                    {seleccionada.carrera}
                  </div>
                </div>

                <div>
                  <label style={{ color: '#999', fontSize: '11px', fontWeight: 'bold' }}>
                    ESPACIO
                  </label>
                  <div style={{ fontSize: '18px', fontWeight: '500' }}>
                    {seleccionada.espacio}
                  </div>
                </div>

                <div>
                  <label style={{ color: '#999', fontSize: '11px', fontWeight: 'bold' }}>
                    HORARIO
                  </label>
                  <div style={{ fontSize: '18px', fontWeight: '500' }}>
                    {seleccionada.fecha} | {seleccionada.hora}
                  </div>
                </div>
              </div>

              {/* BOTONES (NO TOCADOS) */}
              <div style={{ display: 'flex', gap: '20px', marginTop: '60px' }}>
                <button
                  onClick={() => aceptarReserva(seleccionada)}
                  style={{
                    flex: 2,
                    padding: '18px',
                    backgroundColor: '#003366',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}>
                  ACEPTAR RESERVA
                </button>

                <button
                  onClick={() => cancelarReserva(seleccionada.id)}
                  style={{
                    flex: 1,
                    padding: '18px',
                    backgroundColor: '#f5f5f5',
                    color: '#666',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}>
                  CANCELAR
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', marginTop: '100px', color: '#ccc' }}>
              Selecciona una solicitud
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminReserva;