"use client";
import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';
import { motion, useInView, AnimatePresence } from 'motion/react';
import { RoughNotation, RoughNotationGroup } from 'react-rough-notation';
import Marquee from 'react-fast-marquee';
import {
  IconCheck,
  IconPlus,
  IconMinus,
  IconChevronRight,
  IconSparkles,
  IconFileText,
  IconSearch,
  IconBolt,
  IconStar,
  IconUsers,
  IconTrendingUp,
  IconShieldCheck,
  IconClock
} from '@tabler/icons-react';
import { Sparkles, FileText, ArrowRight, CheckCircle2, Star, Zap, Shield, Clock } from 'lucide-react';
import { BsStarFill } from 'react-icons/bs';
import { DottedGlowBackground } from '../ui/dotted-glow-background';
import { HeroDemo } from '../ui/hero-demo';

// ========================================
// TYPES
// ========================================

interface LandingPageProps {
  onNavigate: (page: 'generator' | 'audit') => void;
  onOpenPaywall: () => void;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  features: string[];
  featured?: boolean;
  buttonText: string;
  popular?: boolean;
}

interface FAQ {
  question: string;
  answer: string;
}

interface Testimonial {
  name: string;
  quote: string;
  src: string;
  designation: string;
}

// ========================================
// DATA
// ========================================

const plans: Plan[] = [
  {
    id: 'generator',
    name: 'Generator',
    description: 'Dla tych, którzy chcą szybko stworzyć cennik',
    price: 0,
    currency: 'zł',
    features: [
      'Automatyczne kategoryzowanie usług',
      'Responsywny design HTML',
      'Kopiuj-wklej do Booksy',
      'Nielimitowane użycie',
      'Bez rejestracji',
    ],
    buttonText: 'Używaj za darmo',
  },
  {
    id: 'audit',
    name: 'Audyt AI',
    description: 'Profesjonalna analiza cennika z rekomendacjami',
    price: 49,
    currency: 'zł',
    features: [
      'Ocena 0-100 z wyjaśnieniem',
      'Analiza mocnych i słabych stron',
      'Konkretne rekomendacje zmian',
      'Porównanie z konkurencją',
      'Raport PDF do pobrania',
    ],
    featured: true,
    popular: true,
    buttonText: 'Kup audyt',
  },
  {
    id: 'optimize',
    name: 'AI Optymalizacja',
    description: 'AI przepisze Twój cennik językiem korzyści',
    price: 29,
    currency: 'zł',
    features: [
      'Profesjonalne opisy usług',
      'Język korzyści dla klientów',
      'Optymalna struktura cennika',
      'Gotowy HTML do wklejenia',
      'Porównanie przed/po',
    ],
    buttonText: 'Kup optymalizację',
  },
];

const faqs: FAQ[] = [
  {
    question: 'Jak działa Generator cennika?',
    answer: 'Wklej tekst ze swojego cennika lub skopiuj dane z Booksy, a AI automatycznie podzieli je na kategorie i wygeneruje elegancki kod HTML. Możesz dostosować kolory i fonty, a potem skopiować kod do swojej strony.',
  },
  {
    question: 'Co dokładnie zawiera Audyt AI?',
    answer: 'Audyt AI to kompleksowa analiza Twojego cennika: ocena w skali 0-100, lista mocnych i słabych stron, konkretne rekomendacje zmian, porównanie z branżą beauty oraz raport PDF do pobrania.',
  },
  {
    question: 'Czy muszę się rejestrować?',
    answer: 'Generator cennika jest całkowicie darmowy i nie wymaga rejestracji. Do funkcji premium (Audyt AI i Optymalizacja) wymagana jest jednorazowa płatność.',
  },
  {
    question: 'Czy mogę edytować wygenerowany cennik?',
    answer: 'Tak! Generator pozwala na pełną personalizację: zmianę kolorów, fontów, układu. Po wygenerowaniu możesz również ręcznie edytować kod HTML.',
  },
  {
    question: 'Jak długo trwa generowanie?',
    answer: 'Generator tworzy cennik w kilka sekund. Audyt AI i Optymalizacja zajmują około 30-60 sekund, ponieważ AI dokładnie analizuje każdą usługę.',
  },
  {
    question: 'Czy to działa z Booksy?',
    answer: 'Tak! Aplikacja została stworzona specjalnie z myślą o salonach korzystających z Booksy. Możesz skopiować dane bezpośrednio z panelu Booksy.',
  },
];

