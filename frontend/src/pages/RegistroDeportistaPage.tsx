import React, { useState } from 'react';

// Esto quita el error en App.tsx
interface RegistroProps {
  onVolver?: () => void;
}

const RegistroDeportistaPage: React.FC<RegistroProps> = ({ onVolver }) => {
  const [formularioAbierto, setFormularioAbierto] = useState(false);

  const deportistas = [
    { nombre: 'Samantha Almanza', ci: '14045145', disciplina: 'Voleibol', mes: 'Mayo', estado: 'Al día', deuda: 'Bs. 0', color: '#28a745', icono: '✓' },
    { nombre: 'María López', ci: '1234567', disciplina: 'Básquet', mes: 'Mayo', estado: 'Moroso', deuda: 'Bs. 390', color: '#dc3545', icono: '⚠' },
    { nombre: 'Juan Pérez', ci: '7654321', disciplina: 'Fútbol', mes: 'Abril', estado: 'Pendiente', deuda: 'Bs. 130', color: '#ffc107', icono: '⏰' },
  ];

  return (
    <div style={{ padding: '30px', backgroundColor: '#fdfbf6', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* --- ENCABEZADO --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px' }}>
        <div style={{ maxWidth: '80%' }}>
          <h1 style={{ fontSize: '28px', color: '#002855', margin: 0 }}>Registro de nuevo deportista</h1>
          <p style={{ color: '#666', fontSize: '14px', marginTop: '8px' }}>
            {/* Texto informativo opcional */}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          {/* Botón para volver al Dashboard usando la prop onVolver */}
          <button 
            onClick={onVolver}
            style={{ backgroundColor: 'white', color: '#002855', padding: '10px 20px', border: '1px solid #002855', borderRadius: '5px', cursor: 'pointer' }}
          >
            Volver
          </button>

          {!formularioAbierto ? (
            <button 
              onClick={() => setFormularioAbierto(true)}
              style={{ backgroundColor: '#002855', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <span style={{ fontSize: '18px' }}>+</span> Nuevo deportista
            </button>
          ) : (
            <button 
              onClick={() => setFormularioAbierto(false)}
              style={{ backgroundColor: '#002855', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              ✕ Cancelar
            </button>
          )}
        </div>
      </div>

      {/* --- FORMULARIO COMPLETO --- */}
      {formularioAbierto && (
        <div style={{ backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', overflow: 'hidden', marginBottom: '30px', border: '1px solid #e0e0e0' }}>
          <div style={{ backgroundColor: '#e9f2ff', padding: '12px 20px', color: '#002855', fontWeight: 'bold', fontSize: '14px' }}>
            Formulario dividido en bloques
          </div>
          <div style={{ padding: '25px' }}>
            
            <h3 style={{ color: '#002855', marginBottom: '20px' }}>A. Datos personales</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
               <div>
                 <label style={{display:'block', fontSize:'12px', fontWeight:'bold', marginBottom:'5px'}}>Nombre completo</label>
                 <input type="text" placeholder="Ingrese nombre completo" style={{ width:'100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f9f9f9' }} />
               </div>
               <div>
                 <label style={{display:'block', fontSize:'12px', fontWeight:'bold', marginBottom:'5px'}}>CI</label>
                 <input type="text" placeholder="Ingrese CI" style={{ width:'100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f9f9f9' }} />
               </div>
               <div>
                 <label style={{display:'block', fontSize:'12px', fontWeight:'bold', marginBottom:'5px'}}>Fecha de nacimiento</label>
                 <input type="date" style={{ width:'100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f9f9f9' }} />
               </div>
               <div>
                 <label style={{display:'block', fontSize:'12px', fontWeight:'bold', marginBottom:'5px'}}>Celular</label>
                 <input type="text" placeholder="Ingrese celular" style={{ width:'100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f9f9f9' }} />
               </div>
               <div>
                 <label style={{display:'block', fontSize:'12px', fontWeight:'bold', marginBottom:'5px'}}>Correo</label>
                 <input type="email" placeholder="Ingrese correo electrónico" style={{ width:'100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f9f9f9' }} />
               </div>
               <div>
                 <label style={{display:'block', fontSize:'12px', fontWeight:'bold', marginBottom:'5px'}}>Estado: activo/inactivo</label>
                 <select style={{ width:'100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
                   <option>Activo</option>
                   <option>Inactivo</option>
                 </select>
               </div>
            </div>

            <h3 style={{ color: '#002855', marginBottom: '15px' }}>B. Tipo de deportista</h3>
            <div style={{ display: 'flex', gap: '30px', marginBottom: '25px' }}>
               <label><input type="radio" name="tipo" /> Academia</label>
               <label><input type="radio" name="radio" /> Clase libre</label>
               <label><input type="radio" name="radio" /> Equipo competitivo</label>
            </div>

            <h3 style={{ color: '#002855', marginBottom: '20px' }}>C. Datos deportivos</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
               <div>
                 <label style={{display:'block', fontSize:'12px', fontWeight:'bold', marginBottom:'5px'}}>Disciplina</label>
                 <select style={{ width:'100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}><option>Seleccionar disciplina</option></select>
               </div>
               <div>
                 <label style={{display:'block', fontSize:'12px', fontWeight:'bold', marginBottom:'5px'}}>Categoría</label>
                 <select style={{ width:'100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}><option>Seleccionar categoría</option></select>
               </div>
               <div>
                 <label style={{display:'block', fontSize:'12px', fontWeight:'bold', marginBottom:'5px'}}>Entrenador asignado</label>
                 <input type="text" placeholder="Nombre del entrenador" style={{ width:'100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f9f9f9' }} />
               </div>
               <div>
                 <label style={{display:'block', fontSize:'12px', fontWeight:'bold', marginBottom:'5px'}}>Fecha de ingreso</label>
                 <input type="date" style={{ width:'100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f9f9f9' }} />
               </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
              <button onClick={() => setFormularioAbierto(false)} style={{ padding: '12px 35px', borderRadius: '5px', border: '1px solid #ddd', backgroundColor: '#fff7e6', cursor: 'pointer' }}>Cancelar</button>
              <button style={{ padding: '12px 35px', borderRadius: '5px', border: 'none', backgroundColor: '#002855', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Guardar deportista</button>
              <button style={{ padding: '12px 35px', borderRadius: '5px', border: 'none', backgroundColor: '#d1e0f3', color: '#002855', fontWeight: 'bold', cursor: 'pointer' }}>Guardar y ver estado de cuenta</button>
            </div>
          </div>
        </div>
      )}

      {/* --- TABLA --- */}
      <div style={{ backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' }}>
          <span style={{ color: '#002855', fontWeight: 'bold' }}>Deportistas registrados</span>
          <div style={{ position: 'relative' }}>
            <input type="text" placeholder="Buscar por nombre o CI" style={{ padding: '10px 40px 10px 15px', borderRadius: '5px', border: '1px solid #ddd', width: '300px', backgroundColor: '#f1f1f1' }} />
            <span style={{ position: 'absolute', right: '15px', top: '10px' }}>🔍</span>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ color: '#888', fontSize: '12px', borderBottom: '1px solid #eee', backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '15px 20px' }}>DEPORTISTA</th>
              <th>CI</th>
              <th>DISCIPLINA</th>
              <th>MES ACTUAL</th>
              <th>ESTADO</th>
              <th>DEUDA</th>
              <th>ACCIÓN</th>
            </tr>
          </thead>
          <tbody>
            {deportistas.map((d, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #eee', fontSize: '14px' }}>
                <td style={{ padding: '15px 20px', fontWeight: '500' }}>{d.nombre}</td>
                <td>{d.ci}</td>
                <td>{d.disciplina}</td>
                <td>{d.mes}</td>
                <td>
                  <span style={{ backgroundColor: d.color, color: 'white', padding: '5px 12px', borderRadius: '5px', fontSize: '12px', fontWeight: 'bold' }}>
                    {d.icono} {d.estado}
                  </span>
                </td>
                <td>{d.deuda}</td>
                <td>
                  <button style={{ border: '1px solid #002855', color: '#002855', background: 'none', padding: '6px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Ver cuenta
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RegistroDeportistaPage;