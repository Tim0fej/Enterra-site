import { Link } from 'react-router-dom';
import {
  REFUND_CONTACT_EMAIL,
  REFUND_FAQ,
  REFUND_HIGHLIGHTS,
  REFUND_SECTIONS,
  REFUND_UPDATED,
} from '../../shared/refundContent';
import { DocSections } from '../components/DocSections';
import { DocPageNav } from '../components/DocPageNav';
import { PageShell } from '../components/Layout';

export function RefundPage() {
  return (
    <PageShell
      title="Возврат средств"
      subtitle="Политика возврата платных услуг Enterra"
      backTo={{ to: '/shop', label: 'Магазин' }}
      wide
    >
      <DocPageNav current="refund" />

      <div className="refund-highlights">
        {REFUND_HIGHLIGHTS.map((item) => (
          <div key={item.label} className="refund-highlight card">
            <span className="refund-highlight__value">{item.value}</span>
            <span className="refund-highlight__label">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="card refund-cta">
        <div className="refund-cta__body">
          <h2 className="refund-cta__title">Нужен возврат?</h2>
          <p className="refund-cta__text">
            Напишите нам с темой «Возврат средств» или создайте тикет — укажите ник, email, сумму и
            чек из EasyDonate.
          </p>
        </div>
        <div className="refund-cta__actions">
          <a className="btn btn--primary" href={`mailto:${REFUND_CONTACT_EMAIL}?subject=${encodeURIComponent('Возврат средств')}`}>
            {REFUND_CONTACT_EMAIL}
          </a>
          <Link
            className="btn btn--ghost"
            to="/tickets/new"
          >
            Тикет поддержки
          </Link>
        </div>
      </div>

      <DocSections updated={REFUND_UPDATED} variant="cards" sections={REFUND_SECTIONS} />

      <div className="refund-faq">
        <h2 className="refund-faq__title">Частые вопросы</h2>
        <div className="refund-faq__grid">
          {REFUND_FAQ.map((item) => (
            <article key={item.question} className="card refund-faq__item">
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </div>

      <p className="muted doc-page__footer">
        Также см.{' '}
        <Link to="/terms">пользовательское соглашение</Link> и{' '}
        <Link to="/shop">магазин</Link>.
      </p>
    </PageShell>
  );
}
