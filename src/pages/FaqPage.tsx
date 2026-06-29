import { Link } from 'react-router-dom';

import { FAQ_ITEMS, FAQ_UPDATED } from '../../shared/faqContent';

import { DocSections } from '../components/DocSections';

import { DocPageNav } from '../components/DocPageNav';

import { PageShell } from '../components/Layout';



export function FaqPage() {

  return (

    <PageShell

      title="FAQ"

      subtitle="Частые вопросы о сервере, сайте и входе в игру"

      backTo={{ to: '/', label: 'Главная' }}

      wide

    >

      <DocPageNav current="faq" />

      <DocSections

        updated={FAQ_UPDATED}

        variant="accordion"

        sections={FAQ_ITEMS.map((item) => ({

          title: item.question,

          paragraphs: [item.answer],

        }))}

      />

      <p className="muted doc-page__footer">

        Не нашли ответ?{' '}

        <Link to="/tickets/new">Напишите в поддержку</Link> или загляните на{' '}

        <Link to="/forum">форум</Link>.

      </p>

    </PageShell>

  );

}


