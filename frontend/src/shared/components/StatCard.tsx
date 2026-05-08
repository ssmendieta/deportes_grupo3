type Props = {
  label: string;
  value: string | number;
  helper?: string;
  tone?: "blue" | "green" | "yellow" | "red";
};

function StatCard({ label, value, helper, tone = "blue" }: Props) {
  return (
    <article className={`stat-card stat-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {helper && <small>{helper}</small>}
    </article>
  );
}

export default StatCard;
