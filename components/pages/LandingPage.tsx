"use client";
import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import Footer from '../ui/Footer';
import { motion, AnimatePresence } from 'motion/react';
import {
  IconChevronRight,
  IconSparkles,
  IconArrowRight,
  IconWand,
  IconPlus,
  IconMinus,
  IconCheck,
  IconSearch,
  IconAlertCircle,
  IconTrendingUp,
  IconRepeat,
  IconGift,
  IconCategory,
  IconPhoto,
  IconCode,
  IconDeviceMobile,
  IconPalette,
  IconLink,
  IconUsers,
  IconShieldCheck,
  IconClock,
} from '@tabler/icons-react';
import { BsStarFill } from 'react-icons/bs';

// Magic UI Components
import { NumberTicker } from '../ui/number-ticker';
import { ShimmerButton } from '../ui/shimmer-button';
import { RainbowButton } from '../ui/rainbow-button';
import { BorderBeam } from '../ui/border-beam';
import { Marquee } from '../ui/marquee';
import { AnimatedShinyText } from '../ui/animated-shiny-text';
import { MagicCard } from '../ui/magic-card';
import { BlurFade } from '../ui/blur-fade';
import { AnimatedCircularProgressBar } from '../ui/animated-circular-progress-bar';

import { BooksyAuditDemo } from '../ui/booksy-audit-demo';
import { AuroraText } from '../ui/aurora-text';
import { HeroHighlight } from '../ui/hero-highlight';
import { TextAnimate } from '../ui/text-animate';
import { ScrollVelocityContainer, ScrollVelocityRow } from '../ui/scroll-based-velocity';
import { StatsGrid } from '../ui/stats-grid';
import { LampDivider } from '../ui/lamp';
import { DottedGlowBackground } from '../ui/dotted-glow-background';
import { ShineBorder } from '../ui/shine-border';

// ========================================
// TYPES
// ========================================

interface LandingPageProps {
  onNavigate: (page: 'generator' | 'audit') => void;
  onOpenPaywall: () => void;
}

// ========================================
// DATA
// ========================================

const testimonials = [
  {
    name: 'Kasia M.',
    quote: 'Serio nie wiem czemu tak długo z tym zwlekałam. W tydzień po zmianach miałam 6 nowych klientek na lashach.',
    result: '+6 klientek/tydz',
    salon: 'Lash Studio Kasia',
    city: 'Warszawa',
    src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
  },
  {
    name: 'Magda',
    quote: 'Myślałam że mój cennik jest ok, a tu wychodzi że mam 14 usług które się powtarzają pod innymi nazwami xD',
    result: 'porządek w cenniku',
    salon: 'Beauty by Magda',
    city: 'Kraków',
    src: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
  },
  {
    name: 'Ania Kowalczyk',
    quote: 'Dziewczyny, ten audyt to był strzał w dziesiątkę. W końcu ktoś mi wytłumaczył czemu klientki uciekają z cennika.',
    result: '-40% porzuceń',
    salon: 'Ania Hair',
    city: 'Wrocław',
    src: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face',
  },
  {
    name: 'Paulina',
    quote: 'No i teraz rozumiem dlaczego inne salony mają pełny grafik a ja nie. Mój opis usług był tragiczny.',
    result: '+50% rezerwacji',
    salon: 'Paulina Nails',
    city: 'Poznań',
    src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
  },
  {
    name: 'Marta W.',
    quote: 'Za 80 zł dostałam listę rzeczy do poprawy którą normalnie konsultant by mi policzył z 500+. Szok.',
    result: '10x taniej niż konsultant',
    salon: 'Studio Marta',
    city: 'Gdańsk',
    src: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&h=150&fit=crop&crop=face',
  },
  {
    name: 'Ola',
    quote: 'Klientka wczoraj powiedziała że w końcu rozumie co oferuję i czym się różnią pakiety. Pierwszy raz!',
    result: 'zero pytań o cennik',
    salon: 'Aleksandra Beauty',
    city: 'Łódź',
    src: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
  },
  {
    name: 'Justyna K.',
    quote: 'Poprawiłam opisy według raportu w niedzielę, w poniedziałek rano 3 rezerwacje. Przypadek? Nie sądzę.',
    result: '+3 rez. od razu',
    salon: 'JK Lashes & Brows',
    city: 'Katowice',
    src: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=150&h=150&fit=crop&crop=face',
  },
  {
    name: 'Natalia',
    quote: 'Najbardziej pomogło mi to że napisali JAK mam pisać opisy. Nie tylko co jest źle ale jak to naprawić.',
    result: 'gotowe wzory',
    salon: 'Natalia Beauty Studio',
    city: 'Szczecin',
    src: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=150&h=150&fit=crop&crop=face',
  },
  {
    name: 'Weronika',
    quote: 'Auć, raport był brutalny ale szczery. Pół moich usług miało identyczne opisy copy paste...',
    result: 'uczciwa ocena',
    salon: 'Weronika Hair Design',
    city: 'Bydgoszcz',
    src: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face',
  },
  {
    name: 'Dominika',
    quote: 'Generator cennika w 5 min zrobił to nad czym ja siedziałam 2 wieczory. I wygląda 100x lepiej.',
    result: '2 wieczory oszczędności',
    salon: 'Dominika Nails Art',
    city: 'Lublin',
    src: 'https://images.unsplash.com/photo-1557053910-d9eadeed1c58?w=150&h=150&fit=crop&crop=face',
  },
  {
    name: 'Agnieszka',
    quote: 'Mój mąż (marketingowiec) przeczytał raport i powiedział że to konkret a nie lanie wody. Polecam.',
    result: 'konkretne wskazówki',
    salon: 'Agnieszka Lashes',
    city: 'Białystok',
    src: 'https://images.unsplash.com/photo-1499557354967-2b2d8910bcca?w=150&h=150&fit=crop&crop=face',
  },
  {
    name: 'Karolina P.',
    quote: 'Nie wiedziałam że Booksy ma tyle opcji do wykorzystania. Sam profil to było 30% możliwości.',
    result: 'pełne wykorzystanie Booksy',
    salon: 'Karolina Beauty Bar',
    city: 'Rzeszów',
    src: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face',
  },
  {
    name: 'Ewelina',
    quote: 'Zdjęcia! Nikt mi wcześniej nie powiedział że moje zdjęcia odstraszają. Teraz mam normalne i działa.',
    result: 'lepsze zdjęcia = więcej rez.',
    salon: 'Ewelina Studio Urody',
    city: 'Olsztyn',
    src: 'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?w=150&h=150&fit=crop&crop=face',
  },
  {
    name: 'Sandra',
    quote: 'Raport dostałam w 20 min. Myślałam że to jakaś automatyczna bzdura ale serio ktoś to przeanalizował.',
    result: 'szybko i dokładnie',
    salon: 'Sandra Hair',
    city: 'Toruń',
    src: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150&h=150&fit=crop&crop=face',
  },
  {
    name: 'Monika',
    quote: 'Konkurencja ma gorsze usługi ale lepszy profil i dlatego ma więcej klientek. Teraz już wiem co poprawić.',
    result: 'analiza konkurencji',
    salon: 'Monika Stylizacja',
    city: 'Kielce',
    src: 'https://images.unsplash.com/photo-1485893086445-ed75865251e0?w=150&h=150&fit=crop&crop=face',
  },
  {
    name: 'Patrycja',
    quote: 'Zrobiłam audyt z ciekawości bo 80 zł to nie majątek. Okazało się że to najlepsza inwestycja w tym miesiącu.',
    result: 'ROI w tydzień',
    salon: 'Patrycja Beauty',
    city: 'Gliwice',
    src: 'https://images.unsplash.com/photo-1526510747491-58f928ec870f?w=150&h=150&fit=crop&crop=face',
  },
  {
    name: 'Iza',
    quote: 'Przestałam się bać że klientki widzą mój cennik. Wcześniej serio miałam z tym problem.',
    result: 'pewność siebie',
    salon: 'Iza Lashes & More',
    city: 'Zabrze',
    src: 'https://images.unsplash.com/photo-1464863979621-258859e62245?w=150&h=150&fit=crop&crop=face',
  },
  {
    name: 'Aleksandra',
    quote: 'Moje "Strzyżenie damskie" zamieniło się w "Strzyżenie z konsultacją i stylizacją włosów". Brzmi lepiej, co nie?',
    result: 'profesjonalne nazwy',
    salon: 'Hair by Ola',
    city: 'Częstochowa',
    src: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face',
  },
];

