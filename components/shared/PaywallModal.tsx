import React, { useState } from 'react';
import { SignInButton, useUser } from '@clerk/clerk-react';
import { useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { X, Crown, Check, Loader2, Sparkles, Zap } from 'lucide-react';

type ProductType = 'audit' | 'optimize' | 'combo';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProduct?: ProductType;
}

const PRODUCTS = {
  audit: {
    title: 'Audyt AI Cennika',
    description: 'Pełna analiza Twojego cennika z Booksy z eksperckimi rekomendacjami',
    price: 49,
    icon: Sparkles,
    benefits: [
      'Szczegółowy raport z oceną 0-100',
      'Analiza mocnych i słabych stron',
      'Konkretne rekomendacje zmian',
      'Porównanie przed/po',
    ],
    color: '#B76E79',
  },
  optimize: {
    title: 'AI Optymalizacja',
    description: 'Przepisz swój cennik z pomocą sztucznej inteligencji',
    price: 29,
    icon: Zap,
    benefits: [
      'Lepsze opisy usług (język korzyści)',
      'Optymalna struktura kategorii',
      'Sugestie cenowe',
      'Gotowy kod HTML do wklejenia',
    ],
    color: '#D4AF37',
  },
  combo: {
    title: 'Pakiet Combo',
    description: 'Audyt + Optymalizacja w jednym',
    price: 69,
    icon: Crown,
    originalPrice: 78,
    benefits: [
      'Pełny audyt cennika',
      'AI optymalizacja treści',
      'Oszczędzasz 9 zł',
      'Najlepsza wartość',
    ],
    color: '#722F37',
  },
} as const;

const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  defaultProduct = 'audit',
}) => {
  const { isSignedIn } = useUser();
  const [selectedProduct, setSelectedProduct] = useState<ProductType>(defaultProduct);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCheckout = useAction(api.stripe.createCheckoutSession);

  const product = PRODUCTS[selectedProduct];

  const handlePurchase = async () => {
    if (!isSignedIn) return;

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
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Wystąpił błąd. Spróbuj ponownie.');
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/70"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 fade-in duration-200">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* Premium badge */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-gradient-to-r from-[#B76E79] to-[#D4AF37] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
            PREMIUM
          </span>
        </div>

        <div className="p-6 pt-8">

          {/* Product Tabs */}
          <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-lg">
            {(Object.keys(PRODUCTS) as ProductType[]).map((key) => {
              const p = PRODUCTS[key];
              return (
                <button
                  key={key}
                  onClick={() => setSelectedProduct(key)}
                  className={`
                    flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all
                    ${selectedProduct === key
                      ? 'bg-white shadow-sm text-slate-900'
                      : 'text-slate-500 hover:text-slate-700'
                    }
                  `}
                >
                  {key === 'combo' ? 'Combo' : key === 'audit' ? 'Audyt' : 'Optimize'}
                </button>
              );
            })}
          </div>

          {/* Product Details */}
          <div className="text-center mb-6">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
              style={{ backgroundColor: `${product.color}20` }}
            >
              <product.icon size={28} style={{ color: product.color }} />
            </div>

            <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">
              {product.title}
            </h2>
            <p className="text-slate-600">{product.description}</p>
          </div>

          {/* Benefits */}
          <ul className="space-y-3 mb-6">
            {product.benefits.map((benefit, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div
                  className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${product.color}20` }}
                >
                  <Check size={12} style={{ color: product.color }} />
                </div>
                <span className="text-slate-700">{benefit}</span>
              </li>
            ))}
          </ul>

          {/* Price */}
          <div className="border-t border-slate-100 pt-4 mb-4">
            <div className="flex items-baseline justify-center gap-2">
              {'originalPrice' in product && (
                <span className="text-lg text-slate-400 line-through">
                  {product.originalPrice} zł
                </span>
              )}
              <span className="text-4xl font-bold text-slate-900">
                {product.price} zł
              </span>
              <span className="text-slate-500">jednorazowo</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          {/* CTA Button */}
          {!isSignedIn ? (
            <SignInButton mode="modal">
              <button className="w-full py-3.5 px-6 text-white font-semibold rounded-xl transition-all bg-[#722F37] hover:bg-[#5a252c]">
                Zaloguj się, aby kupić
              </button>
            </SignInButton>
          ) : (
            <button
              onClick={handlePurchase}
              disabled={isLoading}
              className="w-full py-3.5 px-6 text-white font-semibold rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              style={{
                background: `linear-gradient(135deg, ${product.color} 0%, #D4AF37 100%)`,
              }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  Przekierowuję do płatności...
                </span>
              ) : (
                `Kup za ${product.price} zł`
              )}
            </button>
          )}

          {/* Trust badges */}
          <p className="text-xs text-center text-slate-400 mt-4">
            Bezpieczna płatność przez Stripe. Akceptujemy karty, BLIK i Przelewy24.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaywallModal;
