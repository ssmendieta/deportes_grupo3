type Props = {
  title: string;
  description?: string;
};

function EmptyState({ title, description }: Props) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      {description && <p>{description}</p>}
    </div>
  );
}

export default EmptyState;