const faqs = [
  {
    question: 'Co dokładnie zawiera audyt profilu Booksy?',
    answer: 'Audyt obejmuje kompleksową analizę 60+ punktów w 5 kluczowych kategoriach: strukturę i nawigację cennika, jakość copywritingu i opisów usług, strategię cenową i pozycjonowanie, UX/UI oraz potencjał konwersji. Otrzymujesz szczegółowy raport PDF z oceną każdego elementu i konkretnymi rekomendacjami.',
  },
  {
    question: 'Jak długo trwa audyt i kiedy otrzymam wyniki?',
    answer: 'Audyt może trwać nawet do 90 minut - mimo że to system AI, każdy element profilu jest szczegółowo weryfikowany. Po opłaceniu i przejściu onboardingu możesz spokojnie opuścić stronę. O zakończeniu audytu poinformujemy Cię mailem z linkiem do raportu PDF.',
  },
  {
    question: 'Czy audyt jest jednorazowy czy wymaga subskrypcji?',
    answer: 'To zakup jednorazowy - płacisz raz i audyt jest Twój na zawsze. Żadnych ukrytych opłat, subskrypcji czy odnowień. Jeśli w przyszłości chcesz sprawdzić profil ponownie po wprowadzeniu zmian, po prostu kupujesz nowy audyt.',
  },
  {
    question: 'Jak mogę zapłacić za audyt?',
    answer: 'Akceptujemy wszystkie popularne metody płatności: karty kredytowe i debetowe (Visa, Mastercard), BLIK, szybkie przelewy bankowe oraz Apple Pay i Google Pay. Płatności obsługuje bezpieczny system Stripe. Wystawiamy faktury VAT - wysyłane są automatycznie mailem po opłaceniu usługi.',
  },
  {
    question: 'Czy mój profil Booksy musi być publiczny?',
    answer: 'Tak, audyt analizuje publicznie dostępne informacje z Twojego profilu Booksy. Wystarczy, że podasz link do swojego profilu lub nazwę salonu - AI automatycznie pobierze wszystkie potrzebne dane.',
  },
  {
    question: 'Co jeśli nie jestem zadowolona z audytu?',
    answer: 'Masz 30 dni na ocenę audytu. Jeśli uznasz, że kompletnie nic Ci nie dał - niezależnie od powodu - napisz na zwroty@beautyaudit.pl. W ciągu kilku dni dostaniesz 100% zwrotu. Bez pytań, bez tłumaczenia się, bez stresu.',
  },
  {
    question: 'Czym różni się audyt podstawowy od wersji z konsultacją?',
    answer: 'W audyt włożyliśmy ponad dekadę doświadczenia w marketingu branży beauty - cała ta wiedza została przekuta w system AI, który analizuje profile z laserową precyzją. Sam audyt daje Ci kompletny obraz i konkretne rekomendacje. Wersja z konsultacją (+2h) to dodatkowe wsparcie: omawiamy wyniki, wyjaśniamy niuanse i pomagamy wdrożyć zmiany krok po kroku.',
  },
  {
    question: 'Czy mogę później dokupić konsultację?',
    answer: 'Tak, możesz dokupić konsultację w dowolnym momencie. W promocji kosztuje 220 zł, a w cenie regularnej 280 zł. Dlatego warto rozważyć pakiet z konsultacją od razu - oszczędzasz nawet 60 zł.',
  },
  {
    question: 'Ile salonów przeszło już przez audyt?',
    answer: 'Nasz system przeanalizował już ponad 2500 profili Booksy w Polsce. Średnio salony, które wdrożyły nasze rekomendacje, odnotowują wzrost rezerwacji nawet o 50% w ciągu pierwszych 3 miesięcy.',
  },
  {
    question: 'Czy audyt pomoże mi wyróżnić się na tle konkurencji?',
    answer: 'Zdecydowanie tak. Raport zawiera analizę konkurencji w Twojej okolicy i wskazuje konkretne elementy, które pomogą Ci się wyróżnić - od unikalnych opisów usług po optymalną strategię cenową.',
  },
  {
    question: 'Jak wygląda raport PDF?',
    answer: 'Raport to profesjonalny dokument liczący 15-25 stron. Zawiera ogólną ocenę profilu, szczegółową analizę każdej kategorii z oceną punktową, listę priorytetowych zmian do wdrożenia oraz przykłady poprawnych rozwiązań.',
  },
  {
    question: 'Czy mogę zlecić wam wdrożenie zmian?',
    answer: 'Tak, oferujemy usługę kompleksowej optymalizacji profilu Booksy. Po audycie możesz zamówić wdrożenie wszystkich rekomendacji przez nasz zespół. Skontaktuj się z nami po audycie, by poznać szczegóły i cenę.',
  },
];

// Testimonial Card
const TestimonialCard = ({ testimonial }: { testimonial: typeof testimonials[0] }) => (
  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-lg min-w-[300px] max-w-[340px] mx-3">
    <div className="flex gap-0.5 mb-3">
      {[...Array(5)].map((_, i) => (
        <BsStarFill key={i} className="h-3.5 w-3.5 text-[#D4A574]" />
      ))}
    </div>
    <p className="text-slate-700 mb-4 text-sm leading-relaxed">"{testimonial.quote}"</p>
    <div className="mb-3">
      <span className="px-2.5 py-1 bg-gradient-to-r from-[#D4A574]/15 to-[#B8860B]/15 text-[#8B6914] text-xs font-semibold rounded-full">{testimonial.result}</span>
    </div>
    <div className="flex items-center gap-3">
      <img
        src={testimonial.src}
        alt={testimonial.name}
        className="w-9 h-9 rounded-full object-cover"
      />
      <div>
        <p className="font-semibold text-slate-900 text-sm">{testimonial.name}</p>
        <p className="text-xs text-slate-500">{testimonial.salon}</p>
      </div>
    </div>
  </div>
);

// FAQ Item
const FAQItem = ({ faq, isOpen, onClick }: { faq: typeof faqs[0]; isOpen: boolean; onClick: () => void }) => (
  <div className="border-b border-slate-100 last:border-0">
    <button onClick={onClick} className="w-full py-4 flex items-center justify-between text-left">
      <span className="font-medium text-slate-900 pr-4">{faq.question}</span>
      <div className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center transition-all shrink-0",
        isOpen ? "bg-[#171717] rotate-180" : "bg-slate-100"
      )}>
        {isOpen ? <IconMinus size={14} className="text-white" /> : <IconPlus size={14} className="text-slate-600" />}
      </div>
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <p className="pb-4 text-slate-600 text-sm leading-relaxed">{faq.answer}</p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

