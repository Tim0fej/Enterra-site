import { useScrollAnimation } from '../hooks/useScrollAnimation';

interface SectionHeaderProps {
  tag: string;
  title: string;
  desc?: string;
}

export function SectionHeader({ tag, title, desc }: SectionHeaderProps) {
  const ref = useScrollAnimation<HTMLDivElement>();

  return (
    <div className="section__header" ref={ref}>
      <span className="section__tag">{tag}</span>
      <h2 className="section__title">{title}</h2>
      {desc && <p className="section__desc">{desc}</p>}
    </div>
  );
}
