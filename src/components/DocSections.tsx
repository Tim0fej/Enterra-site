import { useId, useMemo, useState } from 'react';
import type { DocBlock } from '../../shared/docTypes';

export type { DocBlock };

function sectionSlug(title: string, index: number): string {
  const base = title
    .toLowerCase()
    .replace(/^\d+\.\s*/, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '');
  return `section-${index}-${base || 'part'}`;
}

function SectionBody({ section }: { section: DocBlock }) {
  return (
    <>
      {section.paragraphs?.map((paragraph) => (
        <p key={paragraph} className="doc-section__p">
          {paragraph}
        </p>
      ))}
      {section.items ? (
        <ul className="legal-list">
          {section.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      {section.children}
    </>
  );
}

export function DocSections({
  sections,
  updated,
  variant = 'cards',
}: {
  sections: DocBlock[];
  updated?: string;
  variant?: 'cards' | 'accordion';
}) {
  const navLabelId = useId();
  const anchors = useMemo(
    () => sections.map((section, index) => ({ id: sectionSlug(section.title, index), title: section.title })),
    [sections],
  );

  const [openIndexes, setOpenIndexes] = useState<Set<number>>(() => new Set([0]));

  const toggleSection = (index: number) => {
    setOpenIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const expandAll = () => setOpenIndexes(new Set(sections.map((_, index) => index)));
  const collapseAll = () => setOpenIndexes(new Set());

  return (
    <div className="doc-sections">
      {updated ? <p className="muted doc-page__updated">Обновлено: {updated}</p> : null}

      {variant === 'cards' && sections.length > 2 ? (
        <nav className="card doc-toc" aria-labelledby={navLabelId}>
          <p id={navLabelId} className="doc-toc__label">
            Содержание
          </p>
          <ul className="doc-toc__list">
            {anchors.map((anchor) => (
              <li key={anchor.id}>
                <a href={`#${anchor.id}`} className="doc-toc__link">
                  {anchor.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {variant === 'accordion' ? (
        <div className="doc-accordion-toolbar">
          <button type="button" className="btn btn--ghost btn--small" onClick={expandAll}>
            Развернуть все
          </button>
          <button type="button" className="btn btn--ghost btn--small" onClick={collapseAll}>
            Свернуть все
          </button>
        </div>
      ) : null}

      <div className={`legal-page legal-page--${variant}`}>
        {sections.map((section, index) => {
          const id = anchors[index].id;

          if (variant === 'accordion') {
            const open = openIndexes.has(index);
            return (
              <section
                key={id}
                id={id}
                className={`card doc-accordion${open ? ' doc-accordion--open' : ''}`}
              >
                <button
                  type="button"
                  className="doc-accordion__trigger"
                  aria-expanded={open}
                  aria-controls={`${id}-panel`}
                  onClick={() => toggleSection(index)}
                >
                  <span className="doc-accordion__title">{section.title}</span>
                  <span className="doc-accordion__icon" aria-hidden="true">
                    {open ? '−' : '+'}
                  </span>
                </button>
                <div
                  id={`${id}-panel`}
                  className="doc-accordion__body"
                  hidden={!open}
                >
                  <SectionBody section={section} />
                </div>
              </section>
            );
          }

          return (
            <section key={id} id={id} className="card legal-section doc-section">
              <h2>{section.title}</h2>
              <SectionBody section={section} />
            </section>
          );
        })}
      </div>
    </div>
  );
}
