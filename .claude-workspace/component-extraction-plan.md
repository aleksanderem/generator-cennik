# Plan ekstrakcji komponentów z OptimizationResultsPage

## Cel

Wyekstrahować reużywalne komponenty z `OptimizationResultsPage.tsx` (1720 linii), które można używać zarówno w `/optimization-results` jak i `/audit-results` bez przekierowań.

## Analiza OptimizationResultsPage

### Obecna struktura (wszystko w jednym pliku):

1. **Header/Navigation**
   - Main Header (line 658)
   - Dark sub-navigation bar (lines 664-689)
   - Tab navigation bar (lines 692-828)

2. **Summary Tab** (lines 834-1337)
   - Quality Score + Sales Potential card (lines 843-980)
   - Quick Actions card (lines 985-1051)
   - Optimization Summary card (lines 1054-1101)
   - Zakres optymalizacji card (lines 1108-1169)
   - Criterion explanation modal (lines 1172-1281)
   - Recommendations card (lines 1284-1334)

3. **Original Pricelist Tab** (lines 1340-1426)
   - FullPricelistDisplay component
   - Pricelist Info sidebar card
   - EmbedCode component

4. **Optimized Pricelist Tab** (lines 1429-1523)
   - Same structure as Original

5. **Changes List Tab** (lines 1526-1639)
   - Empty state
   - Changes grouped by criteria

6. **Suggestions Tab** (lines 1642-1706)
   - Empty state
   - Recommendations list

7. **Report Tab** (lines 1709-1712)
   - Already uses `<AuditReportTab>`

### Lokalnie zdefiniowane komponenty (do wyekstrahowania):
- `FullPricelistDisplay` (lines 98-151)
- `PricelistCardSimple` (lines 153-223) - nieużywany obecnie

## Plan ekstrakcji

### Nowy folder: `components/results/`

```
components/results/
├── index.ts                      # Re-exports
├── types.ts                      # Shared types for results components
├── ResultsLayout.tsx             # Shell with header + tabs
├── ResultsTabNavigation.tsx      # Tab bar component
├── SummaryTab/
│   ├── index.tsx                 # Main summary tab container
│   ├── QualityScoreCard.tsx      # Quality score + sales potential
│   ├── QuickActionsCard.tsx      # Quick actions grid
│   ├── OptimizationSummaryCard.tsx
│   ├── OptimizationCriteriaCard.tsx  # "Zakres optymalizacji"
│   ├── RecommendationsPreviewCard.tsx
│   └── CriterionModal.tsx        # Explanation modal
├── PricelistTab/
│   ├── index.tsx
│   ├── FullPricelistDisplay.tsx  # Already exists inline
│   └── PricelistInfoSidebar.tsx
├── ChangesTab/
│   ├── index.tsx
│   ├── ChangesEmptyState.tsx
│   └── ChangesGroupCard.tsx
└── SuggestionsTab/
    ├── index.tsx
    ├── SuggestionsEmptyState.tsx
    └── SuggestionsList.tsx
```

### Priorytety ekstrakcji (co jest potrzebne dla AuditResultsPage):

#### PRIORYTET 1 - Kluczowe komponenty do współdzielenia:

1. **`ResultsLayout`** - shell z dark sub-nav bar
   - Props: `title`, `subtitle`, `backPath`, `children`

2. **`ResultsTabNavigation`** - generyczna nawigacja tabów
   - Props: `tabs: Tab[]`, `activeTab`, `onTabChange`, `badges?: Record<string, number>`

3. **`QualityScoreCard`** - karta jakości + potencjału sprzedażowego
   - Props: `qualityScore: number`, `stats: StatsData`, `salesPotentialDescription?: string`
   - Ten sam layout używany w OptimizationResults i może być używany w AuditResults

4. **`QuickActionsCard`** - siatka szybkich akcji
   - Props: `actions: QuickAction[]`
   - Gdzie `QuickAction = { icon, label, description, onClick }`

5. **`PricelistInfoSidebar`** - sidebar z informacjami o cenniku
   - Props: `pricingData`, `themeConfig`, `templateId`, `variant`, `onExportPDF`, `isExporting`

6. **`FullPricelistDisplay`** - już istnieje, trzeba wyeksportować
   - Props jak obecnie: `data`, `theme`, `templateId`, `label`, `variant`, `isLoading`, `showLabel`

#### PRIORYTET 2 - Pozostałe komponenty (refaktor wewnętrzny):

7. **`OptimizationCriteriaCard`** + `CriterionModal`
8. **`ChangesGroupCard`**
9. **`SuggestionsList`**
10. **`OptimizationSummaryCard`**

## Interfejsy dla współdzielonych komponentów

```typescript
// components/results/types.ts

export interface Tab {
  id: string;
  label: string;
  badge?: number;
}

export interface QuickAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export interface StatsData {
  categories: { count: number; delta?: number };
  changes: { count: number };
  services: { count: number; delta?: number };
}

export interface ResultsLayoutProps {
  title: string;
  subtitle?: React.ReactNode;
  backPath: string;
  backLabel?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export interface ResultsTabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  actions?: React.ReactNode; // Right side actions (dropdown)
}
```

## Jak AuditResultsPage będzie używać tych komponentów

```tsx
// Pseudocode dla AuditResultsPage

const AuditResultsPage = () => {
  const [activeTab, setActiveTab] = useState('report');

  // Fetch audit and linked pricelist
  const audit = useQuery(api.audits.getAudit, { auditId });
  const pricelist = useQuery(api.pricelists.getPricelist, { pricelistId: audit?.proPricelistId });

  const tabs = [
    { id: 'report', label: 'Raport' },
    { id: 'optimized', label: 'Cennik PRO' },
    { id: 'original', label: 'Cennik oryginalny' },
  ];

  return (
    <ResultsLayout
      title={audit.salonName}
      subtitle="Wyniki audytu"
      backPath="/profil"
      icon={<FileSearch />}
    >
      <ResultsTabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'report' && (
        <AuditReportTab auditReport={parsedReport} />
      )}

      {activeTab === 'optimized' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <FullPricelistDisplay data={pricelist.optimized} ... />
          </div>
          <PricelistInfoSidebar ... />
        </div>
      )}

      {activeTab === 'original' && (
        // Similar structure
      )}
    </ResultsLayout>
  );
};
```

## Kolejność implementacji

1. Stwórz `components/results/types.ts` z interfejsami
2. Stwórz `ResultsLayout.tsx` - wrapper z header i dark nav
3. Stwórz `ResultsTabNavigation.tsx` - generyczny tab bar
4. Wyeksportuj `FullPricelistDisplay` do osobnego pliku
5. Stwórz `PricelistInfoSidebar.tsx`
6. Stwórz `QualityScoreCard.tsx`
7. Stwórz `QuickActionsCard.tsx`
8. Refaktoruj `OptimizationResultsPage` żeby używał nowych komponentów
9. Stwórz nowy `AuditResultsPage` używając tych samych komponentów
10. Pozostałe komponenty (ChangesTab, SuggestionsTab, etc.) - refaktor w miarę potrzeby

## Uwagi

- Każdy komponent powinien być "dumb" - przyjmować dane przez props, nie fetchować niczego samodzielnie
- Obsługa stanów ładowania/błędów pozostaje w page components
- Animacje (motion.div) mogą zostać w komponentach, ale powinny być opcjonalne
- Używamy istniejącego wzorca z `AuditReportTab` jako przykładu dobrego decoupled komponentu
