type Props = {
  children: string;
  tone?: "success" | "warning" | "danger" | "info" | "muted";
};

function StatusBadge({ children, tone = "info" }: Props) {
  return <span className={`status-badge ${tone}`}>{children}</span>;
}

export default StatusBadge;
