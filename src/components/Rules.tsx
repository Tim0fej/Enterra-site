import { RULES } from '../config';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { SectionHeader } from './SectionHeader';

function RuleItem({
  index,
  title,
  description,
}: {
  index: number;
  title: string;
  description: string;
}) {
  const ref = useScrollAnimation<HTMLLIElement>(index * 70);

  return (
    <li className="rule" ref={ref}>
      <span className="rule__num">{String(index + 1).padStart(2, '0')}</span>
      <div className="rule__content">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </li>
  );
}

export function Rules() {
  return (
    <section className="section" id="rules">
      <div className="container">
        <SectionHeader
          tag="Правила"
          title="Простые и понятные"
          desc="Соблюдай правила — и играй с удовольствием."
        />

        <ol className="rules">
          {RULES.map((rule, index) => (
            <RuleItem key={rule.title} index={index} {...rule} />
          ))}
        </ol>
      </div>
    </section>
  );
}
