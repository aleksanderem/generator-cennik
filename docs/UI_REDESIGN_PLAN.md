# Plan Modyfikacji UI - Beauty Audit Generator

Data utworzenia: 2025-12-09
Ostatnia aktualizacja: 2025-12-09
Sesja: S0003

---

## Cel Biznesowy

Aplikacja SaaS dla branży beauty z modelem freemium:
- **Darmowe**: Generator cennika (wklejanie tekstu → HTML)
- **Płatne**: Audyt cennika z URL (Booksy) + AI Optymalizacja cennika
- **Monetyzacja**: Stripe (jednorazowe płatności lub pakiety)
- **Dystrybucja**: Kampania reklamowa (prawdopodobnie Meta Ads / Google Ads)

---

## Model Biznesowy: Freemium + Upgrade

### Funkcje DARMOWE (bez logowania):
| Funkcja | Opis | Limit |
|---------|------|-------|
| Generator Cennika | Wklej tekst → AI parsuje → HTML cennik | Bez limitu |
| Podgląd na żywo | Konfiguracja kolorów i fontów | Bez limitu |
| Eksport kodu HTML | Kopiowanie gotowego kodu | Bez limitu |

### Funkcje PREMIUM (wymagają konta + płatności):
| Funkcja | Opis | Cena sugerowana |
|---------|------|-----------------|
| Audyt Cennika | Import z URL Booksy → pełny raport AI | 49-79 zł / audyt |
| AI Optymalizacja | Przepisanie cennika przez AI (lepsze opisy, struktura) | 29-49 zł / optymalizacja |
| Pakiet Combo | Audyt + Optymalizacja razem | 69-99 zł |

### User Journey (Kampania reklamowa):

```
[Reklama: "Czy Twój cennik sprzedaje?"]
           ↓
[Landing Page z demo generatora]
           ↓
[Użytkownik testuje DARMOWY generator]
           ↓
[Widzi opcję "Audyt AI" lub "Optymalizuj" → PREMIUM]
           ↓
[Klikając → Paywall z opcją rejestracji]
           ↓
[Rejestracja → Płatność Stripe → Odblokowanie]
           ↓
[Dostęp do funkcji premium]
```

---

## Architektura Aplikacji (Zaktualizowana)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           HEADER (zawsze widoczny)                       │
│  [Logo]                    [Nawigacja]            [Login/Signup] [Avatar]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                           MAIN CONTENT                                   │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                                                                  │   │
│   │   Widok zależny od stanu:                                       │   │
│   │   - Landing/Home (dla niezalogowanych)                          │   │
│   │   - Dashboard (dla zalogowanych)                                │   │
│   │   - Generator (darmowy)                                         │   │
│   │   - Audyt (premium - paywall)                                   │   │
│   │   - Ustawienia konta                                            │   │
│   │                                                                  │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                           FOOTER                                         │
│  [Polityka prywatności] [Regulamin] [Kontakt] [© 2024 Alex M.]          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Zmiana: Sidebar → Top Navigation

Dla aplikacji SaaS kierowanej do szerokiej publiczności (kampania reklamowa) lepszym wyborem jest:
- **Top navigation** - bardziej intuicyjny dla nowych użytkowników
- **Sidebar opcjonalny** - tylko w Dashboard dla zalogowanych (historia, ustawienia)

---

## System Użytkowników (Convex + Clerk lub Custom Auth)

### Opcja A: Clerk (Rekomendowana - szybsza implementacja)
- Gotowe komponenty UI (SignIn, SignUp, UserButton)
- Integracja z Convex przez `@clerk/clerk-react`
- Social login (Google, Facebook) out of the box
- Webhook do Convex przy nowym userze

### Opcja B: Custom Auth z Convex
- Email + hasło (bcrypt)
- Magic link przez Resend/SendGrid
- Więcej pracy, ale pełna kontrola

### Schemat Bazy Danych (Convex):

