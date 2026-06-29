import { Link } from 'react-router-dom';

export type DocPageId = 'rules' | 'faq' | 'terms' | 'refund';

const DOC_LINKS: { id: DocPageId; to: string; label: string }[] = [
  { id: 'rules', to: '/rules', label: 'Правила' },
  { id: 'faq', to: '/faq', label: 'FAQ' },
  { id: 'terms', to: '/terms', label: 'Соглашение' },
  { id: 'refund', to: '/refund', label: 'Возврат' },
];

export function DocPageNav({ current }: { current: DocPageId }) {
  return (
    <nav className="doc-page-nav" aria-label="Документы проекта">
      {DOC_LINKS.map((link) => (
        <Link
          key={link.id}
          to={link.to}
          className={`doc-page-nav__link${current === link.id ? ' doc-page-nav__link--active' : ''}`}
          aria-current={current === link.id ? 'page' : undefined}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
