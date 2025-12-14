"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import {
  IconSearch,
  IconVideo,
  IconDeviceDesktop,
  IconMap,
  IconTarget,
  IconChartBar,
  IconUsers,
  IconTrendingUp,
  IconSparkles,
  IconBrandGoogle,
  IconBrandYoutube,
  IconCheck,
  IconPlus,
  IconMinus,
  IconArrowRight,
  IconPhone,
  IconMail,
  IconCalendar,
  IconRocket,
  IconShieldCheck,
  IconClock,
  IconWorld,
  IconDeviceMobile,
  IconAd,
  IconMapPin,
} from '@tabler/icons-react';

// Magic UI Components
import { NumberTicker } from '../ui/number-ticker';
import { BlurFade } from '../ui/blur-fade';
import { MagicCard } from '../ui/magic-card';
import { AuroraText } from '../ui/aurora-text';
import { AnimatedShinyText } from '../ui/animated-shiny-text';
import { BackgroundNoiseGrid } from '../ui/background-noise-grid';
import { ShineBorder } from '../ui/shine-border';
import { LayoutTextFlip } from '../ui/layout-text-flip';
import { DottedGlowBackground } from '../ui/dotted-glow-background';

// ========================================
// TYPES
// ========================================

interface GoogleAdsPageProps {
  onOpenPaywall?: () => void;
}

// ========================================
// DATA
// ========================================

const trafficSources = [
  {
    icon: IconSearch,
    title: 'Google Search',
    description: 'Docieramy do klientek, które aktywnie szukają usług beauty w Twojej okolicy. "Salon kosmetyczny Warszawa", "przedłużanie rzęs Kraków".',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
  },
  {
    icon: IconMap,
    title: 'Mapy Google',
    description: 'Wyświetlamy Twój salon osobom przeglądającym mapę w poszukiwaniu usług. Idealne dla lokalnego biznesu.',
    color: 'text-green-500',
    bgColor: 'bg-green-50',
  },
  {
    icon: IconDeviceDesktop,
    title: 'Sieć reklamowa Google',
    description: 'Reklamy display na tysiącach stron, które odwiedzają Twoje potencjalne klientki. Remarketing dla osób, które już były na stronie.',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
  },
  {
    icon: IconBrandYoutube,
    title: 'YouTube Ads',
    description: 'Video reklamy przed filmami beauty, tutorialami makijażowymi i contentem lifestylowym. Budowanie świadomości marki.',
    color: 'text-red-500',
    bgColor: 'bg-red-50',
  },
  {
    icon: IconDeviceMobile,
    title: 'Discovery & Demand Gen',
    description: 'Reklamy w Gmail, Discover i YouTube Shorts. Nowoczesne formaty dla młodszej grupy docelowej.',
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
  },
  {
    icon: IconAd,
    title: 'Performance Max',
    description: 'Kampanie oparte na AI, które automatycznie optymalizują się we wszystkich kanałach Google jednocześnie.',
    color: 'text-teal-500',
    bgColor: 'bg-teal-50',
  },
];

const whyDifferent = [
  {
    title: 'Intencja zakupowa',
    description: 'Na Google klientka szuka aktywnie. Wpisuje "salon paznokci otwarte teraz". To zupełnie inna jakość leadów niż scrollowanie feeda.',
    icon: IconTarget,
  },
  {
    title: 'Wiele punktów styku',
    description: 'Search buduje lead, remarketing w sieci reklamowej utrzymuje zainteresowanie, YouTube buduje zaufanie. Każdy kanał ma swoją rolę.',
    icon: IconWorld,
  },
  {
    title: 'Lokalny zasięg',
    description: 'Mapy Google to potężne narzędzie dla biznesu lokalnego. Wyświetlamy się osobom w promieniu kilku kilometrów od salonu.',
    icon: IconMapPin,
  },
  {
    title: 'Mierzalne wyniki',
    description: 'Widzimy dokładnie który kanał przynosi ile rezerwacji. Które słowa kluczowe konwertują. Gdzie inwestować więcej.',
    icon: IconChartBar,
  },
];

const results = [
  { value: 340, suffix: '%', label: 'Wzrost ruchu organicznego', description: 'po optymalizacji profilu GMB' },
  { value: 23, suffix: 'zł', label: 'Średni koszt leada', description: 'z kampanii Search' },
  { value: 4.2, suffix: 'x', label: 'ROAS', description: 'zwrot z inwestycji reklamowej' },
  { value: 89, suffix: '+', label: 'Kampanii Google Ads', description: 'dla branży beauty' },
];

const processSteps = [
  {
    step: 1,
    title: 'Analiza konkurencji',
    description: 'Sprawdzamy jakie słowa kluczowe targetuje Twoja konkurencja, jakie mają budżety i gdzie są luki do wykorzystania.',
    icon: IconSearch,
  },
  {
    step: 2,
    title: 'Struktura kampanii',
    description: 'Budujemy kampanie Search, Display i ewentualnie YouTube. Każdy typ kampanii ma inne cele i KPI.',
    icon: IconChartBar,
  },
  {
    step: 3,
    title: 'Optymalizacja GMB',
    description: 'Profil Google My Business to podstawa lokalnego marketingu. Optymalizujemy go pod SEO i kampanie Maps.',
    icon: IconMap,
  },
  {
    step: 4,
    title: 'Remarketing cross-platform',
    description: 'Łączymy dane z Google Ads i Meta Ads. Kto był na stronie z Google, zobaczy reklamę na Instagramie i odwrotnie.',
    icon: IconRocket,
  },
];

const searchPhrases = [
  "salon beauty warszawa",
  "rzęsy kraków",
  "manicure poznań",
  "depilacja wrocław",
  "makijaż gdańsk",
  "botox warszawa",
];

const faqs = [
  {
    question: 'Czym Google Ads różni się od Meta Ads?',
    answer: 'Google Ads dociera do osób, które aktywnie szukają usług (Search) lub przeglądają strony w sieci reklamowej. Meta Ads przerywa scrollowanie feedu. Google = intencja zakupowa, Meta = budowanie zainteresowania. Najlepsze efekty daje połączenie obu.',
  },
  {
    question: 'Jaki budżet potrzebuję na Google Ads?',
    answer: 'Dla kampanii Search rekomendujemy minimum 1500-2000 zł miesięcznie. Dla pełnej strategii (Search + Display + YouTube) 3500-5000 zł. Kluczowe jest też konkurencyjność słów kluczowych w Twojej lokalizacji.',
  },
  {
    question: 'Czy muszę mieć stronę internetową?',
    answer: 'Dla pełnych możliwości Google Ads - tak, strona jest potrzebna. Ale możemy też prowadzić kampanie kierujące na profil Google My Business lub landing page, który dla Ciebie przygotujemy.',
  },
  {
    question: 'Jak szybko zobaczę efekty?',
    answer: 'Kampanie Search mogą generować leady od pierwszego dnia. Pełna optymalizacja i stabilne wyniki to 4-8 tygodni. Kampanie display i YouTube budują efekty długoterminowo.',
  },
  {
    question: 'Czy prowadzicie też Google My Business?',
    answer: 'Tak, optymalizacja GMB to często pierwszy krok. Poprawnie prowadzony profil może generować dziesiątki zapytań miesięcznie bez wydawania złotówki na reklamy.',
  },
  {
    question: 'Łączycie Google Ads z Meta Ads?',
    answer: 'Tak, oferujemy kompleksową obsługę obu platform. Dane remarketingowe łączymy cross-platform - kto zobaczył reklamę na Google, zobaczy follow-up na Instagramie. To znacząco zwiększa konwersję.',
  },
  {
    question: 'Co to jest Performance Max?',
    answer: 'Performance Max to najnowszy typ kampanii Google, który wykorzystuje AI do automatycznej optymalizacji reklam we wszystkich kanałach Google jednocześnie - Search, Display, YouTube, Gmail, Maps i Discover.',
  },
  {
    question: 'Czy mogę targetować tylko moją okolicę?',
    answer: 'Tak, Google Ads pozwala na precyzyjne targetowanie geograficzne - od konkretnego miasta, przez dzielnicę, aż po promień wokół adresu salonu. Dla lokalnych usług beauty to kluczowe.',
  },
  {
    question: 'Jak mierzycie efekty kampanii?',
    answer: 'Konfigurujemy śledzenie konwersji - rezerwacji online, połączeń telefonicznych, wypełnionych formularzy. Cotygodniowe raporty pokazują koszt pozyskania klienta (CPL) i ROAS.',
  },
  {
    question: 'Czy podpisujemy długą umowę?',
    answer: 'Nie wymagamy długoterminowych zobowiązań. Standardowo pracujemy w cyklach miesięcznych z możliwością wypowiedzenia z 30-dniowym okresem. Wierzymy, że wyniki mówią same za siebie.',
  },
  {
    question: 'Kto tworzy treści reklamowe?',
    answer: 'Zajmujemy się kompleksowo - od research\'u słów kluczowych, przez copywriting reklam, po przygotowanie grafik i video. Nie musisz dostarczać gotowych materiałów.',
  },
  {
    question: 'Ile czasu zajmuje uruchomienie kampanii?',
    answer: 'Od briefu do pierwszych reklam to zazwyczaj 5-7 dni roboczych. W tym czasie analizujemy konkurencję, dobieramy słowa kluczowe i przygotowujemy kreacje reklamowe.',
  },
];

// ========================================
// COMPONENTS
// ========================================

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

const GoogleAdsPage: React.FC<GoogleAdsPageProps> = ({ onOpenPaywall }) => {
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [cursorPhase, setCursorPhase] = useState<'flying' | 'clicking' | 'hidden'>('flying');
  const [isTypingActive, setIsTypingActive] = useState(false);
  const [showClickRipple, setShowClickRipple] = useState(false);

  // Cursor animation sequence
  useEffect(() => {
    // Phase 1: Cursor flies in (0 - 1.6s)
    const flyTimer = setTimeout(() => {
      setCursorPhase('clicking');
      setShowClickRipple(true);
    }, 1600);

    // Phase 2: Click animation (1.6s - 1.9s)
    const clickTimer = setTimeout(() => {
      setCursorPhase('hidden');
      setShowClickRipple(false);
      setIsTypingActive(true);
    }, 1900);

    return () => {
      clearTimeout(flyTimer);
      clearTimeout(clickTimer);
    };
  }, []);

  // Typing animation effect - only runs when typing is active
  useEffect(() => {
    if (!isTypingActive) return;

    const currentPhrase = searchPhrases[currentPhraseIndex];
    const typingSpeed = isDeleting ? 30 : 80;
    const pauseTime = 2000;

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (displayedText.length < currentPhrase.length) {
          setDisplayedText(currentPhrase.slice(0, displayedText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), pauseTime);
        }
      } else {
        if (displayedText.length > 0) {
          setDisplayedText(displayedText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setCurrentPhraseIndex((prev) => (prev + 1) % searchPhrases.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, currentPhraseIndex, isTypingActive]);

  return (
    <div className="overflow-x-hidden">

      {/* ===================== HERO ===================== */}
      <BackgroundNoiseGrid>
        <section className="relative min-h-0 md:min-h-[calc(100vh-80px)] flex items-center overflow-hidden py-12 md:py-12">
          <div className="relative max-w-6xl mx-auto px-4 w-full">
            <div className="text-center">
              <BlurFade delay={0.1} inView>
                <div className="relative w-20 h-20 md:w-32 md:h-32 mx-auto mb-4 md:mb-6">
                  <img
                    src="/google2.png"
                    alt="Google"
                    className="w-20 h-20 md:w-32 md:h-32 rounded-xl md:rounded-2xl transform rotate-[-8deg] skew-y-[2deg]"
                    style={{
                      boxShadow: '0 20px 40px -10px rgba(66, 133, 244, 0.4), 0 12px 24px -8px rgba(234, 67, 53, 0.3), 0 8px 16px -6px rgba(251, 188, 5, 0.25)'
                    }}
                  />
                </div>
              </BlurFade>

              <BlurFade delay={0.2} inView>
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold text-slate-900 mb-4 md:mb-6 leading-tight">
                  Pokażemy Cię tam,{' '}
                  <AuroraText colors={["#4285F4", "#34A853", "#FBBC05", "#EA4335"]}>
                    gdzie Cię potrzebują
                  </AuroraText>
                </h1>
              </BlurFade>

              <BlurFade delay={0.3} inView>
                <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto mb-8">
                  Google Ads to nie tylko reklamy w wyszukiwarce. To{' '}
                  <mark className="bg-[#4285F4]/15 text-slate-800 px-1 rounded">cały ekosystem</mark>
                  {' — '}
                  <LayoutTextFlip
                    words={["Search", "Display", "YouTube", "Mapy", "Discovery"]}
                    duration={2000}
                    className="text-slate-800"
                  />
                  {'. '}Wykorzystujemy każdy kanał,
                  żeby <mark className="bg-[#34A853]/15 text-slate-800 px-1 rounded">napędzać pozyskiwanie klientów</mark>{' '}
                  z wielu stron jednocześnie.
                </p>
              </BlurFade>

              {/* Google-style search input with animated gradient border */}
              <BlurFade delay={0.35} inView>
                <div className="max-w-2xl mx-auto mb-8">
                  <div className="relative group">
                    {/* Animated flying cursor - smooth single motion */}
                    <AnimatePresence>
                      {cursorPhase !== 'hidden' && (
                        <motion.div
                          className="absolute pointer-events-none z-50"
                          initial={{ x: -300, y: 200, opacity: 0 }}
                          animate={cursorPhase === 'clicking'
                            ? { x: 20, y: 10, opacity: 0, scale: 0.8 }
                            : { x: 20, y: 10, opacity: 1, scale: 1 }
                          }
                          transition={{
                            duration: cursorPhase === 'clicking' ? 0.25 : 1.6,
                            ease: cursorPhase === 'clicking' ? 'easeOut' : [0.22, 1, 0.36, 1]
                          }}
                          style={{ left: '38%', top: '50%' }}
                        >
                          {/* Click animation - scale bounce */}
                          <motion.div
                            animate={cursorPhase === 'clicking'
                              ? { scale: [1, 0.8, 1.15, 0.9] }
                              : { scale: 1 }
                            }
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                          >
                            <svg
                              width="32"
                              height="32"
                              viewBox="0 0 24 24"
                              fill="none"
                              className="drop-shadow-[0_3px_10px_rgba(0,0,0,0.3)]"
                            >
                              <path
                                d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L6.35 2.76a.5.5 0 0 0-.85.45Z"
                                fill="#fff"
                                stroke="#1a1a1a"
                                strokeWidth="1.5"
                              />
                            </svg>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Click ripple effect */}
                    <AnimatePresence>
                      {showClickRipple && (
                        <motion.div
                          className="absolute pointer-events-none z-40"
                          style={{ left: '42%', top: '50%' }}
                          initial={{ scale: 0, opacity: 0.8 }}
                          animate={{ scale: 2.5, opacity: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                        >
                          <div className="w-8 h-8 rounded-full bg-[#4285F4]/30 -translate-x-1/2 -translate-y-1/2" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {/* Animated gradient border */}
                    <div
                      className="absolute -inset-[3px] rounded-full bg-[length:200%] animate-rainbow"
                      style={{
                        background: 'linear-gradient(90deg, #4285F4, #34A853, #FBBC05, #EA4335, #4285F4)',
                        backgroundSize: '200% 100%',
                      }}
                    />
                    {/* Glow effect below */}
                    <div
                      className="absolute -bottom-[20%] left-1/2 -translate-x-1/2 h-1/4 w-3/5 animate-rainbow bg-[length:200%] rounded-full blur-xl opacity-60"
                      style={{
                        background: 'linear-gradient(90deg, #4285F4, #34A853, #FBBC05, #EA4335, #4285F4)',
                        backgroundSize: '200% 100%',
                      }}
                    />
                    {/* Inner white container */}
                    <div className="relative bg-white rounded-full px-6 py-5 flex items-center gap-4 shadow-lg">
                      <IconSearch size={26} className="text-slate-400 shrink-0" />
                      <div className="flex-1 text-left text-lg min-h-[1.75rem]">
                        {isTypingActive ? (
                          <>
                            <span className="text-slate-700">{displayedText}</span>
                            <span className="inline-block w-0.5 h-6 bg-[#4285F4] ml-0.5 animate-pulse" />
                          </>
                        ) : (
                          <span className="text-slate-400">Szukaj...</span>
                        )}
                      </div>
                      <div className="w-px h-8 bg-slate-200" />
                      <IconBrandGoogle size={26} className="text-slate-400 shrink-0" />
                    </div>
                  </div>
                </div>
              </BlurFade>

              <BlurFade delay={0.4} inView>
                <div className="flex items-center justify-center">
                  {/* White Rainbow button with Google colors */}
                  <button
                    onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}
                    className="group relative cursor-pointer animate-rainbow inline-flex items-center justify-center gap-2 shrink-0 rounded-xl outline-none text-base font-semibold h-14 px-8 py-3 border-0 bg-[length:200%] [background-clip:padding-box,border-box,border-box] [background-origin:border-box] [border:calc(0.15rem)_solid_transparent] bg-[linear-gradient(#ffffff,#ffffff),linear-gradient(#ffffff_50%,rgba(255,255,255,0.6)_80%,rgba(255,255,255,0)),linear-gradient(90deg,#4285F4,#34A853,#FBBC05,#EA4335,#4285F4)] text-slate-900 before:absolute before:bottom-[-20%] before:left-1/2 before:-z-10 before:h-1/5 before:w-3/5 before:-translate-x-1/2 before:animate-rainbow before:bg-[length:200%] before:bg-[linear-gradient(90deg,#4285F4,#34A853,#FBBC05,#EA4335,#4285F4)] before:[filter:blur(calc(0.8*1rem))] before:rounded-xl transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95"
                  >
                    Umów bezpłatną konsultację
                    <IconArrowRight size={18} />
                  </button>
                </div>
              </BlurFade>

            </div>
          </div>
        </section>
      </BackgroundNoiseGrid>

      {/* ===================== WHY DIFFERENT ===================== */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <BlurFade delay={0.1} inView>
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-[#4285F4] uppercase tracking-wider mb-3">
                Dlaczego Google Ads?
              </p>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4">
                Inny system reklamowy, inne możliwości
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Google Ads to nie tylko alternatywa dla Meta. To zupełnie inny sposób dotarcia do klientek.
              </p>
            </div>
          </BlurFade>

          <div className="grid md:grid-cols-2 gap-6">
            {whyDifferent.map((item, index) => (
              <BlurFade key={item.title} delay={0.1 + index * 0.1} inView>
                <MagicCard
                  className="p-6 bg-white border border-slate-100"
                  gradientColor="rgba(66, 133, 244, 0.15)"
                >
                  <div className="flex gap-4">
                    <div className="w-12 h-12 shrink-0 bg-[#4285F4]/10 rounded-xl flex items-center justify-center">
                      <item.icon size={24} className="text-[#4285F4]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                </MagicCard>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== TRAFFIC SOURCES ===================== */}
      <section id="zrodla" className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <BlurFade delay={0.1} inView>
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-[#34A853] uppercase tracking-wider mb-3">
                Źródła ruchu
              </p>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4">
                Wykorzystujemy każdy kanał Google
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Nie ograniczamy się do reklam w wyszukiwarce. Każdy kanał ma swoją rolę w ścieżce klienta.
              </p>
            </div>
          </BlurFade>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Google Search Card */}
            <BlurFade delay={0.1} inView>
              <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-xl p-4 mb-4 h-44 overflow-hidden">
                  {/* Search skeleton */}
                  <div className="bg-white rounded-full border border-slate-200 px-4 py-2 flex items-center gap-2 mb-3 shadow-sm">
                    <IconSearch size={14} className="text-slate-400" />
                    <span className="text-xs text-slate-600">salon kosmetyczny warszawa</span>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-white rounded-lg p-2 border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-[10px] font-medium text-[#4285F4] bg-blue-50 px-1.5 py-0.5 rounded">Reklama</span>
                      </div>
                      <div className="text-xs font-medium text-[#1a0dab]">Twój Salon Beauty - Umów wizytę</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">www.twojsalon.pl</div>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-slate-100 shadow-sm opacity-60">
                      <div className="h-2 w-3/4 bg-slate-100 rounded mb-1" />
                      <div className="h-2 w-1/2 bg-slate-50 rounded" />
                    </div>
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 mb-2 group-hover:text-[#4285F4] transition-colors">
                  Google Search
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">Docieramy do klientek, które aktywnie szukają usług beauty w Twojej okolicy.</p>
              </div>
            </BlurFade>

            {/* Mapy Google Card */}
            <BlurFade delay={0.15} inView>
              <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                <div className="bg-gradient-to-br from-green-50/50 to-slate-50 rounded-xl p-4 mb-4 h-44 overflow-hidden relative">
                  {/* Map skeleton */}
                  <div className="absolute inset-4 bg-[#e8f4e8] rounded-lg overflow-hidden">
                    <div className="absolute inset-0 opacity-30">
                      <div className="absolute top-1/4 left-0 right-0 h-[1px] bg-slate-300" />
                      <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-slate-300" />
                      <div className="absolute top-3/4 left-0 right-0 h-[1px] bg-slate-300" />
                      <div className="absolute left-1/4 top-0 bottom-0 w-[1px] bg-slate-300" />
                      <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-slate-300" />
                      <div className="absolute left-3/4 top-0 bottom-0 w-[1px] bg-slate-300" />
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <div className="relative">
                        <IconMapPin size={32} className="text-[#EA4335] drop-shadow-md" />
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-2 bg-black/10 rounded-full blur-sm" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2 bg-white rounded px-2 py-1 shadow-sm">
                      <div className="text-[9px] font-medium text-slate-700">Twój Salon</div>
                      <div className="flex items-center gap-0.5">
                        <span className="text-[8px] text-[#FBBC05]">★★★★★</span>
                        <span className="text-[8px] text-slate-500">4.9</span>
                      </div>
                    </div>
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 mb-2 group-hover:text-[#34A853] transition-colors">
                  Mapy Google
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">Wyświetlamy Twój salon osobom przeglądającym mapę w poszukiwaniu usług.</p>
              </div>
            </BlurFade>

            {/* Sieć reklamowa Card */}
            <BlurFade delay={0.2} inView>
              <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                <div className="bg-gradient-to-br from-purple-50/50 to-slate-50 rounded-xl p-4 mb-4 h-44 overflow-hidden">
                  {/* Display ads skeleton */}
                  <div className="grid grid-cols-2 gap-2 h-full">
                    <div className="bg-white rounded-lg border border-slate-100 p-2 shadow-sm">
                      <div className="w-full h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded mb-1.5" />
                      <div className="h-1.5 w-3/4 bg-slate-100 rounded mb-1" />
                      <div className="h-1.5 w-1/2 bg-slate-50 rounded" />
                    </div>
                    <div className="space-y-2">
                      <div className="bg-white rounded-lg border border-slate-100 p-1.5 shadow-sm h-[45%]">
                        <div className="w-full h-full bg-gradient-to-r from-blue-50 to-purple-50 rounded flex items-center justify-center">
                          <span className="text-[8px] text-purple-400">300x250</span>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg border border-slate-100 p-1.5 shadow-sm h-[45%]">
                        <div className="w-full h-full bg-gradient-to-r from-pink-50 to-orange-50 rounded flex items-center justify-center">
                          <span className="text-[8px] text-orange-400">Banner</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 mb-2 group-hover:text-purple-500 transition-colors">
                  Sieć reklamowa Google
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">Reklamy display na tysiącach stron, które odwiedzają Twoje potencjalne klientki.</p>
              </div>
            </BlurFade>

            {/* YouTube Ads Card */}
            <BlurFade delay={0.25} inView>
              <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                <div className="bg-gradient-to-br from-red-50/50 to-slate-50 rounded-xl p-4 mb-4 h-44 overflow-hidden">
                  {/* YouTube player skeleton */}
                  <div className="bg-slate-800 rounded-lg h-full relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900" />
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      <div className="bg-yellow-400 text-[8px] font-bold px-1.5 py-0.5 rounded text-slate-900">Reklama</div>
                      <span className="text-[9px] text-white/60">0:15</span>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                        <IconBrandYoutube size={20} className="text-[#FF0000]" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full w-1/4 bg-[#FF0000]" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 text-[9px] text-white/60">
                      Pomiń za 5s →
                    </div>
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 mb-2 group-hover:text-[#FF0000] transition-colors">
                  YouTube Ads
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">Video reklamy przed filmami beauty, tutorialami makijażowymi i contentem lifestylowym.</p>
              </div>
            </BlurFade>

            {/* Discovery Card */}
            <BlurFade delay={0.3} inView>
              <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                <div className="bg-gradient-to-br from-orange-50/50 to-slate-50 rounded-xl p-4 mb-4 h-44 overflow-hidden">
                  {/* Mobile feed skeleton */}
                  <div className="mx-auto w-24 h-full bg-slate-800 rounded-xl relative overflow-hidden border-4 border-slate-700">
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-slate-600 rounded-full" />
                    <div className="absolute top-3 inset-x-1 bottom-1 bg-white rounded-lg overflow-hidden">
                      <div className="p-1.5 space-y-1.5">
                        <div className="w-full h-10 bg-gradient-to-r from-orange-100 to-pink-100 rounded" />
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-4 bg-slate-200 rounded-full" />
                          <div className="h-1.5 w-10 bg-slate-100 rounded" />
                        </div>
                        <div className="w-full h-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded opacity-60" />
                      </div>
                    </div>
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 mb-2 group-hover:text-orange-500 transition-colors">
                  Discovery & Demand Gen
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">Reklamy w Gmail, Discover i YouTube Shorts. Nowoczesne formaty dla młodszej grupy.</p>
              </div>
            </BlurFade>

            {/* Performance Max Card */}
            <BlurFade delay={0.35} inView>
              <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                <div className="bg-gradient-to-br from-teal-50/50 to-slate-50 rounded-xl p-4 mb-4 h-44 overflow-hidden">
                  {/* AI/automation skeleton */}
                  <div className="h-full flex flex-col items-center justify-center">
                    <div className="relative mb-3">
                      <div className="w-14 h-14 bg-gradient-to-br from-teal-100 to-blue-100 rounded-xl flex items-center justify-center">
                        <IconSparkles size={24} className="text-teal-500" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#34A853] rounded-full flex items-center justify-center">
                        <IconCheck size={10} className="text-white" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="h-1.5 w-8 bg-blue-200 rounded-full" />
                      <div className="h-1.5 w-6 bg-green-200 rounded-full" />
                      <div className="h-1.5 w-10 bg-purple-200 rounded-full" />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center">
                        <IconSearch size={12} className="text-blue-400 mb-0.5" />
                        <div className="h-1 w-4 bg-blue-100 rounded" />
                      </div>
                      <div className="flex flex-col items-center">
                        <IconBrandYoutube size={12} className="text-red-400 mb-0.5" />
                        <div className="h-1 w-4 bg-red-100 rounded" />
                      </div>
                      <div className="flex flex-col items-center">
                        <IconDeviceDesktop size={12} className="text-purple-400 mb-0.5" />
                        <div className="h-1 w-4 bg-purple-100 rounded" />
                      </div>
                      <div className="flex flex-col items-center">
                        <IconMap size={12} className="text-green-400 mb-0.5" />
                        <div className="h-1 w-4 bg-green-100 rounded" />
                      </div>
                    </div>
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 mb-2 group-hover:text-teal-500 transition-colors">
                  Performance Max
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">Kampanie oparte na AI, które automatycznie optymalizują się we wszystkich kanałach.</p>
              </div>
            </BlurFade>
          </div>
        </div>
      </section>

      {/* ===================== RESULTS ===================== */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <BlurFade delay={0.1} inView>
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-[#FBBC05] uppercase tracking-wider mb-3">
                Wyniki
              </p>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4">
                Co osiągamy dla naszych klientów
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Nasze kampanie przynoszą mierzalne rezultaty dla salonów beauty w całej Polsce.
              </p>
            </div>
          </BlurFade>

          <div className="max-w-5xl mx-auto border border-slate-200 rounded-2xl overflow-hidden bg-white">
            <div className="grid md:grid-cols-2">
              {/* Wzrost ruchu */}
              <BlurFade delay={0.1} inView>
                <div className="p-6 md:border-r border-b border-slate-200">
                  <h3 className="font-bold text-slate-900 text-lg mb-2">Wzrost ruchu</h3>
                  <p className="text-sm text-slate-600 mb-6">Znaczący wzrost wizyt z wyszukiwarki po optymalizacji kampanii. Bez tego tracisz klientów - pomożemy to naprawić.</p>

                  {/* Isometric illustration - Activity log style */}
                  <div className="relative h-52">
                    <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-4 transform -rotate-1">
                      <div className="flex items-center gap-2 mb-3 text-slate-400 text-xs">
                        <IconChartBar size={14} />
                        <span>Statystyki kampanii</span>
                      </div>

                      <div className="space-y-2.5">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                            <IconTrendingUp size={12} className="text-[#4285F4]" />
                          </div>
                          <span className="text-xs text-slate-700">Wyświetlenia</span>
                          <span className="text-[10px] text-slate-400 ml-auto">+156%</span>
                          <div className="w-20 h-1.5 bg-slate-100 rounded overflow-hidden">
                            <div className="h-full w-[85%] bg-[#4285F4] rounded" />
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                            <IconCheck size={12} className="text-[#34A853]" />
                          </div>
                          <span className="text-xs text-slate-700">Kliknięcia</span>
                          <span className="text-[10px] text-slate-400 ml-auto">+89%</span>
                          <div className="w-20 h-1.5 bg-slate-100 rounded overflow-hidden">
                            <div className="h-full w-[70%] bg-[#34A853] rounded" />
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center">
                            <IconUsers size={12} className="text-[#FBBC04]" />
                          </div>
                          <span className="text-xs text-slate-700">Konwersje</span>
                          <span className="text-[10px] text-slate-400 ml-auto">+67%</span>
                          <div className="w-20 h-1.5 bg-slate-100 rounded overflow-hidden">
                            <div className="h-full w-[55%] bg-[#FBBC04] rounded" />
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                            <IconMapPin size={12} className="text-purple-500" />
                          </div>
                          <span className="text-xs text-slate-700">Wizyty lokalne</span>
                          <span className="text-[10px] text-[#34A853] font-medium ml-auto">AKTYWNE</span>
                          <div className="w-20 h-1.5 bg-slate-100 rounded overflow-hidden">
                            <div className="h-full w-[90%] bg-purple-500 rounded" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </BlurFade>

              {/* Pipeline statusów */}
              <BlurFade delay={0.15} inView>
                <div className="p-6 border-b border-slate-200">
                  <h3 className="font-bold text-slate-900 text-lg mb-2">Pipeline leadów</h3>
                  <p className="text-sm text-slate-600 mb-6">Lead przychodzi jako nieznany i musi przejść przez etapy aż do konwersji. Pomagamy optymalizować każdy krok.</p>

                  {/* Isometric illustration - Modern Pipeline */}
                  <div className="relative h-52 flex items-center justify-center">
                    <div className="flex items-center gap-3">
                      {/* Stage 1 - Nieznany */}
                      <div className="flex flex-col items-center">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shadow-sm border border-slate-200">
                          <IconUsers size={28} className="text-slate-400" />
                        </div>
                        <span className="text-[10px] text-slate-500 mt-2 font-medium">Nieznany</span>
                        <span className="text-[8px] text-slate-400">100%</span>
                      </div>

                      {/* Arrow */}
                      <div className="flex flex-col items-center -mt-6">
                        <IconArrowRight size={20} className="text-slate-300" />
                        <span className="text-[7px] text-slate-400 mt-1">filtrowanie</span>
                      </div>

                      {/* Stage 2 - W procesie */}
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-sm border border-blue-200">
                          <IconClock size={24} className="text-[#4285F4]" />
                        </div>
                        <span className="text-[10px] text-[#4285F4] mt-2 font-medium">W procesie</span>
                        <span className="text-[8px] text-slate-400">35%</span>
                      </div>

                      {/* Arrow */}
                      <div className="flex flex-col items-center -mt-6">
                        <IconArrowRight size={20} className="text-blue-300" />
                        <span className="text-[7px] text-slate-400 mt-1">konwersja</span>
                      </div>

                      {/* Stage 3 - Pozyskany */}
                      <div className="flex flex-col items-center">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center shadow-sm border border-green-200">
                          <IconCheck size={22} className="text-[#34A853]" />
                        </div>
                        <span className="text-[10px] text-[#34A853] mt-2 font-medium">Pozyskany</span>
                        <span className="text-[8px] text-slate-400">12%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </BlurFade>

              {/* Źródła ruchu - kanały Google Ads z animowanymi orbitami */}
              <BlurFade delay={0.2} inView>
                <div className="p-6 md:border-r border-slate-200">
                  <h3 className="font-bold text-slate-900 text-lg mb-2">Źródła ruchu</h3>
                  <p className="text-sm text-slate-600 mb-4">Docieramy do Twoich klientów przez wszystkie kanały Google - Search, YouTube, Maps i Performance Max.</p>

                  {/* Animated orbit illustration */}
                  <div className="relative h-60 overflow-hidden [mask-image:radial-gradient(ellipse_50%_50%_at_center,black,transparent)]">
                    <div className="flex-1 rounded-t-3xl gap-2 flex items-center justify-center w-full h-full absolute inset-x-0 p-2" style={{ transform: 'rotateY(20deg) rotateX(20deg) rotateZ(-20deg)' }}>
                      {/* Center target */}
                      <div className="size-32 bg-white absolute inset-0 shrink-0 border z-[10] rounded-full m-auto flex items-center justify-center border-slate-200 shadow-sm">
                        <IconTarget size={32} className="text-slate-400" />

                        {/* Orbiting Google Search */}
                        <div className="size-10 flex absolute inset-0 m-auto items-center justify-center border border-transparent shadow-black/10 ring-1 ring-black/10 rounded-lg animate-orbit [--translate-position:100px] [--orbit-duration:12s] bg-white">
                          <IconSearch size={20} className="text-[#4285F4]" />
                        </div>

                        {/* Orbiting YouTube */}
                        <div className="size-10 flex absolute inset-0 m-auto items-center justify-center border border-transparent shadow-black/10 ring-1 ring-black/10 rounded-lg animate-orbit [--initial-position:72deg] [--translate-position:130px] [--orbit-duration:18s] bg-white">
                          <IconBrandYoutube size={20} className="text-[#EA4335]" />
                        </div>

                        {/* Orbiting Maps */}
                        <div className="size-10 flex absolute inset-0 m-auto items-center justify-center border border-transparent shadow-black/10 ring-1 ring-black/10 rounded-lg animate-orbit [--initial-position:144deg] [--translate-position:160px] [--orbit-duration:22s] bg-white">
                          <IconMap size={20} className="text-[#34A853]" />
                        </div>

                        {/* Orbiting Performance Max */}
                        <div className="size-10 flex absolute inset-0 m-auto items-center justify-center border border-transparent shadow-black/10 ring-1 ring-black/10 rounded-lg animate-orbit [--initial-position:216deg] [--translate-position:190px] [--orbit-duration:25s] bg-white">
                          <IconSparkles size={20} className="text-[#FBBC04]" />
                        </div>

                        {/* Orbiting Display */}
                        <div className="size-10 flex absolute inset-0 m-auto items-center justify-center border border-transparent shadow-black/10 ring-1 ring-black/10 rounded-lg animate-orbit [--initial-position:288deg] [--translate-position:140px] [--orbit-duration:16s] bg-white">
                          <IconDeviceDesktop size={20} className="text-slate-500" />
                        </div>

                        {/* Floating info card - Remarketing */}
                        <div className="flex absolute inset-0 m-auto items-center justify-center border border-transparent rounded-sm animate-orbit [--initial-position:30deg] [--translate-position:220px] [--orbit-duration:30s] size-auto ring-0 shadow-none bg-transparent w-48">
                          <div className="h-fit my-auto mx-auto w-full p-2 rounded-xl border border-slate-200 shadow-lg absolute bottom-0 left-8 max-w-[90%] z-30 bg-white">
                            <div className="flex gap-2 items-center">
                              <IconCheck size={12} className="text-green-500" />
                              <p className="text-[10px] font-medium text-slate-800">Remarketing</p>
                            </div>
                            <p className="text-[8px] text-slate-400 mt-1">Wracają do Twojego salonu</p>
                          </div>
                        </div>

                        {/* Floating info card - Lookalike */}
                        <div className="flex absolute inset-0 m-auto items-center justify-center border border-transparent rounded-sm animate-orbit [--initial-position:200deg] [--translate-position:180px] [--orbit-duration:26s] size-auto ring-0 shadow-none bg-transparent w-48">
                          <div className="h-fit my-auto mx-auto w-full p-2 rounded-xl border border-slate-200 shadow-lg absolute bottom-0 left-8 max-w-[90%] z-30 bg-white">
                            <div className="flex gap-2 items-center">
                              <IconCheck size={12} className="text-green-500" />
                              <p className="text-[10px] font-medium text-slate-800">Lookalike</p>
                            </div>
                            <p className="text-[8px] text-slate-400 mt-1">Podobni do Twoich klientek</p>
                          </div>
                        </div>
                      </div>

                      {/* Concentric orbit circles */}
                      <div className="inset-0 shrink-0 border rounded-full m-auto shadow border-slate-100 size-48 bg-slate-100/80 z-[9] relative" />
                      <div className="absolute inset-0 shrink-0 border rounded-full m-auto shadow border-slate-100 size-64 bg-slate-100/60 z-[8]" />
                      <div className="absolute inset-0 shrink-0 border rounded-full m-auto shadow border-slate-100 size-80 bg-slate-100/40 z-[7]" />
                      <div className="absolute inset-0 shrink-0 border rounded-full m-auto shadow border-slate-100 size-96 bg-slate-100/20 z-[6]" />
                    </div>
                  </div>
                </div>
              </BlurFade>

              {/* Optymalizacja kampanii */}
              <BlurFade delay={0.25} inView>
                <div className="p-6">
                  <h3 className="font-bold text-slate-900 text-lg mb-2">Optymalizacja kampanii</h3>
                  <p className="text-sm text-slate-600 mb-6">Kampania to żywy organizm - wymaga codziennej uwagi. Analizujemy dane, wyciągamy wnioski i pokazujemy Ci co działa.</p>

                  {/* 3D Perspective Report Card */}
                  <div className="relative h-52 flex items-center justify-center overflow-hidden [mask-image:linear-gradient(to_bottom,black_70%,transparent)]" style={{ perspective: '1000px' }}>
                    <div
                      className="relative w-56"
                      style={{ transform: 'rotateX(20deg) rotateY(20deg) rotateZ(-20deg)' }}
                    >
                      {/* Background shadow layer with grid pattern */}
                      <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-xl bg-slate-200/80">
                        <div
                          className="absolute inset-0 opacity-30 rounded-xl"
                          style={{
                            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 11px, #94a3b8 11px, #94a3b8 12px), repeating-linear-gradient(90deg, transparent, transparent 11px, #94a3b8 11px, #94a3b8 12px)',
                            backgroundSize: '12px 12px'
                          }}
                        />
                      </div>

                      {/* Main card */}
                      <div className="relative bg-white rounded-xl shadow-lg border border-slate-100 p-3">
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                          <IconChartBar size={14} className="text-[#4285F4]" />
                          <span className="text-xs font-medium text-slate-700">Raport kampanii</span>
                        </div>

                        {/* Metrics */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between py-1">
                            <div className="flex items-center gap-1.5">
                              <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                                <IconCheck size={10} className="text-[#34A853]" />
                              </div>
                              <span className="text-[10px] text-slate-600">CTR</span>
                            </div>
                            <span className="text-[10px] font-semibold text-[#34A853]">2.4%</span>
                          </div>
                          <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                          <div className="flex items-center justify-between py-1">
                            <div className="flex items-center gap-1.5">
                              <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                                <IconCheck size={10} className="text-[#34A853]" />
                              </div>
                              <span className="text-[10px] text-slate-600">CPC</span>
                            </div>
                            <span className="text-[10px] font-semibold text-slate-600">0.85zł</span>
                          </div>
                          <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                          <div className="flex items-center justify-between py-1">
                            <div className="flex items-center gap-1.5">
                              <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                                <IconCheck size={10} className="text-[#34A853]" />
                              </div>
                              <span className="text-[10px] text-slate-600">CPL</span>
                            </div>
                            <span className="text-[10px] font-semibold text-slate-600">24 zł</span>
                          </div>
                          <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                          <div className="flex items-center justify-between py-1">
                            <div className="flex items-center gap-1.5">
                              <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                                <IconCheck size={10} className="text-[#34A853]" />
                              </div>
                              <span className="text-[10px] text-slate-600">Częstotliwość</span>
                            </div>
                            <span className="text-[10px] font-semibold text-slate-600">1.8</span>
                          </div>
                          <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

                          <div className="flex items-center justify-between py-1">
                            <div className="flex items-center gap-1.5">
                              <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                                <div className="w-2.5 h-2.5 border-2 border-[#4285F4] border-t-transparent rounded-full animate-spin" />
                              </div>
                              <span className="text-[10px] text-slate-600">ROAS</span>
                            </div>
                            <span className="text-[10px] font-semibold text-[#4285F4]">4.2x</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </BlurFade>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== PROCESS ===================== */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <BlurFade delay={0.1} inView>
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-[#EA4335] uppercase tracking-wider mb-3">
                Jak działamy
              </p>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4">
                Strategia dla salonów beauty
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Wiemy jak działać w branży beauty - od analizy słów kluczowych po remarketing cross-platform.
              </p>
            </div>
          </BlurFade>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 md:px-0">
            {processSteps.map((step, index) => (
              <BlurFade key={step.step} delay={0.1 + index * 0.1} inView>
                <div className="relative p-6 pt-8 md:pt-6 bg-white rounded-2xl border border-slate-100 group hover:border-[#4285F4]/30 transition-colors">
                  <div className="absolute top-2 left-4 md:-top-3 md:-left-3 w-8 h-8 bg-[#4285F4] rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    {step.step}
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-[#4285F4]/10 transition-colors">
                      <step.icon size={20} className="text-[#4285F4]" />
                    </div>
                    <h3 className="font-bold text-slate-900">{step.title}</h3>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{step.description}</p>
                </div>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== FAQ ===================== */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <BlurFade delay={0.1} inView>
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-[#4285F4] uppercase tracking-wider mb-3">
                FAQ
              </p>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4">
                Najczęściej zadawane pytania
              </h2>
            </div>
          </BlurFade>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column */}
            <BlurFade delay={0.2} inView>
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                {faqs.slice(0, 6).map((faq, index) => (
                  <FAQItem
                    key={index}
                    faq={faq}
                    isOpen={openFaq === faq.question}
                    onClick={() => setOpenFaq(openFaq === faq.question ? null : faq.question)}
                  />
                ))}
              </div>
            </BlurFade>

            {/* Right column */}
            <BlurFade delay={0.3} inView>
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                {faqs.slice(6, 12).map((faq, index) => (
                  <FAQItem
                    key={index + 6}
                    faq={faq}
                    isOpen={openFaq === faq.question}
                    onClick={() => setOpenFaq(openFaq === faq.question ? null : faq.question)}
                  />
                ))}
              </div>
            </BlurFade>
          </div>
        </div>
      </section>

      {/* ===================== CONTACT FORM ===================== */}
      <section id="contact-form" className="py-20 bg-white scroll-mt-20">
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
              <div className="relative z-10">
                {/* Full width header */}
                <div className="mb-10">
                  <h2 className="text-2xl md:text-3xl font-serif text-slate-900 leading-snug">
                    Potrzebujesz kampanii Google Ads, która przynosi realne rezerwacje?{' '}
                    <AuroraText className="font-bold" colors={["#4285F4", "#34A853", "#FBBC05", "#EA4335"]}>Porozmawiajmy.</AuroraText>
                  </h2>
                  <p className="mt-4 text-slate-600 leading-relaxed max-w-2xl">
                    Pomagamy <span className="text-[#D4A574] font-medium">salonom beauty i klinikom medycyny estetycznej</span> budować
                    skuteczne kampanie w Google Ads - od wyszukiwarki, przez YouTube, po kompleksową strategię Performance Max.
                  </p>
                </div>

                {/* Two columns: form + image */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16">
                  {/* Left side - form */}
                  <div className="lg:col-span-3 flex flex-col justify-center">
                    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Imię i nazwisko</label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#D4A574] focus:ring-2 focus:ring-[#D4A574]/20 outline-none transition-all"
                          placeholder="Anna Kowalska"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#D4A574] focus:ring-2 focus:ring-[#D4A574]/20 outline-none transition-all"
                          placeholder="anna@salon.pl"
                        />
                      </div>
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#D4A574] focus:ring-2 focus:ring-[#D4A574]/20 outline-none transition-all"
                          placeholder="+48 600 000 000"
                        />
                      </div>
                      <div>
                        <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1">Wiadomość</label>
                        <textarea
                          id="message"
                          name="message"
                          rows={3}
                          className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#D4A574] focus:ring-2 focus:ring-[#D4A574]/20 outline-none transition-all resize-none"
                          placeholder="Opowiedz o swoim salonie..."
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full px-8 py-3 bg-[#171717] text-white text-sm font-semibold rounded-lg hover:bg-[#2a2a2a] transition-colors"
                      >
                        Wyślij wiadomość
                      </button>
                    </form>
                  </div>

                  {/* Right side - image */}
                  <div className="lg:col-span-2 flex items-end justify-end relative" style={{ transform: 'translate(16px, 14px)' }}>
                    <div className="absolute bottom-12 lg:bottom-16 left-0 flex flex-col items-start sm:left-[-50px]">
                      <span className="text-slate-500 text-sm">Do usłyszenia,</span>
                      <span className="text-slate-600 text-3xl" style={{ fontFamily: "'Birthstone', cursive" }}>Joanna <br className="md:hidden xs:block" />Kuflewicz</span>
                    </div>
                    <img
                      src="/asia.png"
                      alt="Joanna Kuflewicz"
                      className="max-w-[220px] lg:max-w-[280px] h-auto translate-y-[16px] translate-x-[14px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="py-10 border-t border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <img src="/logo2.png" alt="BooksyAudit" className="h-6" />
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <a href="#" className="hover:text-[#171717]">Regulamin</a>
              <a href="#" className="hover:text-[#171717]">Prywatność</a>
              <a href="#" className="hover:text-[#171717]">Kontakt</a>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-sm text-slate-400">© 2025 BooksyAudit.pl by</p>
              <a href="https://kolabo.pl" target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100 transition-opacity">
                <img src="/kolabo.svg" alt="Kolabo" className="h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default GoogleAdsPage;
