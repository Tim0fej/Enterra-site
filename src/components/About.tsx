import { STATS } from '../config';

import { useScrollAnimation } from '../hooks/useScrollAnimation';

import { SectionHeader } from './SectionHeader';



interface AboutProps {

  playersOnline: number | null;

}



function StatCard({

  value,

  label,

  index,

}: {

  value: string;

  label: string;

  index: number;

}) {

  const ref = useScrollAnimation<HTMLDivElement>(index * 80);



  return (

    <div className="stat" ref={ref}>

      <span className="stat__value">{value}</span>

      <span className="stat__label">{label}</span>

    </div>

  );

}



export function About({ playersOnline }: AboutProps) {

  return (

    <section className="section" id="about">

      <div className="container">

        <SectionHeader

          tag="О сервере"

          title="Мир, который строят игроки"

          desc="Enterra — это долгоживущий ванильный сервер, где каждый блок имеет значение."

        />



        <div className="stats">

          {STATS.map((stat, index) => (

            <StatCard

              key={stat.label}

              index={index}

              value={

                stat.dynamic

                  ? playersOnline !== null

                    ? String(playersOnline)

                    : '—'

                  : stat.value

              }

              label={stat.label}

            />

          ))}

        </div>

      </div>

    </section>

  );

}

