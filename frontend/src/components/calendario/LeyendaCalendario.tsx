function LeyendaCalendario() {
  return (
    <section className="leyenda-calendario">
      <div className="leyenda-item">
        <span className="leyenda-color coliseo" />
        Coliseo Polideportivo
      </div>

      <div className="leyenda-item">
        <span className="leyenda-color arquitectura" />
        Cancha de Arquitectura
      </div>

      <div className="leyenda-item">
        <span className="leyenda-estilo libre" />
        Disponible
      </div>

      <div className="leyenda-item">
        <span className="leyenda-estilo ocupado" />
        Ocupado / Actividad
      </div>
    </section>
  );
}

export default LeyendaCalendario;
