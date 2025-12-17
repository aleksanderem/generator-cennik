# AuditorAI - Specyfikacja Produktu

## Dwie główne usługi

### Usługa 1: Optymalizacja Cennika (tańsza)

**Źródło danych:** Użytkownik wkleja swój cennik z dowolnego źródła (Excel, strona WWW, ulotki)

**Wartość dla użytkownika:**
- Darmowo: Tworzy interaktywną, ładną wersję cennika przez kopiuj-wklej
- Płatnie: Cennik jest optymalizowany przez AI na podstawie globalnego promptu audytowego

**Zakres optymalizacji:**
- Podstawowy prompt DPO (Docelowy Prompt Optymalizacyjny)
- Nie wymaga pobierania danych zewnętrznych
- Mniejszy nakład pracy AI = niższa cena

**Edycja kategorii:** Użytkownik może edytować kategorie (istniejący `CategoryConfigStep`)

---

### Usługa 2: Audyt Booksy (droższa, bardziej zaawansowana)

**Źródło danych:** Automatyczne pobieranie z profilu Booksy użytkownika przez API

**Dostępne dane z Booksy:**
- Cennik (kategorie, usługi, ceny, czasy)
- Pracownicy
- Bestsellery
- Promocje
- Opinie (do analizy sentymentu)
- Metadata profilu

---

## Pipeline Audytu Booksy

### Krok 1: Pobieranie danych z Booksy API
```
├── Cennik surowy (kategorie, usługi, ceny, czasy trwania)
├── Lista pracowników
├── Bestsellery (flagi/tagi)
├── Aktywne promocje
├── Opinie klientów
└── Metadata profilu (nazwa, lokalizacja, branża)
```

### Krok 2: Analiza danych i budowanie kontekstu DPO

**TO CO WIEMY (stałe najlepsze praktyki):**
- Najlepsze praktyki cenników beauty
- Język korzyści
- Optymalna długość opisów
- Złożoność opisów
- Brak emoji w opisach

**TO CO DOSTAJEMY Z BOOKSY (analiza dynamiczna):**
- Zagęszczenie słów kluczowych (weryfikacja jakie i w jakich ilościach)
- Złożoność opisów względem oferty (UX - czy użytkownik znajdzie informację)
- Duplikaty (czy usługa zduplikowana ma uzasadnienie)
- Kategorie (czy usługi są rozsądnie ułożone, czy kategorie mają sens sprzedażowy)
- Język korzyści w opisach
- Słowa kluczowe SEO
- Struktura kategorii
- Kolejność usług
- Formatowanie cen
- Duplikaty i błędy
- Szacowanie czasu
- Tagi i oznaczenia

### Krok 3: Generowanie obiektów powiązanych

**[Obiekt #1] Cennik wizualny z surowych danych**
- Wygenerowany cennik z danych Booksy
- Taki sam jak w darmowej usłudze generatora
- Bez optymalizacji - surowe dane

**[Obiekt #2] Raport słów kluczowych i możliwości**
- Tabela najczęściej powtarzających się fraz branżowych
- Miejsca występowania każdej frazy
- Wykres area chart / słupkowy częstotliwości
- Wykres rozkładu słów kluczowych per kategoria

**[Obiekt #3] Propozycja układu kategorii**
- Propozycja reorganizacji kategorii
- Do akceptacji/edycji przez użytkownika
- Sugestie przeniesień usług między kategoriami
- Sugestie połączeń/podziałów kategorii

**[Obiekt #4] Pełny raport audytowy**
Struktura raportu:
```
├── Werdykt audytora
│   ├── Punktacja (0-100)
│   └── Opis
├── Potencjał sprzedażowy
│   ├── Punktacja (0-100)
│   └── Opis
├── Strategia wzrostu
│   ├── SEO
│   │   ├── Opis
│   │   ├── Znalezione frazy kluczowe
│   │   └── Sugestie słów kluczowych
│   ├── Konwersja [Opis]
│   ├── Retencja [Opis]
│   └── Wizerunek [Opis]
├── Plan naprawczy krok po kroku
│   └── Kroki[]
│       ├── Opis
│       └── Przykład
├── Przykłady zmian
│   └── Przykład[]
│       ├── Dobrze
│       └── Źle
├── Mocne strony
│   ├── Opis
│   └── Lista[]
└── Słabe strony
    ├── Opis
    └── Lista[]
```

### Krok 4: Optymalizacja (na żądanie użytkownika)

**UI przed optymalizacją:**
- Toggle dla każdego elementu do optymalizacji
- Użytkownik wybiera co chce zoptymalizować
- Tryb "full auto" = wszystkie elementy zaznaczone

**Elementy do wyboru:**
- [ ] Opisy usług (język korzyści)
- [ ] Słowa kluczowe SEO
- [ ] Struktura kategorii
- [ ] Kolejność usług
- [ ] Formatowanie cen
- [ ] Duplikaty i błędy
- [ ] Szacowanie czasu
- [ ] Tagi i oznaczenia

**Dynamiczne budowanie promptu:**
- Prompt budowany na podstawie wybranych elementów
- AI zobowiązane do zwrotu cennika w konkretnym formacie
- Uwzględnia tylko wybrane obszary optymalizacji

---

## Różnice między usługami

| Aspekt | Optymalizacja cennika | Audyt Booksy |
|--------|----------------------|--------------|
| Źródło danych | Wklejone przez użytkownika | API Booksy |
| Kontekst | Brak | Pracownicy, opinie, bestsellery, promocje |
| Analiza | Podstawowy prompt | Multi-step z budowaniem DPO |
| Słowa kluczowe | Ogólne sugestie | Raport z wykresami i tabelami |
| Układ kategorii | Edycja manualna | Propozycja AI do akceptacji |
| Raport | Brak | Pełny raport audytowy |
| Cena | Niższa | Wyższa (więcej pracy AI) |

---

## Edytor kategorii

### Usługa 1 (obecny)
- `CategoryConfigStep` - konfiguracja przed optymalizacją
- `CategoryManager` - edycja po optymalizacji
- `CategoryTree` - drzewko z drag-and-drop
- Agregacje: Promocje, Bestsellery
- Sugestie AI dla nowych kategorii

### Usługa 2 (do zbudowania)
- Widok porównania: stary układ vs propozycja AI
- Drag-and-drop między kolumnami
- Akceptacja/odrzucenie propozycji
- Integracja z raportem słów kluczowych
- Lepszy UX, bardziej dopracowany

---

## Schemat danych (do rozbudowy)

### Nowe tabele w Convex schema:

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
})

// Propozycja układu kategorii
categoryProposals: defineTable({
  auditId: v.id("audits"),
  originalStructure: v.string(), // JSON
  proposedStructure: v.string(), // JSON
  changes: v.array(v.object({
    type: v.union(v.literal("move"), v.literal("merge"), v.literal("split"), v.literal("rename")),
    description: v.string(),
    fromCategory: v.optional(v.string()),
    toCategory: v.optional(v.string()),
    services: v.optional(v.array(v.string())),
  })),
  status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("modified"), v.literal("rejected")),
  userModifications: v.optional(v.string()), // JSON z modyfikacjami użytkownika
  createdAt: v.number(),
})
```

---

## Notatki implementacyjne

1. Audyt powinien generować wszystkie obiekty powiązane (#1-#4) w jednym procesie
2. Optymalizacja uruchamiana osobno, po akceptacji propozycji kategorii
3. UI toggleów pozwala na granularną kontrolę optymalizacji
4. Raport słów kluczowych jako osobna zakładka w wynikach audytu
5. Propozycja kategorii jako interaktywny krok przed optymalizacją
