import React from 'react';

const PagosAcademiasPage = () => {
  const pagos = [
    { nombre: 'Samantha Almanza', ci: '14045145', disciplina: 'Voleibol', mes: 'Mayo', estado: 'Al día', deuda: 'Bs. 0', color: '#28a745', icono: '✓' },
    { nombre: 'María López', ci: '1234567', disciplina: 'Básquet', mes: 'Mayo', estado: 'Moroso', deuda: 'Bs. 390', color: '#dc3545', icono: '⚠' },
    { nombre: 'Juan Pérez', ci: '7654321', disciplina: 'Fútbol', mes: 'Abril', estado: 'Pendiente', deuda: 'Bs. 130', color: '#ffc107', icono: '⏰' },
  ];

  return (
    <div style={{ padding: '30px', backgroundColor: '#fdfbf6', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* --- ENCABEZADO --- */}
      <header style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '28px', color: '#002855', margin: 0 }}>Verificación de pagos de academias</h1>
      </header>

      {/* --- TARJETAS DE RESUMEN --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <ResumenCard titulo="Al día" valor="1" sub="deportistas" icono="✓" color="#28a745" bgColor="#e8f5e9" />
        <ResumenCard titulo="Pendientes" valor="1" sub="deportistas" icono="⏰" color="#ffc107" bgColor="#fffde7" />
        <ResumenCard titulo="Morosos" valor="1" sub="deportistas" icono="⚠" color="#dc3545" bgColor="#ffebee" />
        <ResumenCard titulo="Recaudación registrada" valor="Bs. 8,450" sub="" icono="$" color="#002855" bgColor="#e9f2ff" />
      </div>

      {/* --- FILTROS --- */}
      <section style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '15px' }}>
          <FiltroGroup label="Buscar por nombre o CI" placeholder="Buscar..." type="text" />
          <FiltroGroup label="Disciplina" options={['Todas', 'Voleibol', 'Fútbol']} />
          <FiltroGroup label="Categoría" options={['Todas', 'Juvenil', 'Mayores']} />
          <FiltroGroup label="Mes" options={['Mayo', 'Junio', 'Julio']} />
          <FiltroGroup label="Estado" options={['Todos', 'Al día', 'Moroso']} />
          <FiltroGroup label="Tipo" options={['Todos', 'Academia', 'Libre']} />
        </div>
      </section>

      {/* --- LEYENDA DE ESTADOS --- */}
      <section style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', marginBottom: '30px', borderLeft: '5px solid #002855', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#002855' }}>Estados visuales</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          <LegendItem label="Al día" color="#28a745" icono="✓" />
          <LegendItem label="Pendiente" color="#ffc107" icono="⏰" />
          <LegendItem label="Moroso" color="#dc3545" icono="⚠" />
          <LegendItem label="Exonerado/Beca" color="#d1e0f3" textColor="#002855" icono="★" />
        </div>
      </section>

      {/* --- TABLA DE RECAUDACIÓN --- */}
      <div style={{ backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', color: '#888', fontSize: '12px', borderBottom: '2px solid #eee' }}>
              <th style={{ padding: '15px 20px' }}>DEPORTISTA</th>
              <th>CI</th>
              <th>DISCIPLINA</th>
              <th>MES ACTUAL</th>
              <th>ESTADO</th>
              <th>DEUDA</th>
              <th style={{ textAlign: 'center' }}>ACCIÓN</th>
            </tr>
          </thead>
          <tbody>
            {pagos.map((p, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #eee', fontSize: '14px' }}>
                <td style={{ padding: '15px 20px', fontWeight: 'bold', color: '#002855' }}>{p.nombre}</td>
                <td>{p.ci}</td>
                <td>{p.disciplina}</td>
                <td>{p.mes}</td>
                <td>
                  <span style={{ 
                    backgroundColor: p.color, 
                    color: p.estado === 'Pendiente' ? '#333' : 'white', 
                    padding: '5px 12px', 
                    borderRadius: '5px', 
                    fontSize: '11px', 
                    fontWeight: 'bold', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '5px' 
                  }}>
                    {p.icono} {p.estado}
                  </span>
                </td>
                <td style={{ fontWeight: 'bold' }}>{p.deuda}</td>
                <td style={{ textAlign: 'center' }}>
                  <button style={{ 
                    border: '1px solid #002855', 
                    color: '#002855', 
                    background: 'none', 
                    padding: '6px 15px', 
                    borderRadius: '5px', 
                    cursor: 'pointer', 
                    fontWeight: 'bold',
                    fontSize: '12px'
                  }}>
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

// --- COMPONENTES AUXILIARES ---

const ResumenCard = ({ titulo, valor, sub, icono, color, bgColor }: any) => (
  <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
    <div>
      <p style={{ margin: 0, fontSize: '12px', color: '#888', fontWeight: 'bold', textTransform: 'uppercase' }}>{titulo}</p>
      <h2 style={{ margin: '5px 0', color: color, fontSize: '24px' }}>{valor}</h2>
      <span style={{ fontSize: '11px', color: '#aaa' }}>{sub}</span>
    </div>
    <div style={{ backgroundColor: bgColor, color: color, width: '40px', height: '40px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px' }}>
      {icono}
    </div>
  </div>
);

const FiltroGroup = ({ label, placeholder, type, options }: any) => (
  <div>
    <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '8px', color: '#666' }}>{label}</label>
    {type === 'text' ? (
      <input type="text" placeholder={placeholder} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e0e0e0', backgroundColor: '#fdfdfd', boxSizing: 'border-box' }} />
    ) : (
      <select style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e0e0e0', backgroundColor: '#fdfdfd', boxSizing: 'border-box' }}>
        {options.map((opt: string) => <option key={opt}>{opt}</option>)}
      </select>
    )}
  </div>
);

const LegendItem = ({ label, color, icono, textColor = 'white' }: any) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <span style={{ backgroundColor: color, color: textColor, padding: '4px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
      {icono} {label}
    </span>
  </div>
);

export default PagosAcademiasPage;