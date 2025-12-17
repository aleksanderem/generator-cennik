# Plan Refaktoryzacji Backendu Audytu Booksy

## Stan obecny vs Docelowy

### Obecny pipeline audytu Booksy:
```
1. scrapeBooksyProfile() - pobiera dane z Booksy API
2. saveScrapedData() - zapisuje surowe dane, tworzy base pricelist
3. analyzeWithAI() - generuje raport (score, strengths, weaknesses, recommendations)
4. completeAudit() - zapisuje raport, tworzy PRO pricelist (kopia base!)
```

### Problem:
- PRO pricelist to dosłowna KOPIA base pricelist (te same kategorie, te same usługi)
- Brak analizy słów kluczowych
- Brak propozycji reorganizacji kategorii
- Optymalizacja wykonywana później przez `optimizationJobsAction` używa tego samego promptu co Usługa 1

### Docelowy pipeline (PRODUCT_SPEC.md):
```
1. scrapeBooksyProfile() - pobiera dane z Booksy API (bez zmian)
2. analyzeAndPlan() - NOWE: multi-step analiza
   ├── buildContextDPO() - buduje kontekst z danych Booksy
   ├── generateKeywordReport() - raport słów kluczowych
   ├── generateCategoryProposal() - propozycja układu kategorii
   └── generateAuditReport() - pełny raport audytowy
3. saveAuditResults() - zapisuje wszystkie obiekty powiązane
4. [USER ACTION] - użytkownik akceptuje/edytuje propozycję kategorii
5. optimizeWithSelectedOptions() - NOWE: optymalizacja z toggleami
```

---

## Faza 1: Rozbudowa schematu bazy danych

### Nowe tabele w `convex/schema.ts`:

```typescript
// Raport słów kluczowych
keywordReports: defineTable({
  auditId: v.id("audits"),
  keywords: v.array(v.object({
    keyword: v.string(),
    count: v.number(),
    categories: v.array(v.string()),
    services: v.array(v.string()),
  })),
  categoryDistribution: v.array(v.object({
    categoryName: v.string(),
    keywordCount: v.number(),
    topKeywords: v.array(v.string()),
  })),
  suggestions: v.array(v.string()),
  createdAt: v.number(),
}).index("by_audit", ["auditId"]),

// Propozycja układu kategorii
categoryProposals: defineTable({
  auditId: v.id("audits"),
  originalStructureJson: v.string(),
  proposedStructureJson: v.string(),
  changes: v.array(v.object({
    type: v.union(
      v.literal("move_service"),
      v.literal("merge_categories"),
      v.literal("split_category"),
      v.literal("rename_category"),
      v.literal("reorder_categories"),
      v.literal("create_category")
    ),
    description: v.string(),
    fromCategory: v.optional(v.string()),
    toCategory: v.optional(v.string()),
    services: v.optional(v.array(v.string())),
    reason: v.string(),
  })),
  status: v.union(
    v.literal("pending"),
    v.literal("accepted"),
    v.literal("modified"),
    v.literal("rejected")
  ),
  userModificationsJson: v.optional(v.string()),
  acceptedAt: v.optional(v.number()),
  createdAt: v.number(),
}).index("by_audit", ["auditId"]),

// Opcje optymalizacji wybrane przez użytkownika
optimizationOptions: defineTable({
  auditId: v.id("audits"),
  selectedOptions: v.array(v.union(
    v.literal("descriptions"),
    v.literal("seo"),
    v.literal("categories"),
    v.literal("order"),
    v.literal("prices"),
    v.literal("duplicates"),
    v.literal("duration"),
    v.literal("tags")
  )),
  isFullAuto: v.boolean(),
  createdAt: v.number(),
}).index("by_audit", ["auditId"]),
```

### Rozszerzone pola w tabeli `audits`:

```typescript
// Dodać do istniejącego audits:
keywordReportId: v.optional(v.id("keywordReports")),
categoryProposalId: v.optional(v.id("categoryProposals")),
optimizationOptionsId: v.optional(v.id("optimizationOptions")),
```

---

## Faza 2: Nowe funkcje analizy (convex/auditAnalysis.ts)

### 2.1 generateKeywordReport()

