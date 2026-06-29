import { Link } from 'react-router-dom';

import { RULES_SECTIONS, RULES_UPDATED } from '../../shared/rulesContent';

import { DocSections } from '../components/DocSections';

import { DocPageNav } from '../components/DocPageNav';

import { PageShell } from '../components/Layout';



export function RulesPage() {

  return (

    <PageShell

      title="Правила сервера"

      subtitle="Обязательны для всех игроков на Enterra"

      backTo={{ to: '/', label: 'Главная' }}

      wide

    >

      <DocPageNav current="rules" />

      <DocSections

        updated={RULES_UPDATED}

        variant="cards"

        sections={RULES_SECTIONS.map((section) => ({

          title: section.title,

          paragraphs: section.intro ? [section.intro] : undefined,

          items: section.items,

        }))}

      />

      <p className="muted doc-page__footer">

        Регистрируясь на сайте, вы принимаете{' '}

        <Link to="/terms">пользовательское соглашение</Link> и эти правила.

      </p>

    </PageShell>

  );

}


