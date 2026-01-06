"use client";
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useUser } from '@clerk/clerk-react';
import { Link2, Clock, ArrowRight, Loader2, Sparkles, CheckCircle, Crown, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { ShineBorder } from '../ui/shine-border';
import { RainbowButton } from '../ui/rainbow-button';
import { HeroHighlight } from '../ui/hero-highlight';
import { BlurFade } from '../ui/blur-fade';
import { AuroraText } from '../ui/aurora-text';

const StartAuditPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isSignedIn, isLoaded: isClerkLoaded } = useUser();

  // Pre-fill URL z query param (dla "Powtórz audyt")
  const prefillUrl = searchParams.get('url') || '';
  const [booksyUrl, setBooksyUrl] = useState(prefillUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Aktualizuj URL gdy zmieni się query param
  useEffect(() => {
    if (prefillUrl) {
      setBooksyUrl(prefillUrl);
    }
  }, [prefillUrl]);

  // Get user data from Convex
  const user = useQuery(api.users.getCurrentUser);
  const activeAudit = useQuery(api.audits.getActiveAudit);
  const startNewAudit = useMutation(api.audits.startNewAudit);
  const startAudit = useMutation(api.audits.startAudit);

  // Loading state
  if (!isClerkLoaded || user === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#D4A574] animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Ładowanie...</p>
        </div>
      </div>
    );
  }

  // Not signed in
  if (!isSignedIn || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-slate-900 mb-4">
            Musisz być zalogowany
          </h1>
          <p className="text-slate-600 mb-8">
            Zaloguj się, aby rozpocząć audyt swojego profilu Booksy.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            Wróć na stronę główną
          </button>
        </div>
      </div>
    );
  }

  // Check if user has pending audit OR credits
  const hasPendingAudit = activeAudit?.status === 'pending';
  const hasCredits = user.credits > 0;

  // Active statuses that indicate an audit is in progress
  const activeStatuses = ['processing', 'scraping', 'scraping_retry', 'analyzing'];
  const hasActiveAudit = activeAudit && activeStatuses.includes(activeAudit.status);

  // Already has active audit - show progress and redirect to profile
  if (hasActiveAudit && activeAudit) {
    const statusMessages: Record<string, string> = {
      'processing': 'Przetwarzanie...',
      'scraping': 'Pobieranie danych z Booksy...',
      'scraping_retry': 'Ponowna próba pobierania danych...',
      'analyzing': 'AI analizuje Twój cennik...',
    };

    const progress = activeAudit.progress ?? 0;
    const statusMessage = activeAudit.progressMessage || statusMessages[activeAudit.status] || 'Przetwarzanie...';

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-slate-900 mb-4">
            Audyt w trakcie realizacji
          </h1>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#D4A574] to-[#B8860B] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-slate-500 mt-2">{progress}% ukończono</p>
          </div>

          <p className="text-slate-600 mb-8">
            {statusMessage}
          </p>
          <button
            onClick={() => navigate('/profile')}
            className="px-6 py-3 bg-gradient-to-r from-[#D4A574] to-[#B8860B] text-white rounded-xl hover:shadow-lg transition-all"
          >
            Zobacz status w profilu
          </button>
        </div>
      </div>
    );
  }

  // No pending audit AND no credits - need to buy
  if (!hasPendingAudit && !hasCredits) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Crown className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-slate-900 mb-4">
            Brak kredytów
          </h1>
          <p className="text-slate-600 mb-8">
            Aby rozpocząć audyt, musisz najpierw kupić pakiet audytu.
          </p>
          <button
            onClick={() => navigate('/audit')}
            className="px-6 py-3 bg-gradient-to-r from-[#D4A574] to-[#B8860B] text-white rounded-xl hover:shadow-lg transition-all"
          >
            Kup audyt
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate Booksy URL
    if (!booksyUrl.includes('booksy.com')) {
      setError('Podaj prawidłowy link do profilu Booksy');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // If user has pending audit, start it. Otherwise create new audit from credits.
      if (hasPendingAudit && activeAudit) {
        await startAudit({ auditId: activeAudit._id, sourceUrl: booksyUrl });
      } else {
        await startNewAudit({ sourceUrl: booksyUrl });
      }

      setIsSubmitted(true);

      // Confetti burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err: any) {
      console.error('Start audit error:', err);
      setError(err.message || 'Wystąpił błąd podczas rozpoczynania audytu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="overflow-x-hidden">
      <HeroHighlight
        containerClassName="relative py-12 md:py-16 min-h-screen flex items-center bg-gradient-to-b from-slate-50 to-white"
        dotColor="rgba(212, 165, 116, 0.12)"
        dotColorHighlight="rgba(212, 165, 116, 0.8)"
      >
        <div className="relative max-w-7xl mx-auto w-full px-4">
          {!isSubmitted ? (
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">

              {/* Left: Copy */}
              <div className="text-center lg:text-left">
                <BlurFade delay={0.1} inView>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4A574]/10 rounded-full border border-[#D4A574]/30 mb-6">
                    <Crown size={16} className="text-[#D4A574]" />
                    <span className="text-sm font-medium text-[#D4A574]">
                      {hasPendingAudit
                        ? 'Audyt gotowy do rozpoczęcia'
                        : `Masz ${user.credits} ${user.credits === 1 ? 'kredyt' : 'kredyty'}`
                      }
                    </span>
                  </div>
                </BlurFade>

                <BlurFade delay={0.2} inView>
                  <h1 className="text-5xl md:text-5xl lg:text-[3.5rem] font-serif font-bold text-slate-900 mb-6 leading-[1.1]">
                    Rozpocznij{' '}
                    <br className="hidden sm:block" />
                    <AuroraText colors={["#D4A574", "#C9956C", "#E8C4A0", "#B8860B"]}>
                      audyt AI
                    </AuroraText>
                    {' '}<span className="inline-block">✨</span>
                  </h1>
                </BlurFade>

                <BlurFade delay={0.3} inView>
                  <p className="text-lg text-slate-600 mb-10 max-w-xl mx-auto lg:mx-0">
                    Podaj link do swojego profilu Booksy, a nasza sztuczna inteligencja
                    przeprowadzi rygorystyczną analizę i przygotuje szczegółowy raport.
                  </p>
                </BlurFade>

                {/* What happens next */}
                <BlurFade delay={0.4} inView>
                  <div className="space-y-4">
                    <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Co dalej?</p>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 justify-center lg:justify-start">
                        <div className="w-8 h-8 rounded-full bg-[#D4A574]/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-[#D4A574]">1</span>
                        </div>
                        <p className="text-slate-600">Podaj link do profilu Booksy</p>
                      </div>

                      <div className="flex items-center gap-3 justify-center lg:justify-start">
                        <div className="w-8 h-8 rounded-full bg-[#D4A574]/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-[#D4A574]">2</span>
                        </div>
                        <p className="text-slate-600">Rygorystycznie przeanalizujemy każdy element</p>
                      </div>

                      <div className="flex items-center gap-3 justify-center lg:justify-start">
                        <div className="w-8 h-8 rounded-full bg-[#D4A574]/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-[#D4A574]">3</span>
                        </div>
                        <p className="text-slate-600">Otrzymasz szczegółowy raport PDF na email</p>
                      </div>
                    </div>
                  </div>
                </BlurFade>
              </div>

              {/* Right: Form */}
              <BlurFade delay={0.3} inView>
                <div className="relative mt-8 lg:mt-0">
                  {/* Booksy logo above box */}
                  <img
                    src="/booksy-logo.png"
                    alt="Booksy"
                    className="h-8 mx-auto mb-6"
                  />

                  <div className="relative rounded-3xl">
                    {/* Animated Shine Border */}
                    <ShineBorder
                      borderWidth={3}
                      duration={8}
                      shineColor={["#D4A574", "#B8860B", "#E8C4A0"]}
                      className="rounded-3xl"
                    />

                    <div className="bg-white/90 backdrop-blur-sm p-8 md:p-10 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
                      <div className="text-center mb-8">
                        <h3 className="text-2xl font-serif font-bold text-slate-900 mb-2">
                          Podaj link do profilu
                        </h3>
                        <p className="text-slate-500">
                          Znajdziesz go w aplikacji Booksy lub na booksy.com
                        </p>
                      </div>

                      <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                          <label htmlFor="booksyUrl" className="block text-sm font-medium text-slate-700 mb-2">
                            Link do profilu Booksy
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <Link2 className="w-5 h-5 text-[#D4A574]" />
                            </div>
                            <input
                              type="url"
                              id="booksyUrl"
                              value={booksyUrl}
                              onChange={(e) => setBooksyUrl(e.target.value)}
                              placeholder="https://booksy.com/pl-pl/..."
                              className="w-full pl-12 pr-4 py-4 bg-slate-50/80 border-2 border-slate-200 rounded-2xl focus:ring-0 focus:border-[#D4A574] focus:bg-white outline-none transition-all text-slate-800 placeholder:text-slate-400"
                              required
                            />
                          </div>
                          {error && (
                            <p className="mt-2 text-sm text-red-600">{error}</p>
                          )}
                        </div>

                        <div className="bg-gradient-to-r from-[#D4A574]/10 to-[#B8860B]/10 rounded-xl p-4 mb-6 border border-[#D4A574]/20">
                          <div className="flex items-start gap-3">
                            <Clock className="w-5 h-5 text-[#D4A574] mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-slate-700">Czas realizacji: do 90 minut</p>
                              <p className="text-xs text-slate-500 mt-1">
                                Raport PDF wyślemy na Twój adres email.
                              </p>
                            </div>
                          </div>
                        </div>

                        <RainbowButton
                          type="submit"
                          disabled={isSubmitting || !booksyUrl}
                          className="w-full text-lg"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Rozpoczynam...
                            </>
                          ) : (
                            <>
                              Rozpocznij audyt
                              <ArrowRight className="w-5 h-5" />
                            </>
                          )}
                        </RainbowButton>
                      </form>

                      {/* Trust badges */}
                      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
                        <div className="flex items-center gap-1">
                          <Sparkles size={12} className="text-[#D4A574]" />
                          Bezpieczne dane
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={12} className="text-[#D4A574]" />
                          Raport do 90 min
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </BlurFade>
            </div>
          ) : (
            /* After submission - confirmation */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto text-center"
            >
              <div className="bg-white/90 backdrop-blur-sm p-12 rounded-3xl border border-slate-100 shadow-xl">
                <div className="w-20 h-20 bg-gradient-to-br from-[#D4A574] to-[#B8860B] rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-[#D4A574]/20">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>

                <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4">
                  Gotowe! Audyt w przygotowaniu
                </h2>

                <p className="text-lg text-slate-600 mb-8">
                  Rygorystycznie analizujemy Twój profil.
                  <br />
                  Raport PDF otrzymasz na email <span className="font-medium text-[#D4A574]">w ciągu maksymalnie 90 minut</span>.
                </p>

                <div className="inline-flex items-center gap-3 px-6 py-3 bg-[#D4A574]/10 rounded-full text-slate-700 border border-[#D4A574]/20">
                  <div className="w-3 h-3 bg-[#D4A574] rounded-full animate-pulse" />
                  <span className="font-medium">Audyt w trakcie realizacji</span>
                </div>

                <div className="mt-10 pt-8 border-t border-slate-100">
                  <p className="text-sm text-slate-500 mb-4">Sprawdź status w profilu</p>
                  <button
                    onClick={() => navigate('/profile')}
                    className="text-[#D4A574] font-medium hover:text-[#B8860B] transition-colors"
                  >
                    Przejdź do profilu →
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </HeroHighlight>
    </div>
  );
};

export default StartAuditPage;
