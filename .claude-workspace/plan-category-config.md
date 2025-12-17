# Plan: Konfiguracja kategorii przed/po optymalizacji AI

## Cel funkcjonalności

Dodać krok konfiguracji kategorii **przed** uruchomieniem optymalizacji AI oraz możliwość **późniejszej edycji** kategorii i przypisania usług.

---

## Nowe struktury danych

### 1. Rozszerzenie `types.ts`

```typescript
// Konfiguracja kategorii (używana przed/po optymalizacji)
export interface CategoryConfig {
  categoryName: string;
  order: number;                    // kolejność wyświetlania (0 = góra)
  originalIndex: number;            // oryginalny indeks w PricingData
  isAggregation: boolean;           // true jeśli to specjalna agregacja
  aggregationType?: 'promotions' | 'bestsellers'; // typ agregacji
}

// Konfiguracja całego cennika
export interface PricelistCategoryConfig {
  categories: CategoryConfig[];
  enablePromotions: boolean;        // switch "Promocje"
  enableBestsellers: boolean;       // switch "Bestsellery"
  aggregationMode: 'copy' | 'move'; // tryb agregacji (kopiuj/przenieś)
  serviceAssignments?: ServiceAssignment[]; // przypisania usług do kategorii (post-opta)
}

// Przypisanie usługi do kategorii (dla multi-category assignment)
export interface ServiceAssignment {
  serviceName: string;
  originalCategoryIndex: number;    // skąd pochodzi usługa
  assignedCategoryIndices: number[]; // do których kategorii przypisana
}
```

### 2. Zmiany w schema Convex (`convex/schema.ts`)

Dodać nowe pola do tabel `pricelistDrafts` i `pricelists`:

```typescript
// W pricelistDrafts:
categoryConfigJson: v.optional(v.string()),  // PricelistCategoryConfig as JSON

// W pricelists:
categoryConfigJson: v.optional(v.string()),  // PricelistCategoryConfig as JSON
```

---

## Nowe komponenty

### 1. `CategoryConfigStep.tsx`

Krok konfiguracji kategorii wyświetlany **przed** optymalizacją:

**Elementy UI:**
- Nagłówek: "AuditorAI wygenerował {n} kategorii i {m} usług w Twoim cenniku"
- Podtytuł: "Możesz je edytować i układać dowolnie poniżej"
- Drzewko kategorii z:
  - Drag-and-drop do zmiany kolejności
  - Inline editing nazw kategorii
  - Licznik usług przy każdej kategorii
- Switche:
  - "Promocje" [on/off] - tworzy kategorię agregującą z order=0
  - "Bestsellery" [on/off] - tworzy kategorię agregującą z order=1
- Przycisk "Rozpocznij optymalizację" → uruchamia AI

**Props:**
```typescript
interface CategoryConfigStepProps {
  pricingData: PricingData;
  onConfigComplete: (config: PricelistCategoryConfig) => void;
  onCancel: () => void;
}
```

### 2. `CategoryTree.tsx`

Reużywalny komponent drzewka kategorii:

```typescript
interface CategoryTreeProps {
  categories: CategoryConfig[];
  onReorder: (newOrder: CategoryConfig[]) => void;
  onRename: (index: number, newName: string) => void;
  showServiceCount?: boolean;
  pricingData?: PricingData;
  editable?: boolean;
}
```

### 3. `CategoryManager.tsx`

Panel edycji kategorii **po** optymalizacji:

**Elementy UI:**
- Drzewko kategorii (jak w ConfigStep)
- Lista usług z checkboxami do przypisania do kategorii
- Możliwość przypisania usługi do wielu kategorii (nie przerzucenie, a przypisanie)

**Props:**
```typescript
interface CategoryManagerProps {
  pricingData: PricingData;
  categoryConfig: PricelistCategoryConfig;
  onConfigChange: (config: PricelistCategoryConfig) => void;
}
```

---

## Zmiany w flow

### 1. OptimizationResultsPage.tsx

**Nowy state:**
```typescript
const [step, setStep] = useState<'configure' | 'optimizing' | 'results'>('configure');
const [categoryConfig, setCategoryConfig] = useState<PricelistCategoryConfig | null>(null);
```

**Nowy flow:**
1. Po weryfikacji płatności Stripe, jeśli `!existingDraft?.isOptimized`:
   - Wyświetl `CategoryConfigStep`
   - User konfiguruje kategorie
   - User klika "Rozpocznij optymalizację"
2. Zapisz `categoryConfig` do draftu
3. Uruchom `optimizePricelist()` z modyfikacją struktury wg. configu
4. Po optymalizacji, wyświetl wyniki z przyciskiem "Edytuj kategorie"

### 2. Modyfikacja `geminiService.ts`

Dodać funkcję `applyConfigToPricingData()`:

