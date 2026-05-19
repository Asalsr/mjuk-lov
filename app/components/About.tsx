'use client';

import { useEffect, useRef, useState } from 'react';
import { Magnolia } from './Icons';
import { TextReveal, WordByWord } from './TextReveal';

interface AboutProps {
  lang: 'sv' | 'en';
}

const content = {
  sv: {
    eyebrow: 'Om oss',
    heading: 'Ett kök. En idé. Ganska mycket smör.',
    paragraphs: [
      'Mjuk Lov började med en enkel frustration: varför är det så svårt att ge någon en riktigt bra tårta? Konditoriet är dyrt. Att baka är tidskrävande. Och resultatet är sällan personligt.',
      'Svaret var att dela upp det. Vi gör det vi är bra på. Du gör det som gör tårtan till din.',
      'Varje kit bakas när du beställer. Inte för att det är trendig att säga det — utan för att det faktiskt smakar bättre så.'
    ]
  },
  en: {
    eyebrow: 'About us',
    heading: 'One kitchen. One idea. Quite a lot of butter.',
    paragraphs: [
      'Mjuk Lov started with a simple frustration: why is it so hard to give someone a really good cake? Bakeries are expensive. Baking takes time. And the result is rarely personal.',
      'The answer was to split it. We do what we are good at. You do what makes the cake yours.',
      'Every kit is baked when you order. Not because it sounds good to say — but because it actually tastes better that way.'
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
      className="py-[clamp(6rem,12vw,12rem)] px-4 md:px-8"
      style={{ backgroundColor: 'var(--vanilla-cream)' }}
    >
      <div className="max-w-[720px] mx-auto">
        <div
          className={`text-center mb-6 opacity-60 transition-all duration-700 ${
            isVisible ? 'opacity-60 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{
            fontFamily: 'Inter, sans-serif',
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            fontSize: '0.75rem'
          }}
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
              className="opacity-80"
              style={{
                fontSize: 'clamp(1.125rem, 2vw, 1.25rem)',
                lineHeight: '1.7'
              }}
            >
              {para}
            </TextReveal>
          ))}
        </div>

        {/* Watercolor magnolia replaces the old heart icon */}
        <div className="flex justify-center group cursor-pointer">
          <div className="transform group-hover:scale-110 transition-transform duration-500">
            <Magnolia className="w-[4.2rem] h-[4.2rem]" />
          </div>
        </div>
      </div>
    </section>
  );
};
