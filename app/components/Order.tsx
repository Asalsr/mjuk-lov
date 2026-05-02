'use client';

import { useEffect, useRef, useState, FormEvent } from 'react';
import { WaxSeal } from './WaxSeal';
import { MagneticButton } from './MagneticButton';

interface OrderProps {
  lang: 'sv' | 'en';
}

const content = {
  sv: {
    heading: 'Hör av dig.',
    lede: 'Vi svarar inom 24 timmar. Oftast snabbare.',
    typeLabel: 'Jag är intresserad av',
    typeOptions: ['Tårtkit', 'Företagsprenumeration', 'Annat'],
    productLabel: 'Produkt eller fråga',
    nameLabel: 'Ditt namn',
    emailLabel: 'Din e-post',
    messageLabel: 'Berätta mer',
    submit: 'Skicka',
    successHeading: 'Tack.',
    successMessage: 'Vi återkommer inom 24 timmar.'
  },
  en: {
    heading: 'Get in touch.',
    lede: 'We respond within 24 hours. Usually faster.',
    typeLabel: 'I am interested in',
    typeOptions: ['Cake Kit', 'Corporate Subscription', 'Other'],
    productLabel: 'Product or question',
    nameLabel: 'Your name',
    emailLabel: 'Your email',
    messageLabel: 'Tell us more',
    submit: 'Send',
    successHeading: 'Thank you.',
    successMessage: 'We will get back to you within 24 hours.'
  }
};

export const Order = ({ lang }: OrderProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    type: '',
    product: '',
    name: '',
    email: '',
    message: ''
  });
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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    localStorage.setItem('mjuklov_order', JSON.stringify({ ...formData, timestamp: Date.now() }));
    setIsSubmitted(true);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <section
      id="order"
      ref={ref}
      className="py-[clamp(6rem,12vw,12rem)] px-4 md:px-8"
      style={{ backgroundColor: 'var(--warm-cocoa)', color: 'var(--vanilla-cream)' }}
    >
      <div className="max-w-[1000px] mx-auto">
        {!isSubmitted ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
            <div
              className={`transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <h2 className="mb-6" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}>
                {t.heading}
              </h2>

              <p className="italic mb-12 opacity-80" style={{ fontSize: 'clamp(1.125rem, 2vw, 1.25rem)' }}>
                {t.lede}
              </p>

              <WaxSeal size={100} interactive />
            </div>

            <form
              onSubmit={handleSubmit}
              className={`space-y-8 transition-all duration-700 delay-150 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <div>
                <label className="block mb-3 opacity-80" style={{ fontSize: '0.95rem' }}>
                  {t.typeLabel}
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  className="w-full bg-transparent border-b pb-3 outline-none transition-all duration-300 focus:border-opacity-100 focus:scale-105 focus:translate-x-2"
                  style={{
                    borderColor: 'rgba(252, 242, 228, 0.3)',
                    fontSize: '1.125rem'
                  }}
                >
                  <option value="" disabled style={{ color: 'var(--warm-cocoa)' }}>—</option>
                  {t.typeOptions.map(opt => (
                    <option key={opt} value={opt} style={{ color: 'var(--warm-cocoa)' }}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-3 opacity-80" style={{ fontSize: '0.95rem' }}>
                  {t.productLabel}
                </label>
                <input
                  type="text"
                  value={formData.product}
                  onChange={(e) => handleChange('product', e.target.value)}
                  className="w-full bg-transparent border-b pb-3 outline-none transition-all duration-300 focus:border-opacity-100 focus:scale-105 focus:translate-x-2"
                  style={{
                    borderColor: 'rgba(252, 242, 228, 0.3)',
                    fontSize: '1.125rem'
                  }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <label className="block mb-3 opacity-80" style={{ fontSize: '0.95rem' }}>
                    {t.nameLabel}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full bg-transparent border-b pb-3 outline-none transition-all duration-300 focus:border-opacity-100 focus:scale-105"
                    style={{
                      borderColor: 'rgba(252, 242, 228, 0.3)',
                      fontSize: '1.125rem'
                    }}
                  />
                </div>

                <div>
                  <label className="block mb-3 opacity-80" style={{ fontSize: '0.95rem' }}>
                    {t.emailLabel}
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full bg-transparent border-b pb-3 outline-none transition-all duration-300 focus:border-opacity-100 focus:scale-105"
                    style={{
                      borderColor: 'rgba(252, 242, 228, 0.3)',
                      fontSize: '1.125rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block mb-3 opacity-80" style={{ fontSize: '0.95rem' }}>
                  {t.messageLabel}
                </label>
                <textarea
                  rows={4}
                  value={formData.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  className="w-full bg-transparent border-b pb-3 outline-none resize-none transition-all duration-300 focus:border-opacity-100 focus:scale-105 focus:translate-x-2"
                  style={{
                    borderColor: 'rgba(252, 242, 228, 0.3)',
                    fontSize: '1.125rem'
                  }}
                />
              </div>

              <MagneticButton
                type="submit"
                className="px-8 py-3 transition-all duration-300 hover:bg-[var(--vanilla-cream)] hover:text-[var(--warm-cocoa)] hover:shadow-xl"
                style={{
                  fontFamily: 'var(--font-inter), sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.18em',
                  fontSize: '0.75rem',
                  border: '1px solid var(--vanilla-cream)'
                }}
              >
                {t.submit}
              </MagneticButton>
            </form>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="mb-8 flex justify-center animate-pulse">
              <WaxSeal size={120} interactive />
            </div>
            <h2 className="mb-4" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}>
              {t.successHeading}
            </h2>
            <p className="italic opacity-80" style={{ fontSize: 'clamp(1.125rem, 2vw, 1.25rem)' }}>
              {t.successMessage}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
