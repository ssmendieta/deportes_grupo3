import StatusBadge from "../../../shared/components/StatusBadge";

function PagosLegend() {
  return (
    <section className="panel-card legend-horizontal">
      <div className="section-heading">
        <span>Estados de cuenta</span>
      </div>
      <StatusBadge tone="success">✓ Al día</StatusBadge>
      <StatusBadge tone="warning">⏰ Pendiente</StatusBadge>
      <StatusBadge tone="info">— No aplica</StatusBadge>
    </section>
  );
}

export default PagosLegend;
