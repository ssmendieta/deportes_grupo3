function LeyendaCalendario() {
  return (
    <section className="legend-card">
      <div><span className="legend-dot coliseo" /> Coliseo Polideportivo</div>
      <div><span className="legend-dot arquitectura" /> Cancha de Arquitectura</div>
      <div><span className="legend-pill libre" /> Disponible</div>
      <div><span className="legend-pill ocupado" /> Ocupado / Actividad</div>
    </section>
  );
}

export default LeyendaCalendario;
