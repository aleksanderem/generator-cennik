"use client";
import React, { useState } from 'react';
import { SignInButton, useUser, useAuth } from '@clerk/clerk-react';
import { useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Crown, Check, Loader2, Sparkles, Clock } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '../../lib/utils';

type ProductType = 'audit' | 'audit_consultation';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProduct?: ProductType;
}

const PRODUCTS = {
  audit: {
    title: 'Audyt Profilu Booksy',
    description: 'Kompleksowa analiza 60+ punktów Twojego profilu z konkretnymi rekomendacjami',
    price: 79.90,
    originalPrice: 149.99,
    savings: 70,
    icon: Sparkles,
    benefits: [
      'Szczegółowy raport PDF (15-25 stron)',
      'Analiza 60+ elementów profilu',
      'Konkretne rekomendacje do wdrożenia',
      'Gotowy, zoptymalizowany cennik HTML',
      '30 dni gwarancji zwrotu',
    ],
    color: '#D4A574',
    popular: false,
  },
  audit_consultation: {
    title: 'Audyt + Konsultacja',
    description: 'Pełny audyt plus 2h konsultacji z ekspertem beauty marketingu',
    price: 240,
    originalPrice: 400,
    savings: 160,
    icon: Crown,
    benefits: [
      'Wszystko z audytu podstawowego',
      'Do 2h konsultacji z ekspertem',
      'Omówienie wyników i strategii',
      'Pomoc we wdrożeniu zmian',
      'Priorytetowe wsparcie',
    ],
    color: '#B8860B',
    popular: true,
  },
} as const;

