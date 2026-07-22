'use client';

import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { Magnolia } from './Icons';
import { usePrefersReducedMotion } from '@/app/hooks/usePrefersReducedMotion';
import type { Lang } from '@/lib/i18n';

interface AboutStoryProps {
  lang: Lang;
}

// The "About us" story. A single editorial column: opener → the two of us →
// belief → the three places (set as a broken typographic sentence) → what we
// bake → the soft promise. Uses the site's own faces (Cormorant for the serif
// display, Didact via .type-body for prose; both remap to Vazirmatn on /fa via
// the html[lang="fa"] font overrides in globals.css) — no external fonts.
//
// TODO(fa): the Persian prose below is a first draft — have a native speaker
// review it before launch (idiomatic phrasing, not word-by-word). Same flag as
// the footer's fa strings.
const content: Record<Lang, {
  eyebrow: string;
  lede: string;
  us: string[];
  pull1: string;
  placesIntro: string;
  places: { name: string; line: string }[];
  believe: string;
  pull2: string;
  offer: string[];
  close: string;
  sign: string;
}> = {
  sv: {
    eyebrow: 'Om oss',
    lede: 'Mjuk lov betyder ”ett mjukt löfte.”',
    us: [
      'Långt innan det var ett löfte till någon annan var det ett vi hållit till varandra i åratal. Vi är ett par, och vi har levt våra liv kring mat.',
      'En av oss är kock och kaffemänniska — åratal av att träna smaklökar, undervisa i sensorik och barista-hantverk för andra som gör det för ett levebröd. Den andra är konstnär som i åratal hållit workshops, och lärt människor som var helt säkra på att de ”inte var kreativa” att de var precis det.'
    ],
    pull1: 'Att skapa något med sina händer, och ge det till någon, är en av de finaste saker en människa kan göra.',
    placesIntro: 'Två olika hantverk, en tro vi hela tiden återvänder till. Och tre platser bor i allt vi bakar.',
    places: [
      { name: 'Iran', line: '— rötterna. allt börjar i ett kök som doftar som hemma.' },
      { name: 'Italia', line: 'är där kunskapen fördjupades. Vi bar redan med oss en del hemifrån; sju år där, händerna i degen, lärde oss resten.' },
      { name: 'Göteborg', line: 'är där vi har landat, och där mjuk lov bakas i dag, i ett hemmakök.' }
    ],
    believe: 'Varje plats vi rest och smakat på har lämnat något kvar i det. Det här tror vi. Mat är konst, och som all konst är den inte till för att betraktas på avstånd — den är till för att skapas, även av någon som aldrig hållit en spritspåse.',
    pull2: 'Smaken är minnet: en tugga kan bära en hel eftermiddag, en hel människa, hela anledningen till att ni samlades.',
    offer: [
      'Så mjuk lov är inte bara en sak. Vissa saker gör du färdigt själv — diy-tårtkiten och partylådorna, där dekorerandet är nöjet och ofullkomligt är hela poängen.',
      'Vissa saker bakar vi bara och räcker över, färdiga och klara, precis som vi skulle ställa fram dem för någon vid vårt eget bord. Hur det än når dig var det gjort för att delas — och för att bli smaken du minns det med.'
    ],
    close: 'Det är det mjuka löftet.',
    sign: 'mjuk lov'
  },
  en: {
    eyebrow: 'About us',
    lede: 'Mjuk lov means “a soft promise.”',
    us: [
      'Long before it was a promise to anyone else, it was one we’d been keeping to each other for years. We’re a couple, and we’ve spent our lives around food.',
      'One of us is a chef and a coffee person — years spent training palates, teaching sensory work and barista craft to other people who do it for a living. The other is a painter who ran workshops for years, and taught people who were certain they “weren’t creative” that they were, in fact, exactly that.'
    ],
    pull1: 'Making something with your hands, and giving it to someone, is one of the best things a person can do.',
    placesIntro: 'Two different crafts, one belief we keep returning to. And three places live in everything we bake.',
    places: [
      { name: 'Iran', line: '— the roots. everything starts in a kitchen that smells like home.' },
      { name: 'Italia', line: 'is where the knowledge deepened. We already carried some from home; seven years there, hands in the dough, taught us the rest.' },
      { name: 'Göteborg', line: 'is where we’ve landed, and where mjuk lov is baked today, out of a home kitchen.' }
    ],
    believe: 'Everywhere we’ve travelled and tasted has left something behind in it. Here is what we believe. Food is art, and like any art it isn’t meant to be watched from a distance — it’s meant to be made, even by someone who has never held a piping bag.',
    pull2: 'The taste is the memory: one bite can carry a whole afternoon, a whole person, the whole reason you gathered.',
    offer: [
      'So mjuk lov isn’t only one thing. Some of what we make, you finish yourself — the DIY cake kits and the party boxes, where the decorating is the fun and imperfect is the point.',
      'Some of it we simply bake and hand to you, finished and ready, the way we’d set it in front of someone at our own table. However it reaches you, it was made to be shared — and to become the taste you remember it by.'
    ],
    close: 'That’s the soft promise.',
    sign: 'mjuk lov'
  },
  fa: {
    eyebrow: 'درباره ما',
    lede: 'Mjuk lov یعنی «یک وعده‌ی نرم.»',
    us: [
      'مدت‌ها پیش از آنکه وعده‌ای به کسِ دیگری باشد، وعده‌ای بود که سال‌ها به هم می‌دادیم. ما یک زوج هستیم و تمام زندگی‌مان را کنار غذا گذرانده‌ایم.',
      'یکی از ما سرآشپز و آدمِ قهوه است — سال‌ها صرفِ تربیت ذائقه و آموزشِ کارِ حسی و هنرِ باریستایی به کسانی که این کار حرفه‌شان است. دیگری نقاش است که سال‌ها کارگاه برگزار کرده و به کسانی که مطمئن بودند «خلاق نیستند» نشان داده که دقیقاً همان‌اند.'
    ],
    pull1: 'چیزی را با دستان خود ساختن و به کسی بخشیدن، یکی از بهترین کارهایی است که آدم می‌تواند بکند.',
    placesIntro: 'دو هنرِ متفاوت، یک باور که همیشه به آن بازمی‌گردیم. و سه مکان در هر آنچه می‌پزیم زندگی می‌کنند.',
    places: [
      { name: 'ایران', line: '— ریشه‌ها. همه‌چیز در آشپزخانه‌ای آغاز می‌شود که بوی خانه می‌دهد.' },
      { name: 'ایتالیا', line: 'جایی است که دانش عمیق‌تر شد. بخشی را از خانه با خود داشتیم؛ هفت سال آنجا، با دست در خمیر، باقی را به ما آموخت.' },
      { name: 'یوتبوری', line: 'جایی است که به آن رسیده‌ایم، و جایی که Mjuk lov امروز در آن پخته می‌شود، در آشپزخانه‌ای خانگی.' }
    ],
    believe: 'هر جا که سفر کرده‌ایم و چشیده‌ایم، چیزی در آن به جا گذاشته است. باور ما این است. غذا هنر است، و مانند هر هنری قرار نیست از دور تماشا شود — قرار است ساخته شود، حتی به دست کسی که هرگز قیفِ قنادی در دست نگرفته است.',
    pull2: 'طعم همان خاطره است: یک لقمه می‌تواند یک بعدازظهرِ کامل، یک انسانِ کامل، و تمام دلیلِ گرد هم آمدنتان را در خود داشته باشد.',
    offer: [
      'پس Mjuk lov فقط یک چیز نیست. بخشی از آنچه می‌سازیم را خودت کامل می‌کنی — کیت‌های کیکِ خانگی و جعبه‌های جشن، جایی که تزئین همان لذت است و ناکامل بودن اصلِ ماجراست.',
      'بخشی را هم فقط می‌پزیم و آماده و کامل به دستت می‌دهیم، همان‌طور که سرِ میزِ خودمان جلوی کسی می‌گذاشتیم. هرطور که به تو برسد، برای هم‌رسانی ساخته شده — و برای آنکه همان طعمی شود که با آن به یادش می‌آوری.'
    ],
    close: 'این همان وعده‌ی نرم است.',
    sign: 'mjuk lov'
  }
};