const testimonials: Testimonial[] = [
  {
    name: 'Anna Kowalska',
    quote: 'Mój cennik wyglądał jak z lat 90. Po użyciu Beauty Audit w końcu mam coś, z czego jestem dumna. Klientki same pytają skąd mam taki profesjonalny design!',
    src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    designation: 'Salon fryzjerski, Warszawa',
  },
  {
    name: 'Magdalena Nowak',
    quote: 'Audyt AI pokazał mi błędy, o których nie miałam pojęcia. Okazało się, że moje opisy były zbyt długie i nudne. Po zmianach mam +30% rezerwacji!',
    src: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    designation: 'Studio urody, Kraków',
  },
  {
    name: 'Katarzyna Wiśniewska',
    quote: 'Oszczędziłam godziny pracy. Wcześniej ręcznie formatowałam cennik w HTML - teraz robię to w minutę. Generator jest genialny!',
    src: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face',
    designation: 'Salon kosmetyczny, Gdańsk',
  },
  {
    name: 'Joanna Kamińska',
    quote: 'AI Optymalizacja przepisała moje opisy w sposób, który przyciąga klientki. Język korzyści naprawdę działa - widzę to w statystykach.',
    src: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    designation: 'Gabinet kosmetyczny, Poznań',
  },
  {
    name: 'Marta Lewandowska',
    quote: 'Byłam sceptyczna co do AI, ale wyniki mówią same za siebie. Mój cennik wreszcie wygląda profesjonalnie i konkurencyjnie.',
    src: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&h=150&fit=crop&crop=face',
    designation: 'Studio paznokci, Wrocław',
  },
  {
    name: 'Agnieszka Zielińska',
    quote: 'Polecam każdej właścicielce salonu! To narzędzie, które naprawdę rozumie branżę beauty. Wyniki są niesamowite.',
    src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    designation: 'Salon fryzjerski, Łódź',
  },
];

const features = [
  {
    title: 'Szybkie generowanie',
    description: 'Wklej tekst i otrzymaj profesjonalny cennik HTML w kilka sekund. Bez kodowania.',
    icon: IconClock,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    title: 'AI, który rozumie beauty',
    description: 'Sztuczna inteligencja wyszkolona na tysiącach cenników salonów beauty.',
    icon: IconSparkles,
    color: 'text-[#D4AF37]',
    bgColor: 'bg-[#D4AF37]/10',
  },
  {
    title: 'Gotowy do Booksy',
    description: 'Skopiuj kod i wklej do swojego profilu. Działa od razu.',
    icon: IconShieldCheck,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    title: 'Konkretne rekomendacje',
    description: 'Nie tylko analiza, ale też gotowe rozwiązania do wdrożenia.',
    icon: IconTrendingUp,
    color: 'text-[#722F37]',
    bgColor: 'bg-[#722F37]/10',
  },
  {
    title: 'Język korzyści',
    description: 'AI przepisuje opisy skupiając się na tym, co klientka zyska.',
    icon: IconUsers,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    title: 'Responsywny design',
    description: 'Cennik wygląda świetnie na telefonie, tablecie i komputerze.',
    icon: IconFileText,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
  },
];

// ========================================
// COMPONENTS
// ========================================

// Animated Number Component - simplified for performance
const AnimatedNumber = ({ value }: { value: number }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const isInView = useInView(ref, { once: true }); // Only animate once

  useEffect(() => {
    if (!isInView) return;

    // Simple linear animation instead of spring physics
    const duration = 1000;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      setDisplay(Math.round(value * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, value]);

  return <span ref={ref}>{display.toLocaleString()}</span>;
};

// Featured Images Component - simplified, no spring physics
const FeaturedImages = ({ showStars = true }: { showStars?: boolean }) => {
  return (
    <div className="mt-8 flex flex-col items-center">
      <div className="flex items-center gap-4">
        <div className="flex -space-x-4">
          {testimonials.slice(0, 5).map((testimonial, idx) => (
            <div
              className="group relative"
              key={testimonial.name}
            >
              {/* Simple CSS hover tooltip instead of AnimatePresence */}
              <div className="absolute -top-14 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
                <div className="bg-[#722F37] px-3 py-1.5 rounded-md text-xs font-bold text-white whitespace-nowrap shadow-lg">
                  {testimonial.name}
                </div>
              </div>
              <img
                src={testimonial.src}
                alt={testimonial.name}
                className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-md transition-transform duration-200 hover:scale-110 hover:z-30 relative"
              />
            </div>
          ))}
        </div>
        {showStars && (
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <BsStarFill key={i} className="h-4 w-4 text-[#D4AF37]" />
            ))}
          </div>
        )}
      </div>
      <p className="mt-3 text-sm text-slate-500">
        Zaufało nam już ponad <span className="font-semibold text-[#722F37]">500+</span> salonów beauty
      </p>
    </div>
  );
};

