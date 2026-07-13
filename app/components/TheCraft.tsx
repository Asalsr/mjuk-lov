'use client';

import { useEffect, useRef, useState } from 'react';
import { Leaf, Pour, Packing, CakeStand } from './Icons';
import { ui, type Lang } from '@/lib/i18n';

interface TheCraftProps {
  lang: Lang;
}

const content = {
  sv: {
    heading: 'Hantverket',
    steps: [
      {
        label: 'Säsongen väljer',
        body: 'Vi börjar med vad som är i säsong. Lokalodlat när vi kan.'
      },
      {
        label: 'Vi bakar',
        body: 'Vi börjar med mjöl och ägg, inte en färdig mix, och ger det tiden det behöver.'
      },
      {
        label: 'Vi paketerar',
        body: 'Vi lägger i allt du behöver, och en enkel guide så att du aldrig tappar tråden.'
      },
      {
        label: 'Du njuter',
        body: 'Hemma, i ditt eget kök. Med dina händer, ditt sätt.'
      }
    ]
  },
  en: {
    heading: 'The Craft',
    steps: [
      {
        label: 'The season chooses',
        body: 'We start with what is in season. Locally grown when possible.'
      },
      {
        label: 'We bake',
        body: 'We start from flour and eggs, not a mix, and give it the time it needs.'
      },
      {
        label: 'We package',
        body: 'We tuck in everything you\'ll need, and a simple guide so you can\'t get lost.'
      },
      {
        label: 'You enjoy',
        body: 'At home, in your own kitchen. With your hands, your way.'
      }
    ]
  },
  fa: {
    heading: 'هنر ما',
    steps: [
      {
        label: 'فصل انتخاب می‌کند',
        body: 'با آنچه در فصل است شروع می‌کنیم. تا جای ممکن، محصول محلی.'
      },
      {
        label: 'ما می‌پزیم',
        body: 'از آرد و تخم‌مرغ شروع می‌کنیم، نه یک پودر آماده، و وقتی که لازم دارد به آن می‌دهیم.'
      },
      {
        label: 'ما بسته‌بندی می‌کنیم',
        body: 'هر چه لازم دارید را می‌گذاریم، و یک راهنمای ساده که هیچ‌وقت گم نشوید.'
      },
      {
        label: 'شما لذت می‌برید',
        body: 'در خانه، در آشپزخانه خودتان. با دست‌های خودتان، به سبک خودتان.'
      }
    ]
  }
};

const icons = [Leaf, Pour, Packing, CakeStand];

export const TheCraft = ({ lang }: TheCraftProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const t = content[lang];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="craft"
      ref={ref}
      className="py-[clamp(3.5rem,8vw,8rem)] px-4 md:px-8"
      style={{ backgroundColor: 'rgba(232, 184, 154, 0.2)' }}
    >
      <div className="max-w-[1200px] mx-auto">
        <h2
          className={`text-center mb-[2.8rem] md:mb-24 transition-all duration-700 ${
            isVisible ? 'opacity-80 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: '#a85d4e', fontWeight: 600 }}
        >
          {t.heading}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-[2.1rem] md:gap-8 relative">
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px opacity-20">
            <svg className="w-full h-full" preserveAspectRatio="none">
              <line
                x1="12.5%"
                y1="50%"
                x2="87.5%"
                y2="50%"
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            </svg>
          </div>

          {t.steps.map((step, i) => {
            const Icon = icons[i];
            return (
              <div
                key={i}
                className={`text-center relative transition-all duration-700 group ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: `${(i + 1) * 150}ms` }}
              >
                <div className="mb-5 w-1/2 mx-auto sm:w-full">
                  <div
                    role="img"
                    aria-label={ui[lang].craftIllustrationAlt(step.label)}
                    className="relative w-full overflow-hidden flex items-center justify-center"
                    style={{ aspectRatio: '4/5', backgroundColor: 'transparent' }}
                  >
                    <Icon className="w-full h-full" />
                  </div>
                </div>

                <div className="type-caps mb-3 opacity-30 group-hover:opacity-60 transition-opacity duration-300">
                  {String(i + 1).padStart(2, '0')}
                </div>

                <h3 className="mb-3 group-hover:text-[var(--dusty-terracotta)] transition-colors duration-300" style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.5rem)' }}>
                  {step.label}
                </h3>

                <p className="type-body opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                  {step.body}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