// Fade-and-rise on scroll, gated by prefers-reduced-motion (house rule §3):
// reduced-motion visitors get the content immediately, in place. The resting
// state is fully opaque, so no text ever sits at reduced opacity.
const Reveal = ({ children, className = '' }: { children: ReactNode; className?: string }) => {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    // Reduced-motion visitors are handled without JS below, so skip the observer.
    if (reduced) return;
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  // When motion is reduced (or unavailable) the content is simply shown in
  // place — never left at reduced opacity. The animated resting state is also
  // fully opaque, so text never sits below full contrast (house rule §3).
  const animate = !reduced;

  return (
    <div
      ref={ref}
      className={`${animate ? `transition-all duration-700 ease-out ${shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}` : ''} ${className}`}
    >
      {children}
    </div>
  );
};

export const AboutStory = ({ lang }: AboutStoryProps) => {
  const t = content[lang];

  const serif = 'var(--font-cormorant), Garamond, serif';

  return (
    <section
      className="px-6 md:px-8 py-[clamp(5.5rem,10vw,8rem)]"
      style={{ backgroundColor: 'var(--vanilla-cream)' }}
      lang={lang}
    >
      <div className="max-w-[760px] mx-auto">
        {/* Opener */}
        <Reveal className="text-center mb-[clamp(3rem,7vw,4.5rem)]">
          <Magnolia className="w-11 h-11 mx-auto mb-7" />
          <p className="type-caps ink-muted mb-5">{t.eyebrow}</p>
          <h1
            className="mx-auto"
            style={{
              fontFamily: serif,
              fontStyle: 'italic',
              fontSize: 'clamp(1.75rem, 5vw, 2.75rem)',
              lineHeight: 1.28,
              color: 'var(--dusty-wine)',
              maxWidth: '18ch'
            }}
          >
            {t.lede}
          </h1>
        </Reveal>

        {/* The two of us */}
        <Reveal className="space-y-5">
          {t.us.map((p, i) => (
            <p key={i} className="type-body" style={{ lineHeight: 1.85 }}>{p}</p>
          ))}
        </Reveal>

        {/* Belief */}
        <Reveal>
          <p
            className="text-center mx-auto"
            style={{
              fontFamily: serif,
              fontSize: 'clamp(1.6rem, 4.4vw, 2.5rem)',
              lineHeight: 1.3,
              color: 'var(--dusty-wine)',
              maxWidth: '20ch',
              margin: 'clamp(3.5rem,8vw,4.75rem) auto'
            }}
          >
            {t.pull1}
          </p>
        </Reveal>

        {/* The three places — broken typographic sentence */}
        <Reveal>
          <p className="type-body" style={{ lineHeight: 1.85 }}>{t.placesIntro}</p>
          <div className="grid grid-cols-1 gap-x-8 gap-y-1.5 mt-8 sm:[grid-template-columns:auto_1fr] sm:items-baseline sm:gap-y-10">
            {t.places.map((pl, i) => (
              <Fragment key={pl.name}>
                <div
                  className={i > 0 ? 'mt-6 sm:mt-0' : ''}
                  style={{
                    fontFamily: serif,
                    fontStyle: 'italic',
                    fontSize: 'clamp(2.5rem, 7vw, 3.6rem)',
                    lineHeight: 0.95,
                    color: 'var(--dusty-wine)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {pl.name}
                </div>
                <div className="type-body" style={{ lineHeight: 1.7, color: 'var(--warm-cocoa)', paddingTop: '0.35rem' }}>
                  {pl.line}
                </div>
              </Fragment>
            ))}
          </div>
        </Reveal>

        <hr
          className="border-0 h-px mx-auto my-[clamp(3.25rem,7vw,4rem)]"
          style={{ width: '3.5rem', backgroundColor: 'rgba(61, 42, 34, 0.14)' }}
        />

        {/* What we believe */}
        <Reveal>
          <p className="type-body" style={{ lineHeight: 1.85 }}>{t.believe}</p>
        </Reveal>

        {/* Taste is the memory */}
        <Reveal>
          <p
            className="text-center mx-auto"
            style={{
              fontFamily: serif,
              fontSize: 'clamp(1.6rem, 4.4vw, 2.5rem)',
              lineHeight: 1.3,
              color: 'var(--dusty-wine)',
              maxWidth: '20ch',
              margin: 'clamp(3.5rem,8vw,4.75rem) auto'
            }}
          >
            {t.pull2}
          </p>
        </Reveal>

        {/* The offer */}
        <Reveal className="space-y-5">
          {t.offer.map((p, i) => (
            <p key={i} className="type-body" style={{ lineHeight: 1.85 }}>{p}</p>
          ))}
        </Reveal>

        {/* Close */}
        <Reveal className="text-center mt-[clamp(3.5rem,8vw,4.5rem)]">
          <p
            className="mx-auto mb-7"
            style={{
              fontFamily: serif,
              fontStyle: 'italic',
              fontSize: 'clamp(1.5rem, 4vw, 2.125rem)',
              lineHeight: 1.3,
              color: 'var(--dusty-wine)',
              maxWidth: '22ch'
            }}
          >
            {t.close}
          </p>
          <div style={{ fontFamily: serif, fontSize: '1.5rem', letterSpacing: '0.02em', color: 'var(--dusty-terracotta)' }}>
            {t.sign}
          </div>
        </Reveal>
      </div>
    </section>
  );
};
