import { useState } from 'react';

const ReservaForm = () => {
  const [formData, setFormData] = useState({
    motivo: '',
    espacio: 'Cancha 1',
    dia: '',
    horaInicio: '',
    horaFinal: '',
  });

  const calcularHoras = () => {
    if (!formData.horaInicio || !formData.horaFinal) return 0;
    const inicio = new Date(`2026-01-01T${formData.horaInicio}`);
    const fin = new Date(`2026-01-01T${formData.horaFinal}`);
    const diff = (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60);
    return diff > 0 ? diff : 0;
  };

  const horas = calcularHoras();
  const botonBloqueado = !formData.motivo || !formData.dia || horas <= 0 || horas > 3;

  return (
    <div style={{ backgroundColor: '#f4f7f6', minHeight: '100vh', padding: '20px', fontFamily: 'Segoe UI, sans-serif' }}>
      
      {/* HEADER: LOGO Y PERFIL */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', padding: '0 20px' }}>
        <img src="https://lpz.ucb.edu.bo/wp-content/uploads/2021/08/logo-UCB-horizontal.png" alt="UCB" style={{ height: '50px' }} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 'bold', color: '#003366' }}>Juan Perez</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Estudiante - Arquitectura</div>
          </div>
          <div style={{ width: '40px', height: '40px', backgroundColor: '#003366', color: 'white', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' }}>JP</div>
        </div>
      </div>

      {/* FORMULARIO */}
      <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: 'white', padding: '40px', borderRadius: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <h2 style={{ textAlign: 'center', color: '#003366', marginBottom: '5px' }}>Solicitar Cancha</h2>
        <p style={{ textAlign: 'center', color: '#aaa', fontSize: '14px', marginBottom: '30px' }}>UCB - Dirección de Deportes</p>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#999', display: 'block', marginBottom: '8px' }}>¿PARA QUÉ NECESITAS EL ESPACIO?</label>
          <input 
            type="text" 
            placeholder="Ej. Práctica de Futsal" 
            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e0e0e0', outline: 'none' }}
            onChange={(e) => setFormData({...formData, motivo: e.target.value})}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#999' }}>SELECCIONA LUGAR</label>
            <select style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e0e0e0' }} onChange={(e) => setFormData({...formData, espacio: e.target.value})}>
              <option>Cancha Arquitectura</option>
              <option>Coliseo</option>
              <option>Cancha 2</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#999' }}>FECHA</label>
            <input type="date" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e0e0e0' }} onChange={(e) => setFormData({...formData, dia: e.target.value})} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#999' }}>DESDE</label>
            <input type="time" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e0e0e0' }} onChange={(e) => setFormData({...formData, horaInicio: e.target.value})} />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#999' }}>HASTA</label>
            <input type="time" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e0e0e0' }} onChange={(e) => setFormData({...formData, horaFinal: e.target.value})} />
          </div>
        </div>

        {horas > 3 && <p style={{ color: 'red', textAlign: 'center', fontSize: '13px' }}>⚠️ El tiempo máximo permitido es de 3 horas.</p>}

        <button 
          disabled={botonBloqueado}
          style={{ 
            width: '100%', padding: '15px', borderRadius: '12px', border: 'none', 
            backgroundColor: botonBloqueado ? '#ccc' : '#003366', 
            color: 'white', fontWeight: 'bold', cursor: botonBloqueado ? 'not-allowed' : 'pointer' 
          }}
          onClick={() => alert("Solicitud enviada a la Dirección de Deportes UCB.")}
        >
          ENVIAR SOLICITUD
        </button>
      </div>
    </div>
  );
};

export default ReservaForm;