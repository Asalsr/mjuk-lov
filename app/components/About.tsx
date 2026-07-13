'use client';

import { useEffect, useRef, useState } from 'react';
import { Magnolia } from './Icons';
import { TextReveal, WordByWord } from './TextReveal';
import type { Lang } from '@/lib/i18n';

interface AboutProps {
  lang: Lang;
}

const content = {
  sv: {
    eyebrow: 'Om oss',
    heading: 'Ett kök. Ett löfte. Hemma i Göteborg.',
    paragraphs: [
      'Mjuk Lov började i ett litet kök i Hissingen. Inte som ett företag, utan som ett svar på en fråga: vad händer när du ger bort något du bakat själv?',
      'Svaret var enkelt. Folk blir glada. Inte för att det är perfekt, utan för att det är personligt. För att någon tänkte på dem.',
      'Idag bakar vi fortfarande i samma kök. Vi har vuxit, men aldrig bort från grundtanken. Allt vi gör är mjukt. Mjukt i smaken, mjukt i formen, mjukt i löftet. Hembakat, för dig.'
    ]
  },
  en: {
    eyebrow: 'About us',
    heading: 'One kitchen. One promise. Home in Gothenburg.',
    paragraphs: [
      'Mjuk Lov started in a small kitchen in Hissingen. Not as a business, but as an answer to a question: what happens when you give away something you baked yourself?',
      'The answer was simple. People become happy. Not because it is perfect, but because it is personal. Because someone thought of them.',
      'Today we still bake in the same kitchen. We have grown, but never away from the basic idea. Everything we do is soft. Soft in taste, soft in form, soft in promise. Home baked, for you.'
    ]
  },
  fa: {
    eyebrow: 'درباره ما',
    heading: 'یک آشپزخانه. یک وعده. خانه‌ای در یوتبوری.',
    paragraphs: [
      'Mjuk Lov در آشپزخانه‌ای کوچک در هیسینگن آغاز شد. نه به‌عنوان یک کسب‌وکار، بلکه پاسخی به یک پرسش: وقتی چیزی را که خودت پخته‌ای به کسی هدیه می‌دهی، چه اتفاقی می‌افتد؟',
      'پاسخ ساده بود. مردم خوشحال می‌شوند. نه چون بی‌نقص است، بلکه چون شخصی است. چون کسی به آن‌ها فکر کرده.',
      'امروز هنوز در همان آشپزخانه می‌پزیم. بزرگ شده‌ایم، اما هرگز از ایده اصلی دور نشده‌ایم. هر کاری که می‌کنیم نرم است. نرم در طعم، نرم در شکل، نرم در وعده. خانگی‌پخت، برای شما.'
    ]
  }
};

export const About = ({ lang }: AboutProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const t = content[lang];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.2 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="about"
      ref={ref}
      className="py-[clamp(3.5rem,8vw,8rem)] px-4 md:px-8"
      style={{ backgroundColor: 'var(--vanilla-cream)' }}
    >
      <div className="max-w-[720px] mx-auto">
        <div
          className={`type-caps text-center mb-6 ink-muted transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {t.eyebrow}
        </div>

        <WordByWord
          text={t.heading}
          delay={150}
          className="text-center mb-12"
          style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', lineHeight: '1.3' }}
        />

        <div className="space-y-6 mb-12">
          {t.paragraphs.map((para, i) => (
            <TextReveal
              key={i}
              delay={(i + 2) * 150}
              className="type-body opacity-80"
              style={{ lineHeight: '1.7' }}
            >
              {para}
            </TextReveal>
          ))}
        </div>

        {/* Watercolor magnolia replaces the old heart icon */}
        <div className="flex justify-center group cursor-pointer">
          <div className="transform group-hover:scale-110 transition-transform duration-500">
            <Magnolia className="w-12 h-12 md:w-[4.2rem] md:h-[4.2rem]" />
          </div>
        </div>
      </div>
    </section>
  );
};