// FAQ Item Component
const FAQItem = ({
  question,
  answer,
  open,
  setOpen,
}: {
  question: string;
  answer: string;
  open: string | null;
  setOpen: (open: string | null) => void;
}) => {
  const isOpen = open === question;

  return (
    <div
      className="cursor-pointer py-5 border-b border-slate-100 last:border-0"
      onClick={() => setOpen(isOpen ? null : question)}
    >
      <div className="flex items-start">
        <div className="relative mr-4 mt-1 h-6 w-6 flex-shrink-0">
          <IconPlus
            className={cn(
              'absolute inset-0 h-6 w-6 transform text-[#722F37] transition-all duration-200',
              isOpen && 'rotate-90 scale-0'
            )}
          />
          <IconMinus
            className={cn(
              'absolute inset-0 h-6 w-6 rotate-90 scale-0 transform text-[#722F37] transition-all duration-200',
              isOpen && 'rotate-0 scale-100'
            )}
          />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-medium text-slate-800">{question}</h3>
          <AnimatePresence mode="wait">
            {isOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="overflow-hidden"
              >
                <p className="mt-3 text-slate-600">{answer}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// Pricing Card Component
const PricingCard = ({ plan, onAction }: { plan: Plan; onAction: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        'relative rounded-2xl p-8 transition-all duration-300',
        plan.featured
          ? 'bg-gradient-to-br from-[#722F37] to-[#5a252c] text-white shadow-2xl scale-105 z-10'
          : 'bg-white border border-slate-200 hover:border-[#B76E79]/50 hover:shadow-lg'
      )}
    >
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-[#722F37] text-xs font-bold px-4 py-1 rounded-full">
          BESTSELLER
        </div>
      )}

      <h3 className={cn(
        'text-xl font-bold mb-2',
        plan.featured ? 'text-white' : 'text-slate-900'
      )}>
        {plan.name}
      </h3>

      <p className={cn(
        'text-sm mb-6',
        plan.featured ? 'text-white/80' : 'text-slate-500'
      )}>
        {plan.description}
      </p>

      <div className="mb-6">
        <span className={cn(
          'text-4xl font-bold',
          plan.featured ? 'text-white' : 'text-slate-900'
        )}>
          {plan.price === 0 ? 'FREE' : `${plan.price} ${plan.currency}`}
        </span>
        {plan.price > 0 && (
          <span className={cn(
            'text-sm ml-2',
            plan.featured ? 'text-white/60' : 'text-slate-400'
          )}>
            jednorazowo
          </span>
        )}
      </div>

      <button
        onClick={onAction}
        className={cn(
          'w-full py-3 rounded-xl font-semibold transition-all mb-6',
          plan.featured
            ? 'bg-[#D4AF37] text-[#722F37] hover:bg-[#c9a432]'
            : plan.price === 0
            ? 'bg-[#722F37] text-white hover:bg-[#5a252c]'
            : 'border-2 border-[#722F37] text-[#722F37] hover:bg-[#722F37]/5'
        )}
      >
        {plan.buttonText}
      </button>

      <ul className="space-y-3">
        {plan.features.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <IconCheck className={cn(
              'h-5 w-5 flex-shrink-0 mt-0.5',
              plan.featured ? 'text-[#D4AF37]' : 'text-green-500'
            )} />
            <span className={cn(
              'text-sm',
              plan.featured ? 'text-white/90' : 'text-slate-600'
            )}>
              {feature}
            </span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
};

// Testimonial Card Component
const TestimonialCard = ({ testimonial }: { testimonial: Testimonial }) => (
  <div className="mx-4 min-w-[300px] max-w-md rounded-xl bg-white p-6 shadow-lg border border-slate-100">
    <div className="flex gap-1 mb-4">
      {[...Array(5)].map((_, i) => (
        <BsStarFill key={i} className="h-4 w-4 text-[#D4AF37]" />
      ))}
    </div>
    <p className="text-slate-700 mb-6 text-sm leading-relaxed">
      "{testimonial.quote}"
    </p>
    <div className="flex items-center gap-3">
      <img
        src={testimonial.src}
        alt={testimonial.name}
        className="w-12 h-12 rounded-full object-cover"
      />
      <div>
        <p className="font-semibold text-slate-900">{testimonial.name}</p>
        <p className="text-xs text-slate-500">{testimonial.designation}</p>
      </div>
    </div>
  </div>
);

// ========================================
// MAIN COMPONENT
// ========================================

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onOpenPaywall }) => {
  const heroRef = useRef(null);
  const isHeroInView = useInView(heroRef);
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  return (
    <div className="animate-in fade-in duration-500 overflow-x-hidden">

      {/* ===================== HERO SECTION ===================== */}
      <section ref={heroRef} className="relative py-12 md:py-20 min-h-[90vh] flex items-center w-full">
        {/* Dotted Glow Background - full viewport width breakout */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            width: '100vw',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <DottedGlowBackground
            className="pointer-events-none"
            opacity={0.7}
            gap={16}
            radius={1.2}
            color="rgba(114, 47, 55, 0.30)"
            glowColor="rgba(212, 175, 55, 0.5)"
            backgroundOpacity={0}
            speedMin={0.08}
            speedMax={0.4}
            speedScale={0.4}
          />
          {/* Gradient overlays for smooth edges */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/70 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/50 via-transparent to-white/50 pointer-events-none" />
        </div>

        <div className="max-w-7xl mx-auto w-full relative z-10 px-4">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Text Content */}
            <div className="text-center lg:text-left">
              <RoughNotationGroup show={isHeroInView}>
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#B76E79]/10 to-[#D4AF37]/10 rounded-full border border-[#D4AF37]/30 mb-6"
                >
                  <IconSparkles size={16} className="text-[#D4AF37]" />
                  <span className="text-sm font-medium text-[#722F37]">
                    Narzędzie dla profesjonalistów beauty
                  </span>
                </motion.div>

                {/* Heading */}
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-slate-900 mb-6 leading-tight tracking-tight"
                >
                  Twój cennik z Booksy{' '}
                  <RoughNotation
                    type="highlight"
                    animationDuration={2000}
                    iterations={2}
                    color="#D4AF3730"
                    multiline
                  >
                    <span className="text-[#722F37]">zasługuje na więcej</span>
                  </RoughNotation>
                </motion.h1>

                {/* Subheading */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-lg text-slate-600 max-w-xl mb-8"
                >
                  Wklej tekst cennika, a AI{' '}
                  <RoughNotation type="underline" animationDuration={1500} iterations={3} color="#722F37">
                    automatycznie go zoptymalizuje
                  </RoughNotation>
                  {' '}i wygeneruje profesjonalny kod HTML gotowy do wklejenia.
                </motion.p>
              </RoughNotationGroup>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center lg:items-start gap-4 mb-8"
              >
                <button
                  onClick={() => onNavigate('generator')}
                  className="group flex items-center gap-2 px-8 py-4 bg-[#722F37] hover:bg-[#5a252c] text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  <FileText size={20} />
                  Generator cennika
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded">FREE</span>
                  <IconChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={onOpenPaywall}
                  className="group flex items-center gap-2 px-8 py-4 text-[#722F37] font-semibold rounded-xl transition-all border-2 border-[#722F37] hover:bg-[#722F37]/5"
                >
                  <Sparkles size={20} className="text-[#D4AF37]" />
                  Audyt AI cennika
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>

              {/* Social Proof */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <FeaturedImages />
              </motion.div>
            </div>

            {/* Right: Interactive Demo */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="hidden lg:block"
            >
              <HeroDemo />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===================== STATS SECTION ===================== */}
      <section className="py-16 border-y border-slate-100 bg-slate-50/50">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: 500, suffix: '+', label: 'Salonów' },
              { value: 95, suffix: '%', label: 'Zadowolonych' },
              { value: 23, suffix: '%+', label: 'Więcej rezerwacji' },
              { value: 10000, suffix: '+', label: 'Cenników' },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-[#722F37] mb-1">
                  <AnimatedNumber value={stat.value} />
                  {stat.suffix}
                </div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== FEATURES BENTO GRID ===================== */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4">
              Dlaczego Beauty Audit?
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Narzędzia stworzone specjalnie dla branży beauty.
              Oszczędź czas i zwiększ rezerwacje.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="group p-6 rounded-2xl bg-white border border-slate-100 hover:border-[#B76E79]/30 hover:shadow-lg transition-all"
              >
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors',
                  feature.bgColor,
                  'group-hover:scale-110'
                )}>
                  <feature.icon size={24} className={feature.color} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== PRICING SECTION ===================== */}
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4">
              Proste i przejrzyste ceny
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Bez ukrytych opłat. Bez subskrypcji. Płacisz raz i korzystasz.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {plans.map((plan) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                onAction={() => {
                  if (plan.id === 'generator') {
                    onNavigate('generator');
                  } else {
                    onOpenPaywall();
                  }
                }}
              />
            ))}
          </div>

          {/* Combo Offer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-[#B76E79]/10 to-[#D4AF37]/10 border border-[#D4AF37]/30 text-center"
          >
            <div className="inline-flex items-center gap-2 bg-[#D4AF37] text-[#722F37] px-4 py-1 rounded-full text-sm font-bold mb-4">
              <IconStar size={16} />
              PAKIET PREMIUM
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              Audyt + Optymalizacja = <span className="text-[#722F37]">69 zł</span>
            </h3>
            <p className="text-slate-600 mb-6">
              Zaoszczędź 9 zł kupując oba produkty w pakiecie
            </p>
            <button
              onClick={onOpenPaywall}
              className="px-8 py-3 bg-[#722F37] text-white font-semibold rounded-xl hover:bg-[#5a252c] transition-colors"
            >
              Kup pakiet
            </button>
          </motion.div>
        </div>
      </section>

      {/* ===================== TESTIMONIALS SECTION ===================== */}
      <section className="py-20 overflow-hidden">
        <div className="max-w-6xl mx-auto mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4">
              Co mówią właścicielki salonów?
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Dołącz do setek zadowolonych klientek z całej Polski.
            </p>
          </motion.div>
        </div>

        <div className="relative">
          <div className="[mask-image:linear-gradient(to_right,transparent_0%,white_10%,white_90%,transparent_100%)]">
            <Marquee speed={40} pauseOnHover gradient={false}>
              {testimonials.map((testimonial, idx) => (
                <TestimonialCard key={idx} testimonial={testimonial} />
              ))}
            </Marquee>
          </div>
        </div>
      </section>

      {/* ===================== FAQ SECTION ===================== */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4">
              Często zadawane pytania
            </h2>
            <p className="text-lg text-slate-600">
              Nie znalazłeś odpowiedzi? Napisz do nas!
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 md:p-8"
          >
            {faqs.map((faq, idx) => (
              <FAQItem
                key={idx}
                question={faq.question}
                answer={faq.answer}
                open={openFaq}
                setOpen={setOpenFaq}
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===================== FINAL CTA SECTION ===================== */}
      <section className="py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto p-12 rounded-3xl bg-gradient-to-r from-[#722F37] to-[#B76E79] text-white text-center relative overflow-hidden"
        >
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full translate-x-1/4 translate-y-1/4" />

          <div className="relative z-10">
            <IconSparkles size={48} className="text-[#D4AF37] mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
              Gotowa na lepszy cennik?
            </h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto text-lg">
              Zacznij od darmowego generatora lub zainwestuj w pełny audyt AI.
              Twoje klientki zauważą różnicę.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => onNavigate('generator')}
                className="px-8 py-4 bg-white text-[#722F37] font-bold rounded-xl hover:bg-slate-100 transition-colors shadow-lg"
              >
                Zacznij za darmo
              </button>
              <button
                onClick={onOpenPaywall}
                className="px-8 py-4 border-2 border-white text-white font-bold rounded-xl hover:bg-white/10 transition-colors"
              >
                Zobacz pakiety premium
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="py-12 border-t border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="mb-4">
                <span className="font-serif text-xl font-bold text-[#722F37]">
                  Beauty Audit
                </span>
              </div>
              <p className="text-sm text-slate-500">
                Narzędzia dla profesjonalistów beauty.
                Twórz piękne cenniki i przyciągaj więcej klientów.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Produkty</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="#" onClick={(e) => { e.preventDefault(); onNavigate('generator'); }} className="hover:text-[#722F37]">Generator cennika</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); onOpenPaywall(); }} className="hover:text-[#722F37]">Audyt AI</a></li>
                <li><a href="#" onClick={(e) => { e.preventDefault(); onOpenPaywall(); }} className="hover:text-[#722F37]">AI Optymalizacja</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Wsparcie</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="#" className="hover:text-[#722F37]">FAQ</a></li>
                <li><a href="#" className="hover:text-[#722F37]">Kontakt</a></li>
                <li><a href="#" className="hover:text-[#722F37]">Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Prawne</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="#" className="hover:text-[#722F37]">Regulamin</a></li>
                <li><a href="#" className="hover:text-[#722F37]">Polityka prywatności</a></li>
                <li><a href="#" className="hover:text-[#722F37]">Cookies</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 text-center text-sm text-slate-400">
            © 2024 Beauty Audit. Stworzone z ❤️ przez Alex Miesak.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