```typescript
// Input: scrapedDataJson (cennik z Booksy)
// Output: KeywordReport object

async function generateKeywordReport(scrapedData: ScrapedData): Promise<KeywordReport> {
  // 1. Ekstrahuj wszystkie nazwy usług i opisy
  // 2. Tokenizuj i zlicz słowa kluczowe
  // 3. Mapuj słowa kluczowe do kategorii i usług
  // 4. Generuj sugestie dodatkowych słów kluczowych (AI)

  // Prompt do AI:
  const prompt = `
    Przeanalizuj cennik salonu beauty i wygeneruj raport słów kluczowych.

    ZADANIA:
    1. Zidentyfikuj wszystkie słowa kluczowe branżowe (np. "lifting", "mezoterapia", "botox")
    2. Policz wystąpienia każdego słowa
    3. Wskaż w których kategoriach i usługach występują
    4. Zasugeruj brakujące słowa kluczowe dla SEO Booksy

    DANE:
    ${JSON.stringify(scrapedData)}
  `;
}
```

### 2.2 generateCategoryProposal()

```typescript
// Input: scrapedDataJson + keywordReport + audit context
// Output: CategoryProposal object

async function generateCategoryProposal(
  scrapedData: ScrapedData,
  keywordReport: KeywordReport
): Promise<CategoryProposal> {
  // Prompt do AI:
  const prompt = `
    Jesteś ekspertem UX salonów beauty. Zaproponuj OPTYMALNĄ strukturę kategorii.

    KONTEKST:
    - Obecna struktura: ${scrapedData.categories.length} kategorii
    - Najważniejsze słowa kluczowe: ${keywordReport.topKeywords}

    ZASADY:
    1. Kategorie muszą mieć sens sprzedażowy (nowy klient = szybka orientacja)
    2. Maksymalnie 8-12 głównych kategorii
    3. Duplikaty usług mogą być w wielu kategoriach (np. "Bestsellery" + oryginalna)
    4. Każda zmiana musi mieć uzasadnienie

    ZWRÓĆ:
    - proposedStructure: nowy układ kategorii
    - changes: lista zmian z opisem i uzasadnieniem

    DANE WEJŚCIOWE:
    ${JSON.stringify(scrapedData)}
  `;
}
```

### 2.3 generateFullAuditReport()

```typescript
// Input: wszystkie zebrane dane
// Output: rozszerzony AuditReport

interface ExtendedAuditReport extends AuditReport {
  seoStrategy: {
    description: string;
    foundKeywords: string[];
    suggestedKeywords: string[];
  };
  conversionStrategy: string;
  retentionStrategy: string;
  brandingStrategy: string;
  actionPlan: Array<{
    step: number;
    description: string;
    example: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  exampleChanges: Array<{
    good: string;
    bad: string;
    explanation: string;
  }>;
}
```

---

## Faza 3: Dynamiczny prompt optymalizacji

### 3.1 buildOptimizationPrompt()

```typescript
function buildOptimizationPrompt(
  pricingData: PricingData,
  selectedOptions: OptimizationOption[],
  auditContext: AuditContext
): string {
  let prompt = `
    KONTEKST AUDYTU:
    - Salon: ${auditContext.salonName}
    - Ocena: ${auditContext.overallScore}/100
    - Słabe strony: ${auditContext.weaknesses.join(', ')}

    WYBRANE OBSZARY OPTYMALIZACJI:
  `;

  if (selectedOptions.includes('descriptions')) {
    prompt += `
    [OPISY USŁUG]
    - Dodaj język korzyści
    - Dla kogo jest usługa
    - Jakie efekty
    - Maksymalnie 2-3 zdania
    `;
  }

  if (selectedOptions.includes('seo')) {
    prompt += `
    [SŁOWA KLUCZOWE SEO]
    - Dodaj słowa: ${auditContext.suggestedKeywords.join(', ')}
    - W nazwach usług i opisach
    - Naturalne użycie (nie spam)
    `;
  }

  if (selectedOptions.includes('categories')) {
    prompt += `
    [STRUKTURA KATEGORII]
    - Zastosuj zatwierdzoną propozycję kategorii
    - Przenieś usługi zgodnie z planem
    `;
  }

  // ... analogicznie dla pozostałych opcji

  return prompt;
}
```

### 3.2 Lista opcji optymalizacji

| Opcja | ID | Opis | Co robi AI |
|-------|-----|------|------------|
| Opisy usług | `descriptions` | Język korzyści w opisach | Dodaje/poprawia opisy |
| SEO | `seo` | Słowa kluczowe | Wzbogaca nazwy i opisy o keywords |
| Kategorie | `categories` | Struktura kategorii | Reorganizuje według propozycji |
| Kolejność | `order` | Kolejność usług | Sortuje od bestsellera |
| Ceny | `prices` | Formatowanie cen | Ujednolica format (od X zł) |
| Duplikaty | `duplicates` | Wykrywanie duplikatów | Oznacza/łączy duplikaty |
| Czas | `duration` | Szacowanie czasu | Dodaje czas trwania |
| Tagi | `tags` | Oznaczenia | Dodaje Bestseller/Nowość/Premium |

---

## Faza 4: Nowy flow UI

### 4.1 Po zakończeniu analizy (AuditResultsPage)

```
1. Podsumowanie audytu (obecne)
2. NOWE: Zakładka "Słowa kluczowe"
   - Tabela z keywords
   - Wykres rozkładu
   - Sugestie
3. NOWE: Zakładka "Propozycja kategorii"
   - Porównanie stary vs nowy układ
   - Drag & drop do edycji
   - Przycisk "Zatwierdź propozycję"
4. Zakładka "Cennik oryginalny"
5. Zakładka "Cennik zoptymalizowany" (po optymalizacji)
```

### 4.2 Przed optymalizacją (OptimizationModal lub nowa strona)

```
Modal "Wybierz co zoptymalizować"
┌─────────────────────────────────────────────┐
│ ✓ Opisy usług (język korzyści)              │
│ ✓ Słowa kluczowe SEO                        │
│ ☐ Struktura kategorii                       │
│ ✓ Kolejność usług                           │
│ ✓ Formatowanie cen                          │
│ ☐ Duplikaty i błędy                         │
│ ✓ Szacowanie czasu                          │
│ ✓ Tagi i oznaczenia                         │
│                                             │
│ [Tryb Full Auto - wszystko]                 │
│                                             │
│ [Anuluj]              [Rozpocznij]          │
└─────────────────────────────────────────────┘
```

---

## Faza 5: Plan implementacji

### Kolejność prac:

1. **Schema (1h)**
   - Dodać nowe tabele do schema.ts
   - Rozszerzyć tabelę audits
   - npx convex dev

2. **Backend - analiza słów kluczowych (2h)**
   - convex/auditAnalysis.ts - generateKeywordReport()
   - Zapisywanie do keywordReports
   - Linkowanie z audits

3. **Backend - propozycja kategorii (2h)**
   - generateCategoryProposal()
   - Zapisywanie do categoryProposals
   - API do akceptacji/modyfikacji propozycji

4. **Backend - dynamiczny prompt (2h)**
   - buildOptimizationPrompt()
   - Modyfikacja optimizationJobsAction
   - Obsługa selectedOptions

5. **UI - zakładka słów kluczowych (2h)**
   - KeywordReportTab.tsx
   - Tabela, wykresy (recharts)

6. **UI - edytor kategorii v2 (4h)**
   - CategoryProposalEditor.tsx
   - Porównanie stary/nowy
   - Drag & drop
   - Akceptacja propozycji

7. **UI - modal opcji optymalizacji (1h)**
   - OptimizationOptionsModal.tsx
   - Checkboxy dla każdej opcji
   - Tryb Full Auto

8. **Integracja i testy (2h)**
   - Połączenie wszystkich komponentów
   - Testy e2e

**Szacowany czas: ~16h**

---

## Pytania do rozstrzygnięcia

1. **Czy propozycja kategorii powinna być generowana automatycznie po audycie, czy na żądanie użytkownika?**
   - Sugestia: automatycznie, ale użytkownik może ją odrzucić

2. **Czy optymalizacja ma być możliwa bez akceptacji propozycji kategorii?**
   - Sugestia: tak, opcja "categories" wymaga akceptacji, ale pozostałe nie

3. **Czy zachować obecną funkcjonalność optymalizacji cennika (Usługa 1)?**
   - Sugestia: tak, bez zmian - to osobny flow

4. **Limit retry dla generowania propozycji kategorii?**
   - Sugestia: 3 próby, potem fallback do obecnej struktury