```typescript
// convex/schema.ts

// Użytkownicy (synchronizowane z Clerk lub custom)
users: defineTable({
  clerkId: v.string(),           // lub oddzielne pola dla custom auth
  email: v.string(),
  name: v.optional(v.string()),
  avatarUrl: v.optional(v.string()),
  createdAt: v.number(),

  // Stripe
  stripeCustomerId: v.optional(v.string()),

  // Limity i kredyty
  freeAuditsUsed: v.number(),    // ile darmowych audytów wykorzystał (jeśli dajesz trial)
  credits: v.number(),           // zakupione kredyty
})
  .index("by_clerk_id", ["clerkId"])
  .index("by_email", ["email"])
  .index("by_stripe", ["stripeCustomerId"]),

// Zakupy / Transakcje
purchases: defineTable({
  userId: v.id("users"),
  stripePaymentIntentId: v.string(),
  stripeSessionId: v.optional(v.string()),

  product: v.union(
    v.literal("audit"),
    v.literal("optimize"),
    v.literal("combo")
  ),

  amount: v.number(),            // w groszach (PLN)
  currency: v.string(),          // "pln"
  status: v.union(
    v.literal("pending"),
    v.literal("completed"),
    v.literal("failed"),
    v.literal("refunded")
  ),

  createdAt: v.number(),
  completedAt: v.optional(v.number()),
})
  .index("by_user", ["userId"])
  .index("by_stripe_session", ["stripeSessionId"]),

// Audyty (historia)
audits: defineTable({
  userId: v.id("users"),
  purchaseId: v.optional(v.id("purchases")),  // powiązanie z płatnością

  sourceUrl: v.string(),         // URL Booksy
  sourceType: v.union(v.literal("booksy"), v.literal("manual")),

  // Wyniki audytu
  overallScore: v.number(),
  rawData: v.string(),           // surowe dane
  reportJson: v.string(),        // pełny raport jako JSON

  createdAt: v.number(),
})
  .index("by_user", ["userId"]),

// Optymalizacje
optimizations: defineTable({
  userId: v.id("users"),
  purchaseId: v.optional(v.id("purchases")),
  auditId: v.optional(v.id("audits")),  // jeśli combo

  originalData: v.string(),
  optimizedData: v.string(),

  createdAt: v.number(),
})
  .index("by_user", ["userId"]),
```

---

## Integracja Stripe

### Produkty w Stripe Dashboard:
```
┌─────────────────────────────────────────────┐
│ Product: "Audyt Cennika"                    │
│ Price: 4900 PLN (49.00 zł) - one-time       │
│ Price ID: price_audit_xxx                   │
├─────────────────────────────────────────────┤
│ Product: "AI Optymalizacja"                 │
│ Price: 2900 PLN (29.00 zł) - one-time       │
│ Price ID: price_optimize_xxx                │
├─────────────────────────────────────────────┤
│ Product: "Pakiet Combo"                     │
│ Price: 6900 PLN (69.00 zł) - one-time       │
│ Price ID: price_combo_xxx                   │
└─────────────────────────────────────────────┘
```

### Flow Płatności:

```
[User klika "Kup Audyt"]
         ↓
[Frontend: wywołuje mutation createCheckoutSession]
         ↓
[Convex Action: tworzy Stripe Checkout Session]
         ↓
[Redirect do Stripe Checkout]
         ↓
[User płaci kartą/BLIK/przelewy24]
         ↓
[Stripe Webhook → Convex HTTP endpoint]
         ↓
[Convex: aktualizuje purchase.status = "completed"]
         ↓
[Convex: dodaje kredyt lub odblokuje funkcję]
         ↓
[User wraca do aplikacji → widzi odblokowaną funkcję]
```

### Przykładowy kod Convex:

```typescript
// convex/stripe.ts
"use node";

import { v } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const createCheckoutSession = action({
  args: {
    product: v.union(v.literal("audit"), v.literal("optimize"), v.literal("combo")),
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Musisz być zalogowany");

    const priceIds = {
      audit: process.env.STRIPE_PRICE_AUDIT!,
      optimize: process.env.STRIPE_PRICE_OPTIMIZE!,
      combo: process.env.STRIPE_PRICE_COMBO!,
    };

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "p24", "blik"],
      line_items: [{ price: priceIds[args.product], quantity: 1 }],
      mode: "payment",
      success_url: args.successUrl,
      cancel_url: args.cancelUrl,
      client_reference_id: identity.subject, // clerkId
      metadata: { product: args.product },
    });

    // Zapisz pending purchase
    await ctx.runMutation(internal.stripe.createPendingPurchase, {
      clerkId: identity.subject,
      stripeSessionId: session.id,
      product: args.product,
    });

    return { url: session.url };
  },
});

// HTTP endpoint dla webhooków Stripe
// convex/http.ts
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
  path: "/stripe-webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const signature = req.headers.get("stripe-signature")!;
    const body = await req.text();

    // Weryfikacja podpisu Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      await ctx.runMutation(internal.stripe.completePurchase, {
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent as string,
      });
    }

    return new Response("OK", { status: 200 });
  }),
});

export default http;
```

---

## UI: Paywall / Premium Gate

### Komponent PaywallModal:

```tsx
// components/PaywallModal.tsx

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: 'audit' | 'optimize';
}

const PaywallModal: React.FC<PaywallModalProps> = ({ isOpen, onClose, feature }) => {
  const { isSignedIn } = useUser(); // Clerk
  const createCheckout = useMutation(api.stripe.createCheckoutSession);

  const featureDetails = {
    audit: {
      title: "Odblokuj Audyt AI",
      description: "Pełna analiza Twojego cennika z Booksy z rekomendacjami ekspertów",
      price: "49 zł",
      benefits: [
        "Szczegółowy raport z oceną 0-100",
        "Analiza mocnych i słabych stron",
        "Konkretne rekomendacje zmian",
        "Porównanie przed/po",
      ],
    },
    optimize: {
      title: "AI Optymalizacja",
      description: "Przepisz swój cennik z pomocą sztucznej inteligencji",
      price: "29 zł",
      benefits: [
        "Lepsze opisy usług (język korzyści)",
        "Optymalna struktura kategorii",
        "Sugestie cenowe (benchmarking)",
        "Gotowy kod HTML do wklejenia",
      ],
    },
  };

  const details = featureDetails[feature];

  const handlePurchase = async () => {
    if (!isSignedIn) {
      // Redirect do logowania
      return;
    }

    const { url } = await createCheckout({
      product: feature,
      successUrl: `${window.location.origin}/success?product=${feature}`,
      cancelUrl: window.location.href,
    });

    window.location.href = url!;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        {/* Premium badge */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-gradient-to-r from-[#B76E79] to-[#D4AF37] text-white text-xs font-bold px-4 py-1 rounded-full">
            PREMIUM
          </span>
        </div>

        <div className="text-center pt-4">
          <Crown className="w-12 h-12 mx-auto text-[#D4AF37] mb-4" />
          <h2 className="text-2xl font-serif font-bold text-slate-900">
            {details.title}
          </h2>
          <p className="text-slate-600 mt-2">{details.description}</p>
        </div>

        <ul className="space-y-3 my-6">
          {details.benefits.map((benefit, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-slate-700">{benefit}</span>
            </li>
          ))}
        </ul>

        <div className="border-t pt-4">
          <div className="flex items-baseline justify-center gap-2 mb-4">
            <span className="text-4xl font-bold text-slate-900">{details.price}</span>
            <span className="text-slate-500">jednorazowo</span>
          </div>

          {!isSignedIn ? (
            <SignInButton mode="modal">
              <Button className="w-full bg-[#722F37] hover:bg-[#5a252c]">
                Zaloguj się, aby kupić
              </Button>
            </SignInButton>
          ) : (
            <Button
              onClick={handlePurchase}
              className="w-full bg-gradient-to-r from-[#B76E79] to-[#D4AF37] hover:opacity-90"
            >
              Kup teraz
            </Button>
          )}

          <p className="text-xs text-center text-slate-400 mt-3">
            Bezpieczna płatność przez Stripe. Akceptujemy karty, BLIK i Przelewy24.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

---

## Nawigacja (Zaktualizowana)

### Dla niezalogowanych użytkowników:
```
[Logo] ────── [Generator (FREE)] [Audyt ✨] [Cennik] ────── [Zaloguj] [Zarejestruj]
```

### Dla zalogowanych użytkowników:
```
[Logo] ────── [Generator] [Audyt ✨] [Historia] [Ustawienia] ────── [Avatar ▼]
                                                                    └─ Moje konto
                                                                    └─ Moje zakupy
                                                                    └─ Wyloguj