// ========================================
// MAIN COMPONENT
// ========================================

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onOpenPaywall }) => {
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  return (
    <div className="overflow-x-hidden">

      {/* ===================== HERO: AUDYT BOOKSY ===================== */}
      <HeroHighlight
        containerClassName="relative py-12 md:py-16 min-h-[75vh] flex items-center bg-gradient-to-b from-slate-50 to-white"
        dotColor="rgba(212, 165, 116, 0.12)"
        dotColorHighlight="rgba(212, 165, 116, 0.8)"
      >
        <div className="relative max-w-7xl mx-auto w-full px-4">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Copy */}
            <div className="text-center lg:text-left">
              <BlurFade delay={0.1} inView>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4A574]/10 rounded-full border border-[#D4A574]/30 mb-6">
                  <IconTrendingUp size={16} className="text-[#D4A574]" />
                  <AnimatedShinyText className="text-sm font-medium text-[#D4A574]">
                    Zwiększ rezerwacje nawet o 50%
                  </AnimatedShinyText>
                </div>
              </BlurFade>

              <BlurFade delay={0.2} inView>
                <h2 className="text-5xl md:text-5xl lg:text-[3.5rem] font-serif font-bold text-slate-900 mb-6 leading-[1.1]">
                  Więcej klientów{' '}
                  <br className="hidden sm:block" />
                  <AuroraText colors={["#D4A574", "#C9956C", "#E8C4A0", "#B8860B"]}>
                    z Booksy
                  </AuroraText>
                </h2>
              </BlurFade>

              <BlurFade delay={0.3} inView>
                <p className="text-lg text-slate-600 mb-8 max-w-xl mx-auto lg:mx-0">
                  Przeanalizujemy <mark className="bg-[#D4A574]/20 text-slate-800 px-1 rounded">60 kluczowych elementów</mark> skutecznego profilu Booksy — sprawdzimy Twój cennik i pokażemy co poprawić, żeby był czytelny i przyjazny dla nowych klientów. Bazujemy na <mark className="bg-[#D4A574]/20 text-slate-800 px-1 rounded">latach doświadczenia w branży beauty</mark>, analizie Twojej konkurencji i sprawdzonych strategiach marketingowych, wypracowanych w trakcie kampanii prowadzonych dla naszych klientów.
                </p>
              </BlurFade>

              {/* Desktop: CTA Button */}
              <BlurFade delay={0.4} inView>
                <div className="hidden lg:block">
                  <RainbowButton className="text-base px-8 py-3">
                    Dowiedz się więcej
                  </RainbowButton>
                </div>
              </BlurFade>

              {/* Trust badges */}
              <BlurFade delay={0.5} inView>
                <div className="flex items-center justify-center lg:justify-start gap-6 mt-8">
                  <img
                    src="/reviews/review.svg"
                    alt="5/5 Overall Consumers"
                    className="h-18 w-auto opacity-70 hover:opacity-100 transition-opacity"
                  />
                  <img
                    src="/reviews/t100-fastest-growing.png"
                    alt="T100 Fastest Growing"
                    className="h-18 w-auto opacity-70 hover:opacity-100 transition-opacity"
                  />
                  <img
                    src="/reviews/t50-cs.png"
                    alt="T50 Customer Service"
                    className="h-18 w-auto opacity-70 hover:opacity-100 transition-opacity"
                  />
                </div>
              </BlurFade>
            </div>

            {/* Right: BooksyAuditDemo */}
            <BlurFade delay={0.3} inView>
              <div className="relative mt-8 lg:mt-0">
                {/* Mobile: wider scale */}
                <div className="block lg:hidden transform scale-[0.85] origin-top -mb-8">
                  <BooksyAuditDemo />
                </div>
                {/* Desktop: full size */}
                <div className="hidden lg:block">
                  <BooksyAuditDemo />
                </div>

                {/* Handwritten annotation with arrow - hidden on mobile */}
                <div className="hidden lg:flex absolute -left-[140px] top-[40px] flex-col items-start pointer-events-none">
                  <span
                    className="text-[#D4A574] text-xl text-right -rotate-6 leading-tight"
                    style={{ fontFamily: "'Shadows Into Light Two', cursive" }}
                  >
                    Wyprzedź swoją<br />konkurencję
                  </span>
                  {/* Hand-drawn arrow SVG */}
                  <svg
                    width="100"
                    height="50"
                    viewBox="0 -76.5 193 193"
                    fill="none"
                    className="ml-6 rotate-[25deg]"
                  >
                    <path
                      d="M173.928 21.1292C115.811 44.9386 58.751 45.774 0 26.1417C4.22669 21.7558 7.81938 23.4266 10.5667 24.262C31.7002 29.9011 53.4676 30.5277 75.0238 31.3631C106.09 32.6162 135.465 25.5151 164.207 14.0282C165.475 13.6104 166.532 12.775 169.068 11.1042C154.486 8.18025 139.903 13.1928 127.223 7.34485C127.435 6.50944 127.435 5.46513 127.646 4.62971C137.156 4.00315 146.877 3.37658 156.388 2.54117C165.898 1.70575 175.196 0.661517 184.706 0.0349538C191.68 -0.382755 194.639 2.9589 192.103 9.22453C188.933 17.3698 184.495 24.8886 180.48 32.6162C180.057 33.4516 179.423 34.4959 178.578 34.9136C176.253 35.749 173.928 35.9579 171.392 36.5845C170.97 34.4959 169.913 32.1985 170.124 30.3188C170.547 27.8126 172.026 25.724 173.928 21.1292Z"
                      fill="#D4A574"
                    />
                  </svg>
                </div>
              </div>
            </BlurFade>
          </div>

          {/* Mobile: Input field below animation - full viewport width */}
          <BlurFade delay={0.5} inView>
            <div className="lg:hidden relative -mt-12 z-10 -mx-4 w-[calc(100%+2rem)]">
              {/* Gradient overlay to fade animation above */}
              <div className="absolute -top-28 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/70 to-transparent pointer-events-none" />
              <div className="relative p-5 bg-white border-y border-slate-200 shadow-xl">
                <p className="text-sm text-slate-600 mb-3 font-medium text-center">Wklej link do swojego profilu:</p>
                <div className="flex flex-col items-stretch gap-2">
                  <div className="relative">
                    <input
                      type="url"
                      placeholder="https://booksy.com/pl-pl/..."
                      className="w-full h-12 px-4 pr-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#D4A574] focus:ring-2 focus:ring-[#D4A574]/20 transition-all"
                    />
                    <IconLink size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                  <button
                    onClick={onOpenPaywall}
                    className="h-12 px-6 rounded-xl bg-[#D4A574] text-white text-sm font-bold hover:bg-[#c9956c] transition-colors whitespace-nowrap flex items-center justify-center gap-2 shadow-lg shadow-[#D4A574]/25"
                  >
                    Sprawdź profil
                    <IconArrowRight size={16} />
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-3 text-center">
                  <span className="line-through text-slate-300">149,99 zł</span> <span className="font-bold text-[#D4A574]">79,90 zł</span> · Promocja do końca roku!
                </p>
              </div>

              {/* Benefits */}
              <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-600 mt-4">
                {[
                  { icon: IconSearch, text: "60 punktów" },
                  { icon: IconPhoto, text: "Audyt zdjęć" },
                  { icon: IconSparkles, text: "Rekomendacje AI" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <item.icon size={14} className="text-[#D4A574]" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </BlurFade>
        </div>
      </HeroHighlight>

      {/* ===================== STATS GRID ===================== */}
      <StatsGrid />

      {/* ===================== SCROLL VELOCITY BANNER ===================== */}
      <section className="py-6 bg-white overflow-hidden">
        <ScrollVelocityContainer className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-[-0.02em] text-slate-100 uppercase">
          <ScrollVelocityRow baseVelocity={1} direction={1}>
            <span className="mx-12">Nawet 50% więcej klientów z tego samego ruchu</span>
            <span className="mx-12">Audyt poparty doświadczeniem agencji</span>
          </ScrollVelocityRow>
          <ScrollVelocityRow baseVelocity={1} direction={-1}>
            <span className="mx-12">Pracujemy z salonami z całej Polski</span>
            <span className="mx-12">Nawet 50% więcej klientów z tego samego ruchu</span>
          </ScrollVelocityRow>
        </ScrollVelocityContainer>
      </section>

      {/* ===================== DEKADA DOŚWIADCZENIA W AI ===================== */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <BlurFade delay={0.1} inView>
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-[#D4A574] uppercase tracking-wider mb-3">
                Ponad dekada doświadczenia
              </p>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4">
                Wiedza ekspertów przekuta w AI
              </h2>
              <p className="text-lg text-slate-600 max-w-3xl mx-auto">
                W audyt włożyliśmy ponad dekadę doświadczenia w marketingu branży beauty.
                Cała ta wiedza została przekuta w system AI, który analizuje profile z laserową precyzją.
              </p>
            </div>
          </BlurFade>

          {/* 3 Cards Grid - using skeleton pattern from GeneratorPage */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Dekada w branży beauty - BeforeAfterSkeleton style */}
            <BlurFade delay={0.2} inView>
              <motion.div
                whileHover="animate"
                className="group isolate flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05),0_2px_3px_rgba(0,0,0,0.04)]"
              >
                <div className="relative h-56 overflow-hidden [mask-image:linear-gradient(to_bottom,white_60%,transparent_100%)]">
                  <div
                    className="relative h-60 overflow-hidden md:h-72"
                    style={{ perspective: '800px', transformStyle: 'preserve-3d' }}
                  >
                    <div
                      className="h-full w-full -translate-y-2 scale-[1.2]"
                      style={{
                        transform: 'rotateX(30deg) rotateY(-20deg) rotateZ(15deg)',
                        maskImage: 'linear-gradient(to right, transparent 0%, white 15%, white 85%, transparent 100%)',
                        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, white 15%, white 85%, transparent 100%)',
                      }}
                    >
                      {/* Top card - Experience result */}
                      <motion.div
                        initial={{ opacity: 0, y: 60, x: -30 }}
                        whileInView={{ opacity: 1, y: 0, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                        viewport={{ once: true }}
                        className="absolute bottom-14 left-12 z-30 mx-auto h-fit w-full max-w-[90%] rounded-2xl border border-green-300 bg-white p-3 shadow-2xl"
                      >
                        <div className="flex items-center gap-3">
                          <IconCheck className="size-4 text-green-600" />
                          <p className="text-sm font-medium text-slate-800">10+ lat doświadczenia</p>
                          <div className="ml-auto flex w-fit items-center gap-1 rounded-full border border-green-300 bg-green-300/10 px-1.5 py-0.5 text-green-600">
                            <IconCheck className="size-3" />
                            <p className="text-[10px] font-bold">Zweryfikowane</p>
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-slate-400">Sprawdzone strategie z setek salonów beauty w całej Polsce.</p>
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          <div className="rounded-sm bg-green-100 px-1.5 py-0.5 text-[10px] text-green-700">Marketing</div>
                          <div className="rounded-sm bg-green-100 px-1.5 py-0.5 text-[10px] text-green-700">Booksy</div>
                          <div className="rounded-sm bg-green-100 px-1.5 py-0.5 text-[10px] text-green-700">Beauty</div>
                        </div>
                      </motion.div>

                      {/* Middle card - Processing */}
                      <motion.div
                        initial={{ opacity: 0, y: 40, x: -20 }}
                        whileInView={{ opacity: 1, y: 0, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                        viewport={{ once: true }}
                        className="absolute bottom-24 left-6 z-20 mx-auto h-fit w-full max-w-[85%] rounded-2xl border border-[#D4A574]/50 bg-white p-3 shadow-2xl"
                      >
                        <div className="flex items-center gap-3">
                          <IconSparkles className="size-4 text-[#D4A574]" />
                          <p className="text-sm font-medium text-slate-800">Przekuwanie w AI</p>
                          <div className="ml-auto flex w-fit items-center gap-1 rounded-full border border-[#D4A574] bg-[#D4A574]/10 px-1.5 py-0.5 text-[#D4A574]">
                            <IconClock className="size-3" />
                            <p className="text-[10px] font-bold">W toku</p>
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-slate-400">Wiedza ekspertów kodowana w algorytmy.</p>
                      </motion.div>

                      {/* Bottom card - Raw experience */}
                      <motion.div
                        initial={{ opacity: 0, y: 20, x: -10 }}
                        whileInView={{ opacity: 0.6, y: 0, x: 0 }}
                        transition={{ duration: 0.6, delay: 0, ease: "easeOut" }}
                        viewport={{ once: true }}
                        className="absolute bottom-32 left-2 z-10 mx-auto h-fit w-full max-w-[80%] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl"
                      >
                        <div className="flex items-center gap-3">
                          <IconUsers className="size-4 text-slate-400" />
                          <p className="text-sm font-medium text-slate-800">Setki salonów</p>
                        </div>
                        <p className="mt-2 text-xs text-slate-400">Kampanie, audyty, optymalizacje.</p>
                      </motion.div>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-sans text-base font-semibold tracking-tight text-slate-800">
                    Dekada w branży beauty
                  </h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                    Pracowaliśmy z setkami salonów. Wiemy, co działa, a co tylko wygląda dobrze.
                  </p>
                </div>
              </motion.div>
            </BlurFade>

            {/* Card 2: Laserowa precyzja AI - SpeedSkeleton style */}
            <BlurFade delay={0.3} inView>
              <motion.div
                whileHover="animate"
                className="group isolate flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05),0_2px_3px_rgba(0,0,0,0.04)]"
              >
                <div className="relative h-56 overflow-hidden [mask-image:linear-gradient(to_bottom,white_60%,transparent_100%)]">
                  <div className="relative h-full overflow-hidden" style={{ perspective: '1000px' }}>
                    <motion.div
                      initial={{ opacity: 0, rotateY: 40, rotateX: 30, rotateZ: -30 }}
                      whileInView={{ opacity: 1, rotateY: 20, rotateX: 20, rotateZ: -20 }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      viewport={{ once: true }}
                      className="group/bento-skeleton mx-auto my-auto flex h-full w-full max-w-[85%] flex-col rounded-2xl border border-slate-300 bg-slate-100 p-3 shadow-2xl translate-x-6"
                      style={{
                        maskImage: 'linear-gradient(to bottom, white 50%, transparent 100%)',
                        WebkitMaskImage: 'linear-gradient(to bottom, white 50%, transparent 100%)',
                      }}
                    >
                      {/* Header */}
                      <div className="flex items-center gap-3">
                        <IconSparkles className="size-4 text-[#D4A574]" />
                        <p className="text-sm font-medium text-slate-800">Audyt AI</p>
                      </div>

                      {/* Content card */}
                      <div className="relative mt-3 flex-1 overflow-visible rounded-2xl border border-slate-200 bg-slate-200">
                        <div
                          className="absolute inset-0 opacity-10"
                          style={{
                            backgroundImage: 'repeating-linear-gradient(315deg, #64748b 0, #64748b 1px, transparent 0, transparent 50%)',
                            backgroundSize: '10px 10px',
                          }}
                        />

                        <div
                          className="absolute inset-0 h-full w-full rounded-2xl bg-white shadow-lg"
                          style={{ transform: 'translateX(12px) translateY(-12px)' }}
                        >
                          {[
                            { name: 'SEO profilu', points: '12 pkt', done: true },
                            { name: 'Cennik i usługi', points: '18 pkt', done: true },
                            { name: 'Zdjęcia i galeria', points: '10 pkt', done: true },
                            { name: 'Opis i opinie', points: '14 pkt', done: true },
                            { name: 'Psychologia cen', points: '6 pkt', loading: true },
                          ].map((step, idx) => (
                            <motion.div
                              key={step.name}
                              initial={{ opacity: 0, x: -20 }}
                              whileInView={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.4, delay: 0.2 + idx * 0.1, ease: "easeOut" }}
                              viewport={{ once: true }}
                            >
                              <div className="flex items-center justify-between px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <div className={cn(
                                    "flex size-4 items-center justify-center rounded-full",
                                    step.loading ? "bg-[#D4A574]" : "bg-green-500"
                                  )}>
                                    {step.loading ? (
                                      <svg className="size-3 animate-spin text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 3a9 9 0 1 0 9 9" />
                                      </svg>
                                    ) : (
                                      <IconCheck className="size-3 text-white" />
                                    )}
                                  </div>
                                  <p className="text-[11px] font-medium text-slate-500">{step.name}</p>
                                </div>
                                <div className="flex items-center gap-1 text-slate-400">
                                  <p className="text-[9px] font-bold">{step.points}</p>
                                </div>
                              </div>
                              {idx < 4 && (
                                <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-sans text-base font-semibold tracking-tight text-slate-800">
                    Laserowa precyzja AI
                  </h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                    System sprawdza 60+ elementów Twojego profilu - od SEO po psychologię cen.
                  </p>
                </div>
              </motion.div>
            </BlurFade>

            {/* Card 3: Konkretne rekomendacje - SourcesSkeleton style */}
            <BlurFade delay={0.4} inView>
              <motion.div
                whileHover="animate"
                className="group isolate flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05),0_2px_3px_rgba(0,0,0,0.04)]"
              >
                <div className="relative h-56 overflow-hidden [mask-image:linear-gradient(to_bottom,white_60%,transparent_100%)]">
                  <div
                    className="relative h-60 flex flex-col md:h-72 overflow-hidden"
                    style={{
                      perspective: '800px',
                      maskImage: 'radial-gradient(circle, white 50%, transparent 100%)',
                      WebkitMaskImage: 'radial-gradient(circle, white 50%, transparent 100%)',
                    }}
                  >
                    <div
                      className="flex-1 rounded-t-3xl gap-2 flex items-center justify-center w-full h-full absolute inset-x-0 p-2"
                      style={{ transform: 'rotateY(20deg) rotateX(20deg) rotateZ(-20deg)' }}
                    >
                      {/* Center circle with check icon */}
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                        viewport={{ once: true }}
                        className="size-28 bg-white shrink-0 border z-[10] rounded-full m-auto flex items-center justify-center border-slate-200 shadow-sm absolute inset-0"
                      >
                        <IconCheck className="size-8 text-green-500" />

                        {/* Orbiting recommendation 1 */}
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          whileInView={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
                          viewport={{ once: true }}
                          className="size-9 flex absolute inset-0 m-auto items-center justify-center border border-transparent shadow-black/10 ring-1 ring-black/10 rounded-sm bg-white animate-orbit [--translate-position:90px] [--orbit-duration:12s] [--initial-position:0deg]"
                        >
                          <IconCategory className="size-5 text-[#D4A574]" />
                        </motion.div>

                        {/* Orbiting recommendation 2 */}
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          whileInView={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.4, delay: 0.5, ease: "easeOut" }}
                          viewport={{ once: true }}
                          className="size-9 flex absolute inset-0 m-auto items-center justify-center border border-transparent shadow-black/10 ring-1 ring-black/10 rounded-sm bg-white animate-orbit [--translate-position:110px] [--orbit-duration:18s] [--initial-position:90deg]"
                        >
                          <IconPhoto className="size-5 text-[#D4A574]" />
                        </motion.div>

                        {/* Orbiting recommendation 3 */}
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          whileInView={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.4, delay: 0.6, ease: "easeOut" }}
                          viewport={{ once: true }}
                          className="size-9 flex absolute inset-0 m-auto items-center justify-center border border-transparent shadow-black/10 ring-1 ring-black/10 rounded-sm bg-white animate-orbit [--translate-position:130px] [--orbit-duration:15s] [--initial-position:180deg]"
                        >
                          <IconWand className="size-5 text-[#D4A574]" />
                        </motion.div>

                        {/* Orbiting recommendation 4 */}
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          whileInView={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.4, delay: 0.7, ease: "easeOut" }}
                          viewport={{ once: true }}
                          className="size-9 flex absolute inset-0 m-auto items-center justify-center border border-transparent shadow-black/10 ring-1 ring-black/10 rounded-sm bg-white animate-orbit [--translate-position:150px] [--orbit-duration:22s] [--initial-position:270deg]"
                        >
                          <IconTrendingUp className="size-5 text-[#D4A574]" />
                        </motion.div>
                      </motion.div>

                      {/* Concentric circles */}
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0, ease: "easeOut" }}
                        viewport={{ once: true }}
                        className="inset-0 shrink-0 border rounded-full m-auto shadow border-slate-100 size-44 bg-slate-100/80 z-[9] relative"
                      />
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                        viewport={{ once: true }}
                        className="absolute inset-0 shrink-0 border rounded-full m-auto shadow border-slate-100 size-60 bg-slate-100/60 z-[8]"
                      />
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
                        viewport={{ once: true }}
                        className="absolute inset-0 shrink-0 border rounded-full m-auto shadow border-slate-100 size-80 bg-slate-100/40 z-[7]"
                      />
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                        viewport={{ once: true }}
                        className="absolute inset-0 shrink-0 border rounded-full m-auto shadow border-slate-100 size-96 bg-slate-100/20 z-[6]"
                      />
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-sans text-base font-semibold tracking-tight text-slate-800">
                    Konkretne rekomendacje
                  </h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                    Nie ogólniki, a lista zadań do wdrożenia. Wiesz dokładnie, co zmienić.
                  </p>
                </div>
              </motion.div>
            </BlurFade>
          </div>
        </div>
      </section>

      {/* ===================== AUDYT BOOKSY PREMIUM ===================== */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <BlurFade delay={0.1} inView>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#D4A574]/10 rounded-full text-sm font-semibold text-[#D4A574] mb-4 border border-[#D4A574]/20">
                <IconSparkles size={14} />
                Usługa Premium
              </div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4">
                Kompleksowy Audyt Profilu Booksy
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Pełna analiza Twojego profilu w 4 kluczowych obszarach. Otrzymujesz raport PDF
                z konkretnymi rekomendacjami i gotowym, zoptymalizowanym cennikiem.
              </p>
            </div>
          </BlurFade>

          {/* Bento Grid - Audit Areas - Wzorcowy styl */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">

            {/* Card 1: SEO */}
            <BlurFade delay={0.2} inView>
              <div className="group isolate flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05),0_2px_3px_rgba(0,0,0,0.04)]">
                <div className="relative h-56 overflow-hidden [mask-image:linear-gradient(to_bottom,white_60%,transparent_100%)]">
                  <div className="relative h-full overflow-hidden p-4" style={{ perspective: '800px' }}>
                    <div className="h-full w-full" style={{ transform: 'rotateX(15deg) rotateY(-10deg)', transformStyle: 'preserve-3d' }}>
                      {/* Stacked cards showing SEO optimization */}
                      <motion.div
                        initial={{ opacity: 0, y: 50, x: -20 }}
                        whileInView={{ opacity: 1, y: 0, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
                        viewport={{ once: true }}
                        className="absolute bottom-0 left-8 z-30 w-[85%] rounded-2xl border border-emerald-300 bg-white p-3 shadow-2xl"
                      >
                        <div className="flex items-center gap-3">
                          <IconCheck size={16} className="text-emerald-600" />
                          <p className="text-sm font-medium text-slate-800">Zoptymalizowane nazwy</p>
                          <div className="ml-auto flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-300/10 px-1.5 py-0.5">
                            <IconCheck size={10} className="text-emerald-600" />
                            <p className="text-[10px] font-bold text-emerald-600">SEO</p>
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-slate-400">"Endermologia - Redukcja Cellulitu i Modelowanie Sylwetki"</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <span className="rounded-sm bg-emerald-100 px-1.5 py-0.5 text-[10px] text-emerald-700">ujędrnianie</span>
                          <span className="rounded-sm bg-emerald-100 px-1.5 py-0.5 text-[10px] text-emerald-700">redukcja zmarszczek</span>
                        </div>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 30, x: -10 }}
                        whileInView={{ opacity: 0.7, y: 0, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                        viewport={{ once: true }}
                        className="absolute bottom-6 left-4 z-20 w-[80%] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl"
                      >
                        <div className="flex items-center gap-3">
                          <IconSearch size={16} className="text-slate-400" />
                          <p className="text-sm font-medium text-slate-600">Analiza słów kluczowych</p>
                        </div>
                        <p className="mt-2 text-xs text-slate-400">Popularne hasła w Twojej kategorii...</p>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 0.5, y: 0 }}
                        transition={{ duration: 0.5, delay: 0, ease: "easeOut" }}
                        viewport={{ once: true }}
                        className="absolute bottom-12 left-0 z-10 w-[75%] rounded-2xl border border-red-200 bg-white p-3 shadow-lg"
                      >
                        <div className="flex items-center gap-3">
                          <IconAlertCircle size={16} className="text-red-400" />
                          <p className="text-sm font-medium text-slate-500">Przed: "Endermologia Alliance"</p>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <IconSearch size={16} className="text-slate-400" />
                    <span className="text-xs text-slate-400 uppercase tracking-wide">SEO</span>
                    <span className="ml-auto px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">Wysoki Impact</span>
                  </div>
                  <h3 className="font-sans text-base font-semibold tracking-tight text-slate-800">Optymalizacja nazw i opisów</h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                    Dodajemy słowa kluczowe, których szukają klientki. "Endermologia" → "Endermologia - Redukcja Cellulitu".
                  </p>
                </div>
              </div>
            </BlurFade>

            {/* Card 2: KONWERSJA */}
            <BlurFade delay={0.3} inView>
              <div className="group isolate flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05),0_2px_3px_rgba(0,0,0,0.04)]">
                <div className="relative h-56 overflow-hidden [mask-image:linear-gradient(to_bottom,white_60%,transparent_100%)]">
                  <div className="relative h-full overflow-hidden p-4" style={{ perspective: '800px' }}>
                    <div className="h-full w-full" style={{ transform: 'rotateX(15deg) rotateY(10deg)', transformStyle: 'preserve-3d' }}>
                      {/* Promotions card mockup */}
                      <motion.div
                        initial={{ opacity: 0, y: 50, x: 20 }}
                        whileInView={{ opacity: 1, y: 0, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
                        viewport={{ once: true }}
                        className="absolute bottom-0 left-6 z-30 w-[88%] rounded-2xl border border-[#D4A574]/50 bg-white p-3 shadow-2xl"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <IconSparkles size={16} className="text-[#D4A574]" />
                          <p className="text-sm font-medium text-slate-800">Sekcja Promocje</p>
                          <div className="ml-auto flex items-center gap-1 rounded-full border border-[#D4A574] bg-[#D4A574]/10 px-1.5 py-0.5">
                            <IconTrendingUp size={10} className="text-[#D4A574]" />
                            <p className="text-[10px] font-bold text-[#D4A574]">+40%</p>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-[#D4A574]/10 to-transparent p-2">
                            <span className="text-xs text-slate-700">Depilacja pełne nogi</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-400 line-through">180 zł</span>
                              <span className="text-xs font-bold text-[#D4A574]">140 zł</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2">
                            <span className="text-xs text-slate-700">Pakiet 5 zabiegów</span>
                            <span className="text-[10px] font-medium text-emerald-600">-22%</span>
                          </div>
                        </div>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 0.6, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
                        viewport={{ once: true }}
                        className="absolute bottom-8 left-2 z-20 w-[80%] rounded-2xl border border-red-200 bg-white p-3 shadow-lg"
                      >
                        <div className="flex items-center gap-2">
                          <IconAlertCircle size={14} className="text-red-400" />
                          <p className="text-xs text-slate-500">Przed: Promocje ukryte w opisach</p>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <IconSparkles size={16} className="text-slate-400" />
                    <span className="text-xs text-slate-400 uppercase tracking-wide">KONWERSJA</span>
                    <span className="ml-auto px-2 py-0.5 bg-[#D4A574]/20 text-[#D4A574] text-[10px] font-bold rounded-full">Wysoki Impact</span>
                  </div>
                  <h3 className="font-sans text-base font-semibold tracking-tight text-slate-800">Wizualne wzmocnienie promocji</h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                    Agregujemy oferty specjalne w jednym miejscu z cenami "przed" i "po" oraz oszczędnością.
                  </p>
                </div>
              </div>
            </BlurFade>

            {/* Card 3: RETENCJA */}
            <BlurFade delay={0.4} inView>
              <div className="group isolate flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05),0_2px_3px_rgba(0,0,0,0.04)]">
                <div className="relative h-56 overflow-hidden [mask-image:linear-gradient(to_bottom,white_60%,transparent_100%)]">
                  <div className="relative h-full overflow-hidden p-4" style={{ perspective: '800px' }}>
                    <div className="h-full w-full" style={{ transform: 'rotateX(15deg) rotateY(-5deg)', transformStyle: 'preserve-3d' }}>
                      {/* Loyalty program visualization */}
                      <motion.div
                        initial={{ opacity: 0, y: 50, x: -15 }}
                        whileInView={{ opacity: 1, y: 0, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
                        viewport={{ once: true }}
                        className="absolute bottom-0 left-6 z-30 w-[88%] rounded-2xl border border-amber-300 bg-white p-3 shadow-2xl"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <IconRepeat size={16} className="text-amber-600" />
                          <p className="text-sm font-medium text-slate-800">Program Stała Klientka</p>
                          <div className="ml-auto rounded-full border border-amber-300 bg-amber-300/10 px-1.5 py-0.5">
                            <p className="text-[10px] font-bold text-amber-600">10+1</p>
                          </div>
                        </div>
                        <div className="flex gap-1 mb-2">
                          {[...Array(10)].map((_, i) => (
                            <motion.div
                              key={i}
                              initial={{ scale: 0 }}
                              whileInView={{ scale: 1 }}
                              transition={{ duration: 0.2, delay: 0.5 + i * 0.05, ease: "easeOut" }}
                              viewport={{ once: true }}
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold ${i < 7 ? 'bg-amber-400 text-white' : 'bg-amber-100 text-amber-400'}`}
                            >
                              {i < 7 ? '✓' : i + 1}
                            </motion.div>
                          ))}
                          <motion.div
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            transition={{ duration: 0.3, delay: 1, ease: "easeOut" }}
                            viewport={{ once: true }}
                            className="w-5 h-5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 flex items-center justify-center"
                          >
                            <IconGift size={10} className="text-white" />
                          </motion.div>
                        </div>
                        <p className="text-[10px] text-slate-400">7/10 wizyt → 11. zabieg gratis!</p>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 0.6, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
                        viewport={{ once: true }}
                        className="absolute bottom-10 left-2 z-20 w-[75%] rounded-xl border border-slate-200 bg-slate-50 p-2 shadow-lg"
                      >
                        <p className="text-[10px] text-slate-500">Newsletter: nowe pakiety i promocje</p>
                      </motion.div>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <IconRepeat size={16} className="text-slate-400" />
                    <span className="text-xs text-slate-400 uppercase tracking-wide">RETENCJA</span>
                    <span className="ml-auto px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">Średni Impact</span>
                  </div>
                  <h3 className="font-sans text-base font-semibold tracking-tight text-slate-800">Programy lojalnościowe i pakiety</h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                    Wprowadzamy pakiety zabiegów (10+1 gratis) widoczne dla "Stałych Bywalców" z automatycznymi powiadomieniami.
                  </p>
                </div>
              </div>
            </BlurFade>

            {/* Card 4: WIZERUNEK */}
            <BlurFade delay={0.5} inView>
              <div className="group isolate flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05),0_2px_3px_rgba(0,0,0,0.04)]">
                <div className="relative h-56 overflow-hidden [mask-image:linear-gradient(to_bottom,white_60%,transparent_100%)]">
                  <div className="relative h-full overflow-hidden p-4" style={{ perspective: '800px' }}>
                    <div className="h-full w-full" style={{ transform: 'rotateX(15deg) rotateY(5deg)', transformStyle: 'preserve-3d' }}>
                      {/* Category structure visualization */}
                      <motion.div
                        initial={{ opacity: 0, y: 50, x: 15 }}
                        whileInView={{ opacity: 1, y: 0, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                        viewport={{ once: true }}
                        className="absolute bottom-0 left-4 z-30 w-[90%] rounded-2xl border border-violet-300 bg-white p-3 shadow-2xl"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <IconCategory size={16} className="text-violet-600" />
                          <p className="text-sm font-medium text-slate-800">Struktura kategorii</p>
                          <div className="ml-auto rounded-full border border-violet-300 bg-violet-300/10 px-1.5 py-0.5">
                            <p className="text-[10px] font-bold text-violet-600">PRO</p>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
                            viewport={{ once: true }}
                            className="flex items-center gap-2 rounded-lg bg-violet-50 p-2"
                          >
                            <div className="w-1 h-4 bg-violet-400 rounded-full" />
                            <span className="text-xs font-medium text-slate-700">Depilacja Laserowa</span>
                            <span className="ml-auto text-[10px] text-slate-400">12 usług</span>
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.5, ease: "easeOut" }}
                            viewport={{ once: true }}
                            className="flex items-center gap-2 rounded-lg bg-violet-50/50 p-2"
                          >
                            <div className="w-1 h-4 bg-violet-300 rounded-full" />
                            <span className="text-xs font-medium text-slate-700">Zabiegi na Twarz</span>
                            <span className="ml-auto text-[10px] text-slate-400">8 usług</span>
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.6, ease: "easeOut" }}
                            viewport={{ once: true }}
                            className="flex items-center gap-2 rounded-lg bg-violet-50/30 p-2"
                          >
                            <div className="w-1 h-4 bg-violet-200 rounded-full" />
                            <span className="text-xs font-medium text-slate-700">Terapie IV</span>
                            <span className="ml-auto text-[10px] text-slate-400">5 usług</span>
                          </motion.div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <IconPhoto size={16} className="text-slate-400" />
                    <span className="text-xs text-slate-400 uppercase tracking-wide">WIZERUNEK</span>
                    <span className="ml-auto px-2 py-0.5 bg-violet-100 text-violet-700 text-[10px] font-bold rounded-full">Wysoki Impact</span>
                  </div>
                  <h3 className="font-sans text-base font-semibold tracking-tight text-slate-800">Kategoryzacja i profesjonalna komunikacja</h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                    Przejrzyste kategorie, spójne nazewnictwo i język korzyści. Dla usług medycznych - FAQ i wideo.
                  </p>
                </div>
              </div>
            </BlurFade>
          </div>

          {/* Second row - Charts/Analytics cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">

            {/* Card 5: Werdykt Audytora - Score */}
            <BlurFade delay={0.6} inView>
              <div className="group isolate flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05),0_2px_3px_rgba(0,0,0,0.04)]">
                <div className="relative h-56 overflow-hidden [mask-image:linear-gradient(to_bottom,white_70%,transparent_100%)]">
                  <div className="relative h-full overflow-hidden p-4" style={{ perspective: '800px' }}>
                    <div className="h-full w-full flex items-center justify-center" style={{ transform: 'rotateX(10deg)', transformStyle: 'preserve-3d' }}>
                      {/* Score card mockup */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        whileInView={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                        viewport={{ once: true }}
                        className="w-[90%] rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
                      >
                        <div className="flex items-center gap-4">
                          {/* Circular score */}
                          <motion.div
                            initial={{ rotate: -90, scale: 0 }}
                            whileInView={{ rotate: 0, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                            viewport={{ once: true }}
                            className="relative w-20 h-20"
                          >
                            <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 72 72">
                              <circle cx="36" cy="36" r="30" fill="none" stroke="#f1f5f9" strokeWidth="6" />
                              <motion.circle
                                cx="36" cy="36" r="30" fill="none"
                                stroke="url(#scoreGradient)"
                                strokeWidth="6"
                                strokeLinecap="round"
                                initial={{ strokeDasharray: "0 188" }}
                                whileInView={{ strokeDasharray: `${38 * 1.88} ${100 * 1.88}` }}
                                transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                                viewport={{ once: true }}
                              />
                              <defs>
                                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#ef4444" />
                                  <stop offset="50%" stopColor="#f59e0b" />
                                  <stop offset="100%" stopColor="#D4A574" />
                                </linearGradient>
                              </defs>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-2xl font-bold text-rose-500">38</span>
                              <span className="text-[8px] text-slate-400 uppercase">Score</span>
                            </div>
                          </motion.div>
                          {/* Description */}
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-slate-800 mb-1">Werdykt Audytora</h4>
                            <p className="text-[10px] text-slate-500 leading-relaxed">
                              "Cennik charakteryzuje się dużym chaosem i nadmierną redundancją, co utrudnia nawigację..."
                            </p>
                          </div>
                        </div>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.6, ease: "easeOut" }}
                          viewport={{ once: true }}
                          className="mt-3 flex gap-2"
                        >
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] text-red-600">Pilne</span>
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-600">Wymaga pracy</span>
                        </motion.div>
                      </motion.div>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <IconTrendingUp size={16} className="text-slate-400" />
                    <span className="text-xs text-slate-400 uppercase tracking-wide">ANALIZA</span>
                    <span className="ml-auto px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-full">Score 0-100</span>
                  </div>
                  <h3 className="font-sans text-base font-semibold tracking-tight text-slate-800">Werdykt Audytora AI</h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                    Kompleksowa ocena profilu z opisem głównych problemów i priorytetów do naprawy.
                  </p>
                </div>
              </div>
            </BlurFade>

            {/* Card 6: Potencjał Sprzedażowy - Progress bar */}
            <BlurFade delay={0.7} inView>
              <div className="group isolate flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05),0_2px_3px_rgba(0,0,0,0.04)]">
                <div className="relative h-56 overflow-hidden [mask-image:linear-gradient(to_bottom,white_70%,transparent_100%)]">
                  <div className="relative h-full overflow-hidden p-4" style={{ perspective: '800px' }}>
                    <div className="h-full w-full flex items-center justify-center" style={{ transform: 'rotateX(10deg) rotateY(5deg)', transformStyle: 'preserve-3d' }}>
                      {/* Potential card mockup */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        whileInView={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                        viewport={{ once: true }}
                        className="w-[90%] rounded-2xl border border-[#D4A574]/30 bg-gradient-to-br from-[#D4A574]/5 to-white p-5 shadow-2xl"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <IconTrendingUp size={16} className="text-[#D4A574]" />
                          <h4 className="text-sm font-semibold text-slate-800">Potencjał Sprzedażowy</h4>
                        </div>
                        <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">
                          Niski do Średniego. Po wdrożeniu zmian potencjał może wzrosnąć do Wysokiego.
                        </p>
                        {/* Progress bar */}
                        <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
                          <motion.div
                            initial={{ width: '0%' }}
                            whileInView={{ width: '100%' }}
                            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                            viewport={{ once: true }}
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-400 via-amber-400 to-emerald-400 rounded-full"
                          />
                          {/* Marker */}
                          <motion.div
                            initial={{ left: '0%', opacity: 0 }}
                            whileInView={{ left: '35%', opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                            viewport={{ once: true }}
                            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-[#D4A574] rounded-full shadow-md"
                            style={{ transform: 'translate(-50%, -50%)' }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>NISKI</span>
                          <span>ŚREDNI</span>
                          <span>WYSOKI</span>
                        </div>
                        {/* Projection */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.8, ease: "easeOut" }}
                          viewport={{ once: true }}
                          className="mt-3 p-2 bg-emerald-50 rounded-lg border border-emerald-200"
                        >
                          <div className="flex items-center gap-2">
                            <IconArrowRight size={12} className="text-emerald-600" />
                            <span className="text-[10px] text-emerald-700 font-medium">Po optymalizacji: +50% potencjał</span>
                          </div>
                        </motion.div>
                      </motion.div>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <IconSparkles size={16} className="text-slate-400" />
                    <span className="text-xs text-slate-400 uppercase tracking-wide">PROGNOZA</span>
                    <span className="ml-auto px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">ROI</span>
                  </div>
                  <h3 className="font-sans text-base font-semibold tracking-tight text-slate-800">Potencjał Sprzedażowy</h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                    Ocena obecnego stanu i prognoza wzrostu po wdrożeniu rekomendacji z audytu.
                  </p>
                </div>
              </div>
            </BlurFade>
          </div>

          {/* Third row - Deliverables cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">

            {/* Card 7: Gotowy cennik HTML */}
            <BlurFade delay={0.8} inView>
              <div className="group isolate flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05),0_2px_3px_rgba(0,0,0,0.04)]">
                <div className="relative h-48 overflow-hidden [mask-image:linear-gradient(to_bottom,white_70%,transparent_100%)]">
                  <div className="relative h-full overflow-hidden p-3" style={{ perspective: '800px' }}>
                    <motion.div
                      initial={{ opacity: 0, rotateX: 40, rotateY: -30 }}
                      whileInView={{ opacity: 1, rotateX: 15, rotateY: -10 }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      viewport={{ once: true }}
                      className="h-full w-full"
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      {/* Code editor mockup */}
                      <motion.div
                        initial={{ scale: 0.8 }}
                        whileInView={{ scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                        viewport={{ once: true }}
                        className="w-full rounded-xl border border-slate-200 bg-[#1e1e1e] p-3 shadow-2xl"
                      >
                        <div className="flex items-center gap-1.5 mb-2">
                          <motion.div
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.4 }}
                            viewport={{ once: true }}
                            className="w-2.5 h-2.5 rounded-full bg-red-400"
                          />
                          <motion.div
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.5 }}
                            viewport={{ once: true }}
                            className="w-2.5 h-2.5 rounded-full bg-yellow-400"
                          />
                          <motion.div
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.6 }}
                            viewport={{ once: true }}
                            className="w-2.5 h-2.5 rounded-full bg-green-400"
                          />
                          <motion.span
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: 0.7 }}
                            viewport={{ once: true }}
                            className="ml-2 text-[9px] text-slate-500"
                          >cennik.html</motion.span>
                        </div>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
                          viewport={{ once: true }}
                          className="font-mono text-[8px] leading-relaxed"
                        >
                          <span className="text-purple-400">&lt;div</span>
                          <span className="text-sky-300"> class</span>
                          <span className="text-white">=</span>
                          <span className="text-amber-300">"cennik"</span>
                          <span className="text-purple-400">&gt;</span>
                          <br />
                          <span className="text-slate-500 ml-2">{'  '}</span>
                          <span className="text-purple-400">&lt;section&gt;</span>
                          <br />
                          <span className="text-slate-500 ml-4">{'    '}</span>
                          <span className="text-emerald-400">Depilacja Laserowa</span>
                          <br />
                          <span className="text-slate-500 ml-2">{'  '}</span>
                          <span className="text-purple-400">&lt;/section&gt;</span>
                          <br />
                          <span className="text-purple-400">&lt;/div&gt;</span>
                        </motion.div>
                      </motion.div>
                    </motion.div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <IconCode size={14} className="text-slate-400" />
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide">HTML</span>
                    <span className="ml-auto px-2 py-0.5 bg-purple-100 text-purple-700 text-[9px] font-bold rounded-full">Copy & Paste</span>
                  </div>
                  <h3 className="font-sans text-sm font-semibold tracking-tight text-slate-800">Gotowy kod HTML</h3>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    Wklej na swoją stronę - działa od razu.
                  </p>
                </div>
              </div>
            </BlurFade>

            {/* Card 8: Responsywność */}
            <BlurFade delay={0.9} inView>
              <div className="group isolate flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05),0_2px_3px_rgba(0,0,0,0.04)]">
                <div className="relative h-56 overflow-hidden [mask-image:linear-gradient(to_bottom,white_60%,transparent_100%)]">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-[#D4A574]/5" />
                  <div className="relative h-full overflow-hidden p-4" style={{ perspective: '1000px' }}>
                    <motion.div
                      initial={{ opacity: 0, rotateX: 45, rotateY: -15 }}
                      whileInView={{ opacity: 1, rotateX: 25, rotateY: -5 }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      viewport={{ once: true }}
                      className="h-full w-full flex items-end justify-center gap-3"
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      {/* Desktop mockup - largest, back */}
                      <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                        viewport={{ once: true }}
                        className="relative w-40 h-28 rounded-lg border-2 border-slate-200 bg-white shadow-xl"
                        style={{ transform: 'translateZ(-20px)' }}
                      >
                        {/* Monitor stand */}
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-10 h-4 bg-slate-200 rounded-b-sm" />
                        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-slate-300 rounded-full" />
                        {/* Screen content */}
                        <div className="w-full h-full p-2 bg-gradient-to-b from-white to-slate-50 rounded-md overflow-hidden">
                          <div className="h-2.5 bg-[#D4A574]/20 rounded-sm mb-1.5 flex items-center px-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#D4A574]/40" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <div className="h-1.5 bg-slate-200 rounded-full w-16" />
                              <div className="h-1.5 bg-[#D4A574]/30 rounded-full w-6" />
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="h-1.5 bg-slate-100 rounded-full w-12" />
                              <div className="h-1.5 bg-[#D4A574]/20 rounded-full w-4" />
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="h-1.5 bg-slate-100 rounded-full w-20" />
                              <div className="h-1.5 bg-[#D4A574]/25 rounded-full w-7" />
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="h-1.5 bg-slate-200 rounded-full w-10" />
                              <div className="h-1.5 bg-[#D4A574]/30 rounded-full w-5" />
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      {/* Tablet mockup - medium, middle */}
                      <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: -8 }}
                        transition={{ duration: 0.5, delay: 0.35, ease: "easeOut" }}
                        viewport={{ once: true }}
                        className="relative w-20 h-28 rounded-lg border-2 border-slate-200 bg-white shadow-xl"
                        style={{ transform: 'translateZ(0px)' }}
                      >
                        {/* Tablet camera */}
                        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-slate-300" />
                        {/* Screen content */}
                        <div className="w-full h-24 mt-3 px-1.5 pb-1.5 overflow-hidden">
                          <div className="w-full h-full bg-gradient-to-b from-white to-slate-50 rounded-sm p-1.5">
                            <div className="h-2 bg-[#D4A574]/20 rounded-sm mb-1.5" />
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <div className="h-1 bg-slate-200 rounded-full w-10" />
                                <div className="h-1 bg-[#D4A574]/30 rounded-full w-4" />
                              </div>
                              <div className="flex justify-between">
                                <div className="h-1 bg-slate-100 rounded-full w-8" />
                                <div className="h-1 bg-[#D4A574]/20 rounded-full w-3" />
                              </div>
                              <div className="flex justify-between">
                                <div className="h-1 bg-slate-100 rounded-full w-12" />
                                <div className="h-1 bg-[#D4A574]/25 rounded-full w-4" />
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Home button */}
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-slate-200 rounded-full" />
                      </motion.div>

                      {/* Phone mockup - smallest, front */}
                      <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: -16 }}
                        transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
                        viewport={{ once: true }}
                        className="relative w-14 h-28 rounded-2xl border-2 border-slate-200 bg-white shadow-xl"
                        style={{ transform: 'translateZ(20px)' }}
                      >
                        {/* Notch */}
                        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-6 h-1.5 bg-slate-800 rounded-full" />
                        {/* Screen content */}
                        <div className="w-full h-full pt-4 px-1 pb-1.5 overflow-hidden">
                          <div className="w-full h-full bg-gradient-to-b from-white to-slate-50 rounded-xl p-1.5">
                            <div className="h-2 bg-[#D4A574]/30 rounded-sm mb-1.5" />
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center">
                                <div className="h-1.5 bg-slate-200 rounded-full w-5" />
                                <div className="h-1.5 bg-[#D4A574]/40 rounded-full w-3" />
                              </div>
                              <div className="flex justify-between items-center">
                                <div className="h-1.5 bg-slate-100 rounded-full w-6" />
                                <div className="h-1.5 bg-[#D4A574]/30 rounded-full w-2" />
                              </div>
                              <div className="flex justify-between items-center">
                                <div className="h-1.5 bg-slate-100 rounded-full w-4" />
                                <div className="h-1.5 bg-[#D4A574]/35 rounded-full w-3" />
                              </div>
                              <div className="flex justify-between items-center">
                                <div className="h-1.5 bg-slate-200 rounded-full w-5" />
                                <div className="h-1.5 bg-[#D4A574]/40 rounded-full w-2" />
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Home indicator */}
                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-1 bg-slate-300 rounded-full" />
                      </motion.div>
                    </motion.div>

                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <IconDeviceMobile size={14} className="text-slate-400" />
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide">RESPONSIVE</span>
                    <span className="ml-auto px-2 py-0.5 bg-green-100 text-green-700 text-[9px] font-bold rounded-full">100% Mobile-first</span>
                  </div>
                  <h3 className="font-sans text-sm font-semibold tracking-tight text-slate-800">W pełni responsywny</h3>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    Twój cennik wygląda perfekcyjnie na każdym urządzeniu.
                  </p>
                </div>
              </div>
            </BlurFade>

            {/* Card 9: Nowoczesny design */}
            <BlurFade delay={1.0} inView>
              <div className="group isolate flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_1px_rgba(0,0,0,0.05),0_4px_6px_rgba(34,42,53,0.04),0_24px_68px_rgba(47,48,55,0.05),0_2px_3px_rgba(0,0,0,0.04)]">
                <div className="relative h-48 overflow-hidden [mask-image:linear-gradient(to_bottom,white_70%,transparent_100%)]">
                  <div className="relative h-full overflow-hidden p-3" style={{ perspective: '800px' }}>
                    <motion.div
                      initial={{ opacity: 0, rotateX: 35, rotateY: 25 }}
                      whileInView={{ opacity: 1, rotateX: 12, rotateY: 8 }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      viewport={{ once: true }}
                      className="h-full w-full"
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      {/* Modern design mockup */}
                      <motion.div
                        initial={{ scale: 0.85 }}
                        whileInView={{ scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                        viewport={{ once: true }}
                        className="w-full rounded-xl border border-[#D4A574]/30 bg-gradient-to-br from-white to-[#D4A574]/5 p-3 shadow-2xl"
                      >
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: 0.3 }}
                          viewport={{ once: true }}
                          className="flex items-center gap-2 mb-2"
                        >
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#D4A574] to-[#C9956C] flex items-center justify-center">
                            <IconSparkles size={10} className="text-white" />
                          </div>
                          <span className="text-[10px] font-semibold text-slate-700">Twój Salon</span>
                        </motion.div>
                        <div className="space-y-1.5">
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.4 }}
                            viewport={{ once: true }}
                            className="flex items-center justify-between p-1.5 rounded-lg bg-white/80 border border-slate-100"
                          >
                            <div>
                              <p className="text-[8px] font-medium text-slate-700">Strzyżenie premium</p>
                              <p className="text-[6px] text-slate-400">z pielęgnacją</p>
                            </div>
                            <span className="text-[9px] font-bold text-[#D4A574]">120 zł</span>
                          </motion.div>
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.5 }}
                            viewport={{ once: true }}
                            className="flex items-center justify-between p-1.5 rounded-lg bg-white/80 border border-slate-100"
                          >
                            <div>
                              <p className="text-[8px] font-medium text-slate-700">Koloryzacja</p>
                              <p className="text-[6px] text-slate-400">farba premium</p>
                            </div>
                            <span className="text-[9px] font-bold text-[#D4A574]">od 180 zł</span>
                          </motion.div>
                        </div>
                        <motion.div
                          initial={{ opacity: 0 }}
                          whileInView={{ opacity: 1 }}
                          transition={{ duration: 0.4, delay: 0.6 }}
                          viewport={{ once: true }}
                          className="mt-2 flex gap-1"
                        >
                          <motion.span
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.65 }}
                            viewport={{ once: true }}
                            className="rounded-full bg-[#D4A574]/20 px-1.5 py-0.5 text-[6px] text-[#D4A574] font-medium"
                          >Animacje</motion.span>
                          <motion.span
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.75 }}
                            viewport={{ once: true }}
                            className="rounded-full bg-[#D4A574]/20 px-1.5 py-0.5 text-[6px] text-[#D4A574] font-medium"
                          >Hover</motion.span>
                          <motion.span
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.85 }}
                            viewport={{ once: true }}
                            className="rounded-full bg-[#D4A574]/20 px-1.5 py-0.5 text-[6px] text-[#D4A574] font-medium"
                          >2025</motion.span>
                        </motion.div>
                      </motion.div>
                    </motion.div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <IconPalette size={14} className="text-slate-400" />
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide">DESIGN</span>
                    <span className="ml-auto px-2 py-0.5 bg-[#D4A574]/20 text-[#D4A574] text-[9px] font-bold rounded-full">Premium</span>
                  </div>
                  <h3 className="font-sans text-sm font-semibold tracking-tight text-slate-800">Nowoczesny design</h3>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    Animacje, gradienty, efekty hover - jak najlepsze strony.
                  </p>
                </div>
              </div>
            </BlurFade>
          </div>
        </div>
      </section>

      {/* ===================== SOCIAL PROOF ===================== */}
      <section className="py-16 bg-white overflow-hidden">
        {/* Header */}
        <BlurFade delay={0.1} inView>
          <div className="text-center space-y-4 pb-6 px-4">
            <div className="flex justify-center">
              <div className="group rounded-full border border-black/5 bg-neutral-100 text-base transition-all ease-in hover:cursor-pointer hover:bg-neutral-200">
                <AnimatedShinyText className="inline-flex items-center justify-center px-4 py-1 text-sm transition ease-out hover:text-neutral-600 hover:duration-300">
                  <span>✨ Zobacz jak pomogliśmy innym</span>
                  <IconArrowRight className="ml-1 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
                </AnimatedShinyText>
              </div>
            </div>
            <h2 className="mx-auto max-w-xs text-3xl font-serif font-semibold sm:max-w-none sm:text-4xl md:text-5xl text-slate-900">
              Co mówią właścicielki salonów
            </h2>
          </div>
        </BlurFade>

        {/* Vertical Marquee Columns - full width with edge fade */}
        <div className="relative mt-6 max-h-[600px] overflow-hidden">
          {/* Left gradient fade */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 md:w-32 lg:w-48 bg-gradient-to-r from-white via-white/80 to-transparent z-10" />
          {/* Right gradient fade */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 md:w-32 lg:w-48 bg-gradient-to-l from-white via-white/80 to-transparent z-10" />

          <div className="flex gap-4 px-4">
            {/* Column 1 */}
            <div className="flex-1 min-w-[280px]">
              <Marquee pauseOnHover vertical className="[--duration:40s]">
                {testimonials.slice(0, 6).map((t, idx) => (
                  <div key={idx} className="mb-4 bg-white rounded-2xl p-5 border border-slate-100 shadow-lg">
                    <div className="flex gap-0.5 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <BsStarFill key={i} className="h-3.5 w-3.5 text-[#D4A574]" />
                      ))}
                    </div>
                    <p className="text-slate-700 mb-4 text-sm leading-relaxed">"{t.quote}"</p>
                    <div className="mb-3">
                      <span className="px-2.5 py-1 bg-gradient-to-r from-[#D4A574]/15 to-[#B8860B]/15 text-[#8B6914] text-xs font-semibold rounded-full">{t.result}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <img src={t.src} alt={t.name} className="w-9 h-9 rounded-full object-cover" />
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                        <p className="text-xs text-slate-500">{t.salon}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </Marquee>
            </div>

            {/* Column 2 */}
            <div className="flex-1 min-w-[280px] hidden md:block">
              <Marquee reverse pauseOnHover vertical className="[--duration:45s]">
                {testimonials.slice(6, 12).map((t, idx) => (
                  <div key={idx} className="mb-4 bg-white rounded-2xl p-5 border border-slate-100 shadow-lg">
                    <div className="flex gap-0.5 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <BsStarFill key={i} className="h-3.5 w-3.5 text-[#D4A574]" />
                      ))}
                    </div>
                    <p className="text-slate-700 mb-4 text-sm leading-relaxed">"{t.quote}"</p>
                    <div className="mb-3">
                      <span className="px-2.5 py-1 bg-gradient-to-r from-[#D4A574]/15 to-[#B8860B]/15 text-[#8B6914] text-xs font-semibold rounded-full">{t.result}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <img src={t.src} alt={t.name} className="w-9 h-9 rounded-full object-cover" />
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                        <p className="text-xs text-slate-500">{t.salon}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </Marquee>
            </div>

            {/* Column 3 */}
            <div className="flex-1 min-w-[280px] hidden lg:block">
              <Marquee pauseOnHover vertical className="[--duration:50s]">
                {testimonials.slice(12, 18).map((t, idx) => (
                  <div key={idx} className="mb-4 bg-white rounded-2xl p-5 border border-slate-100 shadow-lg">
                    <div className="flex gap-0.5 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <BsStarFill key={i} className="h-3.5 w-3.5 text-[#D4A574]" />
                      ))}
                    </div>
                    <p className="text-slate-700 mb-4 text-sm leading-relaxed">"{t.quote}"</p>
                    <div className="mb-3">
                      <span className="px-2.5 py-1 bg-gradient-to-r from-[#D4A574]/15 to-[#B8860B]/15 text-[#8B6914] text-xs font-semibold rounded-full">{t.result}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <img src={t.src} alt={t.name} className="w-9 h-9 rounded-full object-cover" />
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                        <p className="text-xs text-slate-500">{t.salon}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </Marquee>
            </div>

            {/* Column 4 */}
            <div className="flex-1 min-w-[280px] hidden xl:block">
              <Marquee reverse pauseOnHover vertical className="[--duration:42s]">
                {testimonials.slice(0, 6).reverse().map((t, idx) => (
                  <div key={idx} className="mb-4 bg-white rounded-2xl p-5 border border-slate-100 shadow-lg">
                    <div className="flex gap-0.5 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <BsStarFill key={i} className="h-3.5 w-3.5 text-[#D4A574]" />
                      ))}
                    </div>
                    <p className="text-slate-700 mb-4 text-sm leading-relaxed">"{t.quote}"</p>
                    <div className="mb-3">
                      <span className="px-2.5 py-1 bg-gradient-to-r from-[#D4A574]/15 to-[#B8860B]/15 text-[#8B6914] text-xs font-semibold rounded-full">{t.result}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <img src={t.src} alt={t.name} className="w-9 h-9 rounded-full object-cover" />
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                        <p className="text-xs text-slate-500">{t.salon}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </Marquee>
            </div>

            {/* Column 5 */}
            <div className="flex-1 min-w-[280px] hidden 2xl:block">
              <Marquee pauseOnHover vertical className="[--duration:48s]">
                {testimonials.slice(6, 12).reverse().map((t, idx) => (
                  <div key={idx} className="mb-4 bg-white rounded-2xl p-5 border border-slate-100 shadow-lg">
                    <div className="flex gap-0.5 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <BsStarFill key={i} className="h-3.5 w-3.5 text-[#D4A574]" />
                      ))}
                    </div>
                    <p className="text-slate-700 mb-4 text-sm leading-relaxed">"{t.quote}"</p>
                    <div className="mb-3">
                      <span className="px-2.5 py-1 bg-gradient-to-r from-[#D4A574]/15 to-[#B8860B]/15 text-[#8B6914] text-xs font-semibold rounded-full">{t.result}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <img src={t.src} alt={t.name} className="w-9 h-9 rounded-full object-cover" />
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                        <p className="text-xs text-slate-500">{t.salon}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </Marquee>
            </div>
          </div>

          {/* Top/Bottom gradient overlays */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 w-full bg-gradient-to-t from-white from-20%" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4 w-full bg-gradient-to-b from-white from-20%" />
        </div>
      </section>

      {/* ===================== CTA SECTION ===================== */}
      <section className="py-20 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          {/* CTA Box with 3D depth effect */}
          <BlurFade delay={0.1} inView>
            <div
              className="relative rounded-[34px]"
              style={{
                border: '10px solid #ffb348',
                boxShadow: '0px 0px 50px 50px rgba(245,244,219,0.5)',
              }}
            >
              {/* Right edge depth */}
              <div
                className="absolute top-8 bottom-8 rounded-r-2xl pointer-events-none"
                style={{
                  background: 'linear-gradient(to right, rgba(10,10,10,0.5), rgba(0,0,0,0.61))',
                  filter: 'blur(14px)',
                  zIndex: 50,
                  right: '0px',
                  width: '60px',
                }}
              />
              {/* Bottom edge depth */}
              <div
                className="absolute left-8 right-8 rounded-b-2xl pointer-events-none"
                style={{
                  background: 'linear-gradient(rgba(10,10,10,0.9), rgba(10,10,10,0.3))',
                  filter: 'blur(24px)',
                  zIndex: 50,
                  bottom: '-20px',
                  height: '60px',
                }}
              />
                <div className="bg-gradient-to-br from-[#1a1a1a] via-[#141414] to-[#0d0d0d] rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
                {/* Video background */}
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover scale-150 rounded-3xl"
                  style={{ opacity: 1, zIndex: 1, mixBlendMode: 'normal' }}
                >
                  <source src="/tunnel.mp4" type="video/mp4" />
                </video>

                {/* Subtle golden glow */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,165,116,0.15),transparent_60%)]" style={{ zIndex: 3 }} />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(184,134,11,0.1),transparent_50%)]" style={{ zIndex: 3 }} />

                {/* BorderBeam effect */}
                <BorderBeam
                  size={300}
                  duration={8}
                  colorFrom="#D4A574"
                  colorTo="#B8860B"
                  borderWidth={2}
                />

                <div
                  className="relative z-10 rounded-[32px] overflow-hidden p-[50px]"
                  style={{ backdropFilter: 'blur(6px) brightness(1.2)' }}
                >
                  {/* Promo badge - elegant golden style */}
                  <div className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-[#D4A574]/20 to-[#B8860B]/20 border border-[#D4A574]/30 rounded-full mb-8">
                    <IconSparkles size={16} className="text-[#D4A574]" />
                    <span className="text-[#D4A574] text-sm font-medium">Oferta specjalna do końca roku</span>
                  </div>

                  <h3 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
                    Gotowa na wyższy poziom?
                  </h3>
                  <p className="text-white/60 mb-4 max-w-2xl mx-auto text-base leading-relaxed">
                    Wklejasz link do swojego Booksy, opłacasz audyt i w ciągu 90 minut dostajesz spersonalizowany zestaw wytycznych przygotowany specjalnie dla Twojego salonu — co zmienić, w jakiej kolejności i dlaczego. Do tego Twój obecny cennik oraz zaktualizowany, gotowy do osadzenia na dowolnej stronie WWW.
                  </p>

                  {/* Lamp divider */}
                  <LampDivider className="my-2 max-w-xl mx-auto" />

                  {/* Pricing options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-6">
                    {/* Basic option */}
                    <div className="flex flex-col items-center p-6 rounded-2xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-white/30 line-through text-lg font-light">149,99 zł</span>
                        <span className="px-2 py-0.5 bg-gradient-to-r from-[#D4A574]/20 to-[#B8860B]/20 rounded-full">
                          <span className="text-[#D4A574] text-xs font-semibold">OSZCZĘDZASZ 70 ZŁ</span>
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">79,90</span>
                        <span className="text-xl text-white/70 font-light">zł</span>
                      </div>
                      <p className="mt-4 text-white/50 text-sm text-center leading-relaxed flex-1">
                        Pełny audyt Twojego profilu Booksy, spersonalizowany plan rozwoju, gotowy cennik do wdrożenia oraz konkretne wskazówki co zmienić i dlaczego.
                      </p>
                      <div className="mt-auto pt-4">
                        <RainbowButton onClick={onOpenPaywall} className="px-10">
                          Zaczynamy
                        </RainbowButton>
                      </div>
                    </div>

                    {/* Premium option */}
                    <div className="flex flex-col items-center p-6 rounded-2xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-white/30 line-through text-lg font-light">400,00 zł</span>
                        <span className="px-2 py-0.5 bg-gradient-to-r from-[#D4A574]/20 to-[#B8860B]/20 rounded-full">
                          <span className="text-[#D4A574] text-xs font-semibold">OSZCZĘDZASZ 160 ZŁ</span>
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">240,00</span>
                        <span className="text-xl text-white/70 font-light">zł</span>
                      </div>
                      <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#D4A574]/20 to-[#B8860B]/20 border border-[#D4A574]/30">
                        <IconClock size={18} className="text-[#D4A574]" />
                        <span className="text-[#D4A574] text-sm font-medium">+2h z ekspertem beauty</span>
                      </div>
                      <p className="mt-4 text-white/50 text-sm text-center leading-relaxed flex-1">
                        Wszystko z audytu + do 2 godzin konsultacji z marketerami, którzy zjedli zęby na branży beauty.
                      </p>
                      <div className="mt-auto pt-4">
                        <RainbowButton onClick={onOpenPaywall} className="px-10">
                          Zaczynamy
                        </RainbowButton>
                      </div>
                    </div>
                  </div>

                  {/* Guarantee - subtle elegant */}
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5">
                    <IconShieldCheck size={18} className="text-emerald-400" />
                    <span className="text-white/70 text-sm">30 dni gwarancji zwrotu — bez pytań</span>
                  </div>
                </div>
              </div>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* ===================== FAQ ===================== */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <BlurFade delay={0.1} inView>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900">
                Pytania i odpowiedzi
              </h2>
              <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
                Wszystko, co musisz wiedzieć o audycie profilu Booksy
              </p>
            </div>
          </BlurFade>

          <BlurFade delay={0.2} inView>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column */}
              <MagicCard
                className="bg-white rounded-lg border border-slate-200/80 p-6 shadow-sm"
                gradientColor="#171717"
                gradientOpacity={0.05}
              >
                {faqs.slice(0, Math.ceil(faqs.length / 2)).map((faq, idx) => (
                  <FAQItem
                    key={idx}
                    faq={faq}
                    isOpen={openFaq === faq.question}
                    onClick={() => setOpenFaq(openFaq === faq.question ? null : faq.question)}
                  />
                ))}
              </MagicCard>

              {/* Right column */}
              <MagicCard
                className="bg-white rounded-lg border border-slate-200/80 p-6 shadow-sm"
                gradientColor="#171717"
                gradientOpacity={0.05}
              >
                {faqs.slice(Math.ceil(faqs.length / 2)).map((faq, idx) => (
                  <FAQItem
                    key={idx + Math.ceil(faqs.length / 2)}
                    faq={faq}
                    isOpen={openFaq === faq.question}
                    onClick={() => setOpenFaq(openFaq === faq.question ? null : faq.question)}
                  />
                ))}
              </MagicCard>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* ===================== FINAL CTA - Services ===================== */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <BlurFade delay={0.1} inView>
            <div className="relative bg-white rounded-lg p-8 md:p-12 overflow-visible shadow-sm">
              <ShineBorder shineColor={["#D4A574", "#B8860B", "#D4A574"]} borderWidth={2} duration={10} />
              <DottedGlowBackground
                className="pointer-events-none opacity-20"
                opacity={1}
                gap={10}
                radius={1.6}
                color="rgba(115, 115, 115, 0.7)"
                glowColor="#D4A574"
                backgroundOpacity={0}
                speedMin={0.3}
                speedMax={1.6}
                speedScale={1}
              />
              {/* Gradient overlay to soften dots */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-white/40 to-transparent pointer-events-none" />
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16">
                {/* Left side - offer */}
                <div className="lg:col-span-3 flex flex-col justify-center">
                  <h2 className="text-2xl md:text-3xl font-serif text-slate-900 leading-snug">
                    Potrzebujesz profesjonalnej strony internetowej i kampanii reklamowej?{' '}
                    <AuroraText className="font-bold">Porozmawiajmy.</AuroraText>
                  </h2>
                  <p className="mt-6 text-slate-600 leading-relaxed">
                    Pomagamy <span className="text-[#D4A574] font-medium">salonom beauty i klinikom medycyny estetycznej</span> budować
                    profesjonalną obecność online od podstaw - od strony internetowej, przez kampanie reklamowe,
                    po kompleksową strategię marketingową.
                  </p>
                  <a
                    href="mailto:kontakt@beautyaudit.pl"
                    className="mt-8 px-8 py-3 bg-[#171717] text-white text-sm font-semibold rounded-lg hover:bg-[#2a2a2a] transition-colors w-fit"
                  >
                    Napisz do nas
                  </a>
                </div>

                {/* Right side - image */}
                <div className="lg:col-span-2 flex items-end justify-end -mr-12 -mb-12 mt-auto relative">
                  <div className="absolute bottom-16 -left-4 flex flex-col items-end">
                    <span className="text-slate-500 text-sm">Do usłyszenia,</span>
                    <span className="text-slate-600 text-3xl" style={{ fontFamily: "'Birthstone', cursive" }}>Joanna Kuflewicz</span>
                  </div>
                  <img
                    src="/asia.png"
                    alt="Joanna Kuflewicz"
                    className="max-w-[280px] h-auto -mt-20"
                  />
                </div>
              </div>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <Footer />
    </div>
  );
};

export default LandingPage;
