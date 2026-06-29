import { FEATURES } from '../config';

import { useScrollAnimation } from '../hooks/useScrollAnimation';

import { SectionHeader } from './SectionHeader';



function FeatureCard({

  icon,

  title,

  description,

  index,

}: {

  icon: string;

  title: string;

  description: string;

  index: number;

}) {

  const ref = useScrollAnimation<HTMLElement>(index * 90);



  return (

    <article className="feature-card" ref={ref}>

      <div className="feature-card__icon" aria-hidden>

        {icon}

      </div>

      <h3>{title}</h3>

      <p>{description}</p>

    </article>

  );

}



export function Features() {

  return (

    <section className="section section--alt" id="features">

      <div className="container">

        <SectionHeader tag="Особенности" title="Почему Enterra?" />



        <div className="features">

          {FEATURES.map((feature, index) => (

            <FeatureCard key={feature.title} {...feature} index={index} />

          ))}

        </div>

      </div>

    </section>

  );

}

