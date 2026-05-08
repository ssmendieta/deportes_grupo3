import StatusBadge from "../../../shared/components/StatusBadge";

function PagosLegend() {
  return (
    <section className="panel-card legend-horizontal">
      <div className="section-heading"><span>Estados visuales</span></div>
      <StatusBadge tone="success">✓ Al día</StatusBadge>
      <StatusBadge tone="warning">⏰ Pendiente</StatusBadge>
      <StatusBadge tone="danger">⚠ Moroso</StatusBadge>
      <StatusBadge tone="info">★ Exonerado/Beca</StatusBadge>
    </section>
  );
}

export default PagosLegend;
