import { Link } from 'react-router-dom';
import { PageShell } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { isAdmin } from '../utils/roles';
import {
  staffGuideSectionsForRole,
  type StaffGuideSection,
} from '../../shared/staffGuide';
import { ADMIN_GUIDE_SUBTITLE, ADMIN_GUIDE_TITLE } from '../../shared/staffGuide';

function SectionBadge({ audience }: { audience: StaffGuideSection['audience'] }) {
  if (audience === 'admin') {
    return <span className="staff-guide__badge staff-guide__badge--admin">только админ</span>;
  }
  return <span className="staff-guide__badge">модератор + админ</span>;
}

function CommandRow({ command, description, example, note }: NonNullable<StaffGuideSection['commands']>[number]) {
  return (
    <div className="staff-guide__command">
      <code className="staff-guide__cmd">{command}</code>
      <p className="staff-guide__cmd-desc">{description}</p>
      {example ? (
        <p className="staff-guide__cmd-example">
          Пример: <code>{example}</code>
        </p>
      ) : null}
      {note ? <p className="staff-guide__cmd-note muted">{note}</p> : null}
    </div>
  );
}

export function StaffGuidePage() {
  const { user } = useAuth();
  const admin = user ? isAdmin(user.role) : false;
  const sections = staffGuideSectionsForRole(admin);

  return (
    <PageShell title={ADMIN_GUIDE_TITLE} subtitle={ADMIN_GUIDE_SUBTITLE} wide>
      <div className="staff-nav staff-guide__nav">
        <Link to="/moder" className="link-btn">← Панель модератора</Link>
        {admin && <Link to="/admin" className="link-btn">Админ-панель →</Link>}
      </div>

      <nav className="staff-guide__toc card" aria-label="Содержание">
        <h2 className="staff-guide__toc-title">Содержание</h2>
        <ol className="staff-guide__toc-list">
          {sections.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`}>{section.title}</a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="staff-guide__sections">
        {sections.map((section) => (
          <section key={section.id} id={section.id} className="card staff-guide__section">
            <header className="staff-guide__section-header">
              <h2 className="staff-guide__section-title">{section.title}</h2>
              <SectionBadge audience={section.audience} />
            </header>

            {section.intro ? <p className="staff-guide__intro">{section.intro}</p> : null}

            {section.situations?.length ? (
              <div className="staff-guide__situations">
                {section.situations.map((item) => (
                  <article key={item.title} className="staff-guide__situation">
                    <h3 className="staff-guide__situation-title">{item.title}</h3>
                    <ol className="staff-guide__situation-steps">
                      {item.actions.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  </article>
                ))}
              </div>
            ) : null}

            {section.bullets?.length ? (
              <ul className="staff-guide__list">
                {section.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}

            {section.commands?.length ? (
              <div className="staff-guide__commands">
                {section.commands.map((cmd) => (
                  <CommandRow key={cmd.command} {...cmd} />
                ))}
              </div>
            ) : null}

            {section.warnings?.length ? (
              <div className="staff-guide__warnings">
                {section.warnings.map((warning) => (
                  <p key={warning} className="staff-guide__warning">
                    ⚠ {warning}
                  </p>
                ))}
              </div>
            ) : null}

            {section.links?.length ? (
              <div className="staff-guide__links">
                {section.links.map((link) =>
                  link.href.startsWith('/') ? (
                    <Link key={link.href} to={link.href} className="link-btn">
                      {link.label}
                    </Link>
                  ) : (
                    <a key={link.href} href={link.href} className="link-btn" target="_blank" rel="noreferrer">
                      {link.label}
                    </a>
                  ),
                )}
              </div>
            ) : null}
          </section>
        ))}
      </div>
    </PageShell>
  );
}
