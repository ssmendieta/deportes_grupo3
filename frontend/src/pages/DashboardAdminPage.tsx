import React from 'react';

// Esto quita el error en App.tsx
interface DashboardProps {
  onIrARegistro?: () => void;
}

const DashboardAdminPage: React.FC<DashboardProps> = ({ onIrARegistro }) => {
  const stats = [
    { label: 'Deportistas registrados', value: 42, icon: '👤', color: 'text-blue-600', btn: 'Registrar deportista' },
    { label: 'Pagos pendientes', value: 18, icon: '💰', color: 'text-yellow-600', btn: 'Ver pagos' },
    { label: 'Morosos', value: 9, icon: '⚠️', color: 'text-red-600', btn: 'Ver morosos' },
    { label: 'Disciplinas activas', value: 12, icon: '🏆', color: 'text-blue-800', btn: 'Gestionar disciplinas' },
  ];

  return (
    <div style={{ padding: '20px', backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
      <header style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#002855' }}>
          Dashboard administrativo del Departamento de Deportes
        </h1>
        <p style={{ color: '#667' }}>Bienvenido al panel de control del Sprint 2.</p>
      </header>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px',
        marginBottom: '40px' 
      }}>
        {stats.map((item, index) => (
          <div key={index} style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '12px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            border: '1px solid #eee'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '14px', color: '#555' }}>{item.label}</span>
              <span>{item.icon}</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#002855', marginBottom: '15px' }}>
              {item.value}
            </div>
            <button 
              onClick={item.btn === 'Registrar deportista' ? onIrARegistro : undefined}
              style={{ 
                width: '100%', 
                padding: '8px', 
                backgroundColor: '#002855', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              {item.btn}
            </button>
          </div>
        ))}
      </div>

      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #eee' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>Accesos rápidos</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {['Registrar deportista', 'Verificar pago', 'Gestionar disciplinas', 'Estado de cuenta'].map((link, i) => (
            <li 
              key={i} 
              onClick={link === 'Registrar deportista' ? onIrARegistro : undefined}
              style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0', color: '#002855', cursor: 'pointer' }}
            >
              • {link}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default DashboardAdminPage;