import { Link } from 'react-router-dom';

import { TERMS_SECTIONS, TERMS_UPDATED } from '../../shared/termsContent';

import { DocSections } from '../components/DocSections';

import { DocPageNav } from '../components/DocPageNav';

import { PageShell } from '../components/Layout';



export function TermsPage() {



  return (

    <PageShell

      title="Пользовательское соглашение"

      subtitle="Условия использования сайта enterra.tech и сервера Enterra"

      backTo={{ to: '/', label: 'Главная' }}

      wide

    >

      <DocPageNav current="terms" />

      <DocSections updated={TERMS_UPDATED} variant="cards" sections={TERMS_SECTIONS} />

      <p className="muted doc-page__footer">

        Также ознакомьтесь с <Link to="/rules">правилами сервера</Link> и{' '}

        <Link to="/faq">FAQ</Link>. По оплате и возвратам —{' '}
        <Link to="/refund">политика возврата</Link> или{' '}
        <Link to="/tickets">тикет поддержки</Link>.

      </p>

    </PageShell>

  );

}