```

### Oznaczenia w nawigacji:
- ✨ sparkle icon = funkcja premium
- Jeśli user ma kredyty → pokazuj "(3 kredyty)"
- Jeśli nie ma kredytów → pokazuj badge "Premium"

---

## Strony / Widoki Aplikacji

### 1. Landing Page (/)
- Hero section z wartością produktu
- Demo generatora (interaktywne)
- Sekcja "Jak to działa"
- Cennik (darmowe vs premium)
- Social proof / testimoniale
- CTA: "Wypróbuj za darmo"

### 2. Generator (/generator)
- Darmowy dla wszystkich
- Bez zmian względem obecnej funkcjonalności
- Po wygenerowaniu → upsell do Audytu/Optymalizacji

### 3. Audyt (/audit)
- Wymaga logowania
- Wymaga zakupu lub kredytu
- Flow: URL input → paywall (jeśli brak kredytu) → TerminalLoader → AuditResults

### 4. Dashboard (/dashboard) - tylko zalogowani
- Podsumowanie: ile kredytów, ostatnie audyty
- Szybkie akcje
- Historia

### 5. Ustawienia (/settings) - tylko zalogowani
- Profil (email, nazwa)
- Historia zakupów
- Zarządzanie subskrypcją (jeśli dodasz w przyszłości)

### 6. Success Page (/success)
- Po udanej płatności
- Potwierdzenie zakupu
- CTA: "Przejdź do [Audytu/Optymalizacji]"

---

## Checklist Implementacji (Zaktualizowana)

### Faza 0: Setup infrastruktury
- [ ] Konfiguracja Clerk (lub custom auth)
- [ ] Konfiguracja Stripe (produkty, ceny, webhook)
- [ ] Schema Convex (users, purchases, audits)
- [ ] Middleware auth w Convex

### Faza 1: Auth + Landing
- [ ] Integracja Clerk z aplikacją
- [ ] Komponenty SignIn/SignUp
- [ ] Landing page z hero i demo
- [ ] Top navigation z auth state

### Faza 2: Paywall + Stripe
- [ ] Komponent PaywallModal
- [ ] Stripe Checkout integration
- [ ] Webhook handler w Convex
- [ ] Success/Cancel pages

### Faza 3: Premium Features
- [ ] Gating Audytu za paywall
- [ ] Gating AI Optymalizacji za paywall
- [ ] System kredytów (sprawdzanie/odejmowanie)
- [ ] Historia zakupów

### Faza 4: Dashboard
- [ ] Strona Dashboard
- [ ] Historia audytów
- [ ] Ustawienia konta

### Faza 5: Styling Premium
- [ ] Paleta kolorów Premium/Luxury
- [ ] Komponenty UI (GoldButton, Card)
- [ ] Animacje i micro-interactions

### Faza 6: Polish & Launch
- [ ] Responsywność (mobile)
- [ ] SEO meta tags
- [ ] Analytics (Plausible/PostHog)
- [ ] Error handling
- [ ] Testing

---

## Paleta Kolorów (Premium/Luxury)

```css
:root {
  /* Akcenty */
  --color-rose-gold: #B76E79;
  --color-champagne: #F7E7CE;
  --color-gold-shimmer: #D4AF37;

  /* Tła */
  --color-burgundy: #722F37;
  --color-slate-dark: #0f172a;
  --color-cream: #FDFCFB;
  --color-ivory: #FFFFF0;

  /* Teksty */
  --color-charcoal: #2D2D2D;
  --color-warm-gray: #4A4A4A;

  /* Premium gradient */
  --gradient-gold: linear-gradient(135deg, #B76E79 0%, #D4AF37 100%);

  /* Shadows */
  --shadow-premium: 0 20px 40px rgba(114, 47, 55, 0.15);
}
```

---

## Typografia

### Nagłówki:
- Font: `Playfair Display`
- Weight: 600-700

### Body:
- Font: `Inter`
- Weight: 400-500

### Dekoracyjne:
- Font: Handwriting (dla "by Alex M.")

---

## Zmiana Podejścia: Sidebar → Top Nav

Dla aplikacji SaaS kierowanej do nowych użytkowników z kampanii reklamowej:

**Zalety Top Navigation:**
- Bardziej znajomy wzorzec (użytkownicy znają z innych stron)
- Mniej "aplikacyjny", bardziej "stronowy" - lepsze dla landing page
- Łatwiejsze na mobile (hamburger menu)
- CTA (Login/Signup) widoczne od razu

**Sidebar - kiedy ma sens:**
- Aplikacje z wieloma sekcjami (10+)
- Power users, częste użycie
- Dashboardy z dużą ilością danych

Dla Twojego przypadku rekomenduję: **Top Nav + opcjonalny sidebar w Dashboard**.

---

## Notatki Techniczne

### Stack:
- React + TypeScript
- Convex (backend + baza danych)
- Clerk (auth) lub custom
- Stripe (płatności)
- Tailwind CSS (styling)
- Lucide React (ikony)

### Środowisko:
- Development: localhost + Convex dev
- Stripe: Test mode → Live mode przy launch
- Domain: potrzebujesz własnej domeny dla Stripe webhooks

### Koszty:
- Convex: Free tier powinien wystarczyć na start
- Clerk: Free do 10k MAU
- Stripe: 1.4% + 0.25€ per transaction (EU)
- Gemini API: rozliczane per token

---

## Przykładowa Struktura Plików (Docelowa)

```
src/
├── app/                          # lub pages/ jeśli używasz routing
│   ├── layout.tsx                # główny layout z nav
│   ├── page.tsx                  # landing page
│   ├── generator/
│   │   └── page.tsx
│   ├── audit/
│   │   └── page.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   ├── settings/
│   │   └── page.tsx
│   └── success/
│       └── page.tsx
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── MobileNav.tsx
│   ├── features/
│   │   ├── generator/
│   │   │   ├── InputSection.tsx
│   │   │   └── PreviewSection.tsx
│   │   ├── audit/
│   │   │   ├── UrlInput.tsx
│   │   │   └── AuditResults.tsx
│   │   └── landing/
│   │       ├── Hero.tsx
│   │       ├── Features.tsx
│   │       └── Pricing.tsx
│   ├── shared/
│   │   ├── TerminalLoader.tsx
│   │   ├── Accordion.tsx
│   │   └── PaywallModal.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       └── Badge.tsx
├── convex/
│   ├── schema.ts
│   ├── users.ts
│   ├── purchases.ts
│   ├── audits.ts
│   ├── stripe.ts
│   └── http.ts
├── hooks/
│   ├── useUser.ts
│   └── usePremiumAccess.ts
└── lib/
    ├── stripe.ts
    └── utils.ts
```

---

## Następne Kroki

1. **Decyzja o auth**: Clerk vs Custom? (Rekomenduję Clerk dla szybkości)
2. **Setup Stripe**: Utworzenie konta, produktów, cen
3. **Implementacja Fazy 0**: Infrastruktura
4. **Landing Page**: Pierwsza rzecz którą zobaczy user z reklamy