```typescript
function applyConfigToPricingData(
  data: PricingData,
  config: PricelistCategoryConfig
): PricingData {
  // 1. Reorder categories by config.categories[].order
  // 2. Rename categories per config.categories[].categoryName
  // 3. If enablePromotions, create "🔥 Promocje" at order=0
  // 4. If enableBestsellers, create "⭐ Bestsellery" at order=1
  // 5. Apply serviceAssignments if present
  return modifiedData;
}
```

---

## Agregacje (Promocje / Bestsellery)

### Logika "Promocje":
- Gdy switch ON: Stwórz kategorię "🔥 Promocje" z `order: 0`
- Zbierz wszystkie usługi gdzie `isPromo === true` z innych kategorii
- Wyświetl je w agregacji (usługi pozostają też w oryginalnych kategoriach)

### Logika "Bestsellery":
- Gdy switch ON: Stwórz kategorię "⭐ Bestsellery" z `order: 1`
- Zbierz usługi z tagiem "Bestseller" lub oznaczeń AI
- Wyświetl w agregacji

---

## UI Mockup (CategoryConfigStep)

```
┌──────────────────────────────────────────────────────────────┐
│  ✨ Konfiguracja kategorii                                   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  AuditorAI wygenerował 8 kategorii i 45 usług               │
│  w Twoim cenniku.                                           │
│  Możesz je edytować i układać dowolnie poniżej.             │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  ☰  Depilacja Laserowa                      (12 usług) │ │
│  │  ☰  Zabiegi na Twarz                        (8 usług)  │ │
│  │  ☰  Masaże                                  (6 usług)  │ │
│  │  ☰  Stylizacja Rzęs                         (5 usług)  │ │
│  │  ...                                                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Agregacje specjalne                                 │   │
│  │                                                       │   │
│  │  Tryb agregacji:                                      │   │
│  │  ○ Kopiuj (usługi widoczne w 2 miejscach)            │   │
│  │    ⚠️ Uwaga: może tworzyć zduplikowaną treść         │   │
│  │  ○ Przenieś (usługi tylko w agregacji)               │   │
│  │                                                       │   │
│  │  🔥 Promocje          [═══════○───] OFF               │   │
│  │     Zbiera usługi z flagą isPromo=true                │   │
│  │                                                       │   │
│  │  ⭐ Bestsellery       [═══════○───] OFF               │   │
│  │     Zbiera usługi z tagiem "Bestseller"               │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│          ┌─────────────────────────────────────┐            │
│          │    Rozpocznij optymalizację →       │            │
│          └─────────────────────────────────────┘            │
└──────────────────────────────────────────────────────────────┘
```

---

## Pliki do utworzenia/modyfikacji

### Nowe pliki:
1. `components/CategoryConfigStep.tsx` - krok konfiguracji
2. `components/CategoryTree.tsx` - drzewko kategorii z DnD
3. `components/CategoryManager.tsx` - panel edycji post-opta
4. `lib/categoryUtils.ts` - funkcje pomocnicze

### Modyfikacje:
1. `types.ts` - nowe interfejsy
2. `convex/schema.ts` - nowe pola w tabelach
3. `convex/pricelistDrafts.ts` - obsługa categoryConfigJson
4. `convex/pricelists.ts` - obsługa categoryConfigJson
5. `components/pages/OptimizationResultsPage.tsx` - nowy flow z konfigiem
6. `services/geminiService.ts` - `applyConfigToPricingData()`

---

## Kolejność implementacji

1. **Faza 1: Struktury danych**
   - Dodaj typy do `types.ts`
   - Aktualizuj schema Convex
   - Deploy schema

2. **Faza 2: Komponenty UI**
   - `CategoryTree.tsx` (reużywalny)
   - `CategoryConfigStep.tsx`

3. **Faza 3: Integracja flow**
   - Modyfikuj `OptimizationResultsPage.tsx`
   - Dodaj logikę zapisywania/wczytywania configu

4. **Faza 4: Logika agregacji**
   - `applyConfigToPricingData()` w geminiService
   - Obsługa Promocji/Bestsellerów

5. **Faza 5: Post-optimization editing**
   - `CategoryManager.tsx`
   - Przypisanie usług do kategorii

---

## Decyzje projektowe (zatwierdzone przez usera)

1. **Reorder UI**: Przyciski góra/dół (strzałki), bez drag-and-drop

2. **Agregacje (Promocje/Bestsellery)**:
   - User wybiera tryb: "Kopiuj" lub "Przenieś"
   - Przy "Kopiuj" - wyświetlamy ostrzeżenie o potencjalnym bałaganie (zduplikowana treść)
   - Przy "Przenieś" - usługa znika z oryginalnej kategorii

3. **Multi-category assignment**:
   - Jeśli user wybrał tryb "Przenieś" → może przypisać usługę tylko do 1 kategorii
   - Jeśli user wybrał tryb "Referencja/Kopiuj" → ta sama usługa wyświetla się w wielu kategoriach bez duplikacji danych w JSON