const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  defaultProduct = 'audit',
}) => {
  const { isSignedIn } = useUser();
  const { isLoaded: isAuthLoaded } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState<ProductType>(defaultProduct);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCheckout = useAction(api.stripe.createCheckoutSession);

  const product = PRODUCTS[selectedProduct];

  const handlePurchase = async () => {
    if (!isSignedIn || !isAuthLoaded) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await createCheckout({
        product: selectedProduct,
        successUrl: `${window.location.origin}/success`,
        cancelUrl: window.location.href,
      });

      if (result.url) {
        window.location.href = result.url;
      } else {
        throw new Error('Nie udało się utworzyć sesji płatności');
      }
    } catch (err: unknown) {
      console.error('Checkout error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Wystąpił błąd. Spróbuj ponownie.';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, backdropFilter: "blur(10px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          className="fixed inset-0 h-full w-full flex items-center justify-center z-[100] p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/70"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotateX: 40, y: 40 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotateX: 10 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-50"
            style={{ perspective: '800px', transformStyle: 'preserve-3d' }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all z-10 group"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="group-hover:scale-110 group-hover:rotate-3 transition-transform duration-200"
              >
                <path d="M18 6l-12 12" />
                <path d="M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="p-6 pb-0 text-center">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-[#D4A574]/20 to-[#B8860B]/20 rounded-full text-sm font-semibold text-[#8B6914] mb-4 border border-[#D4A574]/30"
              >
                <Sparkles size={14} className="text-[#D4A574]" />
                Promocja do końca roku
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-2xl md:text-3xl font-serif font-bold text-slate-900 mb-2"
              >
                Wybierz swój pakiet
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-slate-500"
              >
                Zwiększ rezerwacje nawet o 50% dzięki profesjonalnemu audytowi
              </motion.p>
            </div>

            {/* Product Cards */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {(Object.keys(PRODUCTS) as ProductType[]).map((key, index) => {
                  const p = PRODUCTS[key];
                  const isSelected = selectedProduct === key;
                  return (
                    <motion.button
                      key={key}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      onClick={() => setSelectedProduct(key)}
                      className={cn(
                        "relative p-5 rounded-2xl border-2 text-left transition-all duration-300",
                        isSelected
                          ? "border-[#D4A574] bg-gradient-to-br from-[#D4A574]/5 to-[#B8860B]/5 shadow-lg shadow-[#D4A574]/10"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                      )}
                    >
                      {/* Popular badge */}
                      {p.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="bg-gradient-to-r from-[#D4A574] to-[#B8860B] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg uppercase tracking-wide">
                            Najpopularniejszy
                          </span>
                        </div>
                      )}

                      {/* Selection indicator */}
                      <div className={cn(
                        "absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                        isSelected
                          ? "border-[#D4A574] bg-[#D4A574]"
                          : "border-slate-300"
                      )}>
                        {isSelected && <Check size={12} className="text-white" />}
                      </div>

                      {/* Icon & Title */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                        style={{ backgroundColor: `${p.color}20` }}
                      >
                        <p.icon size={20} style={{ color: p.color }} />
                      </div>

                      <h3 className="font-bold text-slate-900 mb-1 pr-6">{p.title}</h3>
                      <p className="text-xs text-slate-500 mb-3 leading-relaxed">{p.description}</p>

                      {/* Price */}
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-900">
                          {p.price.toFixed(2).replace('.', ',')} zł
                        </span>
                        <span className="text-sm text-slate-400 line-through">
                          {p.originalPrice.toFixed(2).replace('.', ',')} zł
                        </span>
                      </div>
                      <div className="mt-1">
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          Oszczędzasz {p.savings} zł
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Benefits */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-slate-50 rounded-2xl p-5 mb-6"
              >
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <product.icon size={16} style={{ color: product.color }} />
                  Co zawiera {product.title}:
                </h4>
                <ul className="space-y-2">
                  {product.benefits.map((benefit, idx) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.45 + idx * 0.05 }}
                      className="flex items-start gap-2"
                    >
                      <div
                        className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${product.color}20` }}
                      >
                        <Check size={10} style={{ color: product.color }} />
                      </div>
                      <span className="text-sm text-slate-700">{benefit}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>

              {/* Consultation note for audit_consultation */}
              {selectedProduct === 'audit_consultation' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 p-4 bg-[#D4A574]/10 rounded-xl mb-6 border border-[#D4A574]/20"
                >
                  <Clock size={18} className="text-[#D4A574] flex-shrink-0" />
                  <p className="text-sm text-slate-700">
                    <span className="font-medium">Konsultację</span> możesz też dokupić osobno później za 220 zł (w promocji) lub 280 zł (cena regularna).
                  </p>
                </motion.div>
              )}

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100"
                >
                  {error}
                </motion.div>
              )}

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {!isSignedIn ? (
                  <SignInButton mode="modal">
                    <button className="w-full py-4 px-6 text-white font-semibold rounded-xl transition-all bg-gradient-to-r from-[#D4A574] to-[#B8860B] hover:shadow-lg hover:shadow-[#D4A574]/25 hover:-translate-y-0.5">
                      Zaloguj się, aby kupić
                    </button>
                  </SignInButton>
                ) : (
                  <button
                    onClick={handlePurchase}
                    disabled={isLoading}
                    className="w-full py-4 px-6 text-white font-semibold rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed bg-gradient-to-r from-[#D4A574] to-[#B8860B] hover:shadow-lg hover:shadow-[#D4A574]/25 hover:-translate-y-0.5"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 size={18} className="animate-spin" />
                        Przekierowuję do płatności...
                      </span>
                    ) : (
                      `Kup za ${product.price.toFixed(2).replace('.', ',')} zł`
                    )}
                  </button>
                )}
              </motion.div>

              {/* Trust badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400"
              >
                <div className="flex items-center gap-1">
                  <Check size={12} className="text-emerald-500" />
                  Bezpieczna płatność Stripe
                </div>
                <div className="flex items-center gap-1">
                  <Check size={12} className="text-emerald-500" />
                  BLIK, karty, przelewy
                </div>
                <div className="flex items-center gap-1">
                  <Check size={12} className="text-emerald-500" />
                  Faktura VAT
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PaywallModal;
