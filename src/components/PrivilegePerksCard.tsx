interface PrivilegePerksCardProps {
  title: string;
  items: readonly string[];
}

export function PrivilegePerksCard({ title, items }: PrivilegePerksCardProps) {
  return (
    <div className="card media-shared-perks">
      <h4 className="media-shared-perks__title">{title}</h4>
      <ul className="media-shared-perks__list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
