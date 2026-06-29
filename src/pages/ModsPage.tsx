import { Link } from 'react-router-dom';
import { PageShell } from '../components/Layout';
import { ENTERRA_MODPACK, SERVER_CONFIG, SKIN_LAUNCHERS } from '../config';
import {
  FABRIC_FORBIDDEN,
  FABRIC_GAME_VERSION,
  FABRIC_LOADER_VERSION,
  FABRIC_MODS,
  MOD_CATEGORY_HINTS,
  MOD_CATEGORY_LABELS,
  curseforgeInstallUrl,
  modrinthInstallUrl,
  type ModCategory,
} from '../../shared/fabricMods';

const CATEGORY_ORDER: ModCategory[] = ['base', 'performance', 'comfort'];

export function ModsPage() {
  const requiredCount = FABRIC_MODS.filter((mod) => mod.required).length;

  return (
    <PageShell
      title="Моды Fabric"
      subtitle={`Рекомендуемый набор для комфортной игры на Enterra · Minecraft ${FABRIC_GAME_VERSION} · Fabric Loader ${FABRIC_LOADER_VERSION}`}
      wide
    >
      <div className="card mods-pack">
        <div className="mods-pack__main">
          <span className="section__tag">Быстрый старт</span>
          <h2 className="mods-pack__title">{ENTERRA_MODPACK.title}</h2>
          <p className="mods-pack__desc">{ENTERRA_MODPACK.description}</p>
          <ol className="mods-steps mods-pack__steps">
            <li>Скачай готовую сборку по кнопке справа</li>
            <li>
              Распакуй содержимое в папку <code>.minecraft</code> (Windows:{' '}
              <code>%appdata%\.minecraft</code>)
            </li>
            <li>
              Запусти лаунчер с профилем Fabric {FABRIC_GAME_VERSION} и зайди на{' '}
              <strong>{SERVER_CONFIG.ip}</strong>
            </li>
          </ol>
        </div>
        <div className="mods-pack__action">
          {ENTERRA_MODPACK.downloadUrl ? (
            <a
              href={ENTERRA_MODPACK.downloadUrl}
              className="btn btn--primary btn--full mods-pack__download"
              target="_blank"
              rel="noopener noreferrer"
            >
              Скачать сборку
            </a>
          ) : (
            <p className="muted mods-pack__soon">Ссылка на сборку скоро появится</p>
          )}
          <p className="muted mods-pack__alt">Или собери моды вручную ниже — Modrinth и CurseForge</p>
        </div>
      </div>

      <div className="mods-intro card">
        <p>
          Сервер на версии <strong>{SERVER_CONFIG.version}</strong>. Моды не меняют геймплей — только
          FPS, графику и удобство. Каждый мод можно скачать с <strong>Modrinth</strong> или{' '}
          <strong>CurseForge</strong> (версия {FABRIC_GAME_VERSION}, загрузчик Fabric).
        </p>
        <ol className="mods-steps">
          <li>
            Установи{' '}
            <a href="https://fabricmc.net/use/" target="_blank" rel="noopener noreferrer">
              Fabric Loader {FABRIC_LOADER_VERSION} для {FABRIC_GAME_VERSION}
            </a>
          </li>
          <li>Скачай моды по кнопкам ниже</li>
          <li>Положи файлы <code>.jar</code> в папку <code>mods</code> профиля Minecraft</li>
          <li>
            Зайди на сервер —{' '}
            <Link to="/register">зарегистрируйся на сайте</Link>, если ещё не сделал этого
          </li>
        </ol>
        <p className="muted mods-intro__note">
          Минимальный набор: Fabric API, Sodium и Simple Voice Chat ({requiredCount} рекомендуемых
          мода). Остальные модули из сборки — для графики и удобства интерфейса.
        </p>
      </div>

      <section className="mods-section" id="skins">
        <div className="mods-section__head">
          <h2>Скины для пиратки и лаунчеров</h2>
          <p className="muted">
            Сервер поддерживает Ely.by, TLauncher (TLSkins) и другие лаунчеры. Ник на сайте и в
            игре должен совпадать — иначе будет стандартный Steve или случайный скин.
          </p>
        </div>

        <div className="mods-skins-grid">
          {SKIN_LAUNCHERS.map((launcher) => (
            <article key={launcher.id} className="card mods-skins-card">
              <div className="mods-skins-card__head">
                <span className="mods-skins-card__icon" aria-hidden>
                  {launcher.icon}
                </span>
                <div>
                  <h3>
                    {'url' in launcher && launcher.url ? (
                      <a href={launcher.url} target="_blank" rel="noopener noreferrer">
                        {launcher.name}
                      </a>
                    ) : (
                      launcher.name
                    )}
                  </h3>
                  <p className="muted mods-skins-card__summary">{launcher.summary}</p>
                </div>
              </div>
              <ol className="mods-steps mods-skins-card__steps">
                {launcher.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </article>
          ))}
        </div>

        <p className="muted mods-skins-note">
          На сервере стоит SkinsRestorer с поддержкой Ely.by. Если скин не применился — выйди и
          зайди снова. Проблема осталась?{' '}
          <Link to="/tickets/new">Напиши в поддержку</Link>.
        </p>
      </section>

      {CATEGORY_ORDER.map((category) => {
        const mods = FABRIC_MODS.filter((mod) => mod.category === category);
        if (mods.length === 0) return null;

        return (
          <section key={category} className="mods-section">
            <div className="mods-section__head">
              <h2>{MOD_CATEGORY_LABELS[category]}</h2>
              <p className="muted">{MOD_CATEGORY_HINTS[category]}</p>
            </div>

            <div className="mods-grid">
              {mods.map((mod) => (
                <article key={mod.id} className="card mods-card">
                  <div className="mods-card__top">
                    <h3>{mod.name}</h3>
                    {mod.required ? <span className="badge badge--open">Рекомендуем</span> : null}
                  </div>
                  <p className="mods-card__desc">{mod.description}</p>
                  {mod.note ? <p className="mods-card__note muted">{mod.note}</p> : null}
                  <div className="mods-card__links">
                    <a
                      href={modrinthInstallUrl(mod.modrinthSlug)}
                      className="btn btn--ghost btn--small"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Modrinth →
                    </a>
                    <a
                      href={curseforgeInstallUrl(mod.curseforgeSlug)}
                      className="btn btn--ghost btn--small"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      CurseForge →
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}

      <div className="card mods-forbidden">
        <h3>Что ставить нельзя</h3>
        <ul className="support-perks">
          {FABRIC_FORBIDDEN.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="muted">
          За читы — бан без апелляции. Если сомневаешься, спроси в{' '}
          <Link to="/tickets">тикетах</Link>.
        </p>
      </div>
    </PageShell>
  );
}
