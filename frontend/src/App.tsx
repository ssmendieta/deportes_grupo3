import React, { useState } from 'react';
import ReservaForm from './components/reservas/ReservaForm';
import AdminReserva from './components/reservas/AdminReserva';

const App = () => {
  const [vista, setVista] = useState<'reserva' | 'admin'>('reserva');

  return (
    <div>
      {/* ÚNICA NAVEGACIÓN */}
      <div style={{ position: 'fixed', top: '20px', left: '20px', display: 'flex', gap: '10px', zIndex: 1000 }}>
        <button 
          onClick={() => setVista('reserva')}
          style={{
            padding: '8px 20px',
            borderRadius: '20px',
            border: 'none',
            backgroundColor: vista === 'reserva' ? '#003366' : '#e0e0e0',
            color: vista === 'reserva' ? 'white' : '#666',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Vista Usuario
        </button>

        <button 
          onClick={() => setVista('admin')}
          style={{
            padding: '8px 20px',
            borderRadius: '20px',
            border: 'none',
            backgroundColor: vista === 'admin' ? '#003366' : '#e0e0e0',
            color: vista === 'admin' ? 'white' : '#666',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Vista Admin
        </button>
      </div>

      {/* SOLO UNA VISTA */}
      {vista === 'reserva' ? <ReservaForm /> : <AdminReserva />}
    </div>
  );
};

export default App;