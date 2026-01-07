import { v } from "convex/values";
import { query, mutation, internalMutation, internalQuery } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================
// ADMIN FUNCTIONS
// Zarządzanie promptami i rolami użytkowników
// ============================================

// Helper: Sprawdź czy użytkownik jest adminem
async function isUserAdmin(ctx: any, clerkId: string): Promise<boolean> {
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", clerkId))
    .unique();

  return user?.role === "admin";
}

// Helper: Pobierz użytkownika lub rzuć błąd
async function requireAdmin(ctx: any, clerkId: string) {
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q: any) => q.eq("clerkId", clerkId))
    .unique();

  if (!user) {
    throw new Error("Użytkownik nie znaleziony");
  }

  if (user.role !== "admin") {
    throw new Error("Brak uprawnień administratora");
  }

  return user;
}

// ============================================
// ROLE MANAGEMENT
// ============================================

/**
 * Sprawdź czy aktualny użytkownik jest adminem
 */
export const checkIsAdmin = query({
  args: { clerkId: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    return await isUserAdmin(ctx, args.clerkId);
  },
});

/**
 * Nadaj rolę admina użytkownikowi (tylko dla adminów)
 */
export const setUserRole = mutation({
  args: {
    adminClerkId: v.string(),
    targetUserId: v.id("users"),
    role: v.union(v.literal("user"), v.literal("admin")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminClerkId);

    await ctx.db.patch(args.targetUserId, {
      role: args.role,
    });

    return null;
  },
});

/**
 * Ustaw siebie jako admina (jednorazowe - dla pierwszego użytkownika)
 * UWAGA: W produkcji usuń lub zabezpiecz tę funkcję!
 */
export const setSelfAsAdmin = mutation({
  args: { clerkId: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Sprawdź czy jest już jakikolwiek admin
    const existingAdmin = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .first();

    if (existingAdmin) {
      // Jeśli jest admin, tylko admin może nadawać role
      throw new Error("Admin już istnieje. Użyj setUserRole.");
    }

    // Znajdź użytkownika po clerkId
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      throw new Error("Użytkownik nie znaleziony");
    }

    // Ustaw jako admina
    await ctx.db.patch(user._id, { role: "admin" });

    return true;
  },
});

// ============================================
// PROMPT TEMPLATES MANAGEMENT
// ============================================

/**
 * Pobierz wszystkie szablony promptów (tylko dla adminów)
 */
export const listPromptTemplates = query({
  args: { clerkId: v.string() },
  returns: v.array(v.object({
    _id: v.id("promptTemplates"),
    stage: v.string(),
    displayName: v.string(),
    description: v.string(),
    promptContent: v.string(),
    rules: v.optional(v.array(v.string())),
    examples: v.optional(v.array(v.object({
      before: v.string(),
      after: v.string(),
    }))),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
    updatedAt: v.number(),
    version: v.number(),
    isActive: v.boolean(),
  })),
  handler: async (ctx, args) => {
    const isAdmin = await isUserAdmin(ctx, args.clerkId);
    if (!isAdmin) {
      return [];
    }

    const templates = await ctx.db
      .query("promptTemplates")
      .collect();

    return templates.map(t => ({
      _id: t._id,
      stage: t.stage,
      displayName: t.displayName,
      description: t.description,
      promptContent: t.promptContent,
      rules: t.rules,
      examples: t.examples,
      temperature: t.temperature,
      maxTokens: t.maxTokens,
      updatedAt: t.updatedAt,
      version: t.version,
      isActive: t.isActive,
    }));
  },
});

/**
 * Pobierz szablon prompta po stage (publiczne - używane przez optimization)
 */
export const getPromptTemplate = query({
  args: { stage: v.string() },
  returns: v.union(
    v.object({
      promptContent: v.string(),
      rules: v.optional(v.array(v.string())),
      examples: v.optional(v.array(v.object({
        before: v.string(),
        after: v.string(),
      }))),
      temperature: v.optional(v.number()),
      maxTokens: v.optional(v.number()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const template = await ctx.db
      .query("promptTemplates")
      .withIndex("by_stage", (q) => q.eq("stage", args.stage))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!template) return null;

    return {
      promptContent: template.promptContent,
      rules: template.rules,
      examples: template.examples,
      temperature: template.temperature,
      maxTokens: template.maxTokens,
    };
  },
});

/**
 * Pobierz wszystkie aktywne szablony promptów (internal - dla optimization action)
 */
export const getAllActivePromptTemplates = internalQuery({
  args: {},
  returns: v.record(v.string(), v.object({
    promptContent: v.string(),
    rules: v.optional(v.array(v.string())),
    examples: v.optional(v.array(v.object({
      before: v.string(),
      after: v.string(),
    }))),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
  })),
  handler: async (ctx) => {
    const templates = await ctx.db
      .query("promptTemplates")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    const result: Record<string, {
      promptContent: string;
      rules?: string[];
      examples?: { before: string; after: string }[];
      temperature?: number;
      maxTokens?: number;
    }> = {};

    for (const t of templates) {
      result[t.stage] = {
        promptContent: t.promptContent,
        rules: t.rules,
        examples: t.examples,
        temperature: t.temperature,
        maxTokens: t.maxTokens,
      };
    }

    return result;
  },
});

/**
 * Utwórz lub zaktualizuj szablon prompta (tylko dla adminów)
 */
export const upsertPromptTemplate = mutation({
  args: {
    clerkId: v.string(),
    stage: v.string(),
    displayName: v.string(),
    description: v.string(),
    promptContent: v.string(),
    rules: v.optional(v.array(v.string())),
    examples: v.optional(v.array(v.object({
      before: v.string(),
      after: v.string(),
    }))),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  returns: v.id("promptTemplates"),
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.clerkId);

    // Sprawdź czy istnieje szablon dla tego stage
    const existing = await ctx.db
      .query("promptTemplates")
      .withIndex("by_stage", (q) => q.eq("stage", args.stage))
      .first();

    const now = Date.now();

    if (existing) {
      // Aktualizuj istniejący
      await ctx.db.patch(existing._id, {
        displayName: args.displayName,
        description: args.description,
        promptContent: args.promptContent,
        rules: args.rules,
        examples: args.examples,
        temperature: args.temperature,
        maxTokens: args.maxTokens,
        isActive: args.isActive ?? existing.isActive,
        updatedAt: now,
        updatedBy: admin._id,
        version: existing.version + 1,
      });
      return existing._id;
    } else {
      // Utwórz nowy
      return await ctx.db.insert("promptTemplates", {
        stage: args.stage,
        displayName: args.displayName,
        description: args.description,
        promptContent: args.promptContent,
        rules: args.rules,
        examples: args.examples,
        temperature: args.temperature,
        maxTokens: args.maxTokens,
        updatedAt: now,
        updatedBy: admin._id,
        version: 1,
        isActive: args.isActive ?? true,
      });
    }
  },
});

/**
 * Usuń szablon prompta (tylko dla adminów)
 */
export const deletePromptTemplate = mutation({
  args: {
    clerkId: v.string(),
    templateId: v.id("promptTemplates"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.clerkId);
    await ctx.db.delete(args.templateId);
    return null;
  },
});

/**
 * Inicjalizuj domyślne szablony promptów (internal - wywołaj ręcznie)
 */
export const initializeDefaultPromptTemplates = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const now = Date.now();

    // Profesjonalne szablony promptów dla optymalizacji cenników beauty
    const defaultTemplates = [
      {
        stage: "optimization_main",
        displayName: "Główne zasady optymalizacji",
        description: "Krytyczne zasady stosowane we wszystkich optymalizacjach. Zmienna ${serviceCount} zostanie zastąpiona liczbą usług.",
        promptContent: `=== NIEPODWAŻALNE ZASADY OPTYMALIZACJI ===

!!! KRYTYCZNE - OPIS USŁUGI !!!
- OPIS to TYLKO 1-2 zdania o KORZYŚCI dla klienta (np. "Gładka skóra na długo")
- W OPISIE NIE MOŻE BYĆ: cen, kwot, "zł", pakietów, wariantów, markdown (**)
- BŁĘDNY opis: "**Pakiet 4 zabiegów: 1150 zł** Depilacja bikini" - ZABRONIONE!
- POPRAWNY opis: "Gładka skóra i komfort na długie tygodnie"

!!! ZAKAZ MARKDOWN !!!
- NIGDY nie używaj ** ani * ani żadnego formatowania markdown
- Tekst musi być CZYSTY, bez formatowania

ZASADA #1 - ZACHOWANIE INTEGRALNOŚCI DANYCH:
- W kategorii jest DOKŁADNIE \${serviceCount} usług
- Na wyjściu MUSI być DOKŁADNIE \${serviceCount} usług
- Usługa #1 na wejściu = usługa #1 na wyjściu (kolejność NIETYKALNA)

ZASADA #2 - OCHRONA TOŻSAMOŚCI USŁUG:
- Nazwy autorskie/brandowane są NIETYKALNE: MS AquaLift, Thunder MT, Endermologie, LPG, Hydrafacial
- Nazwa może być WZBOGACONA o kontekst, ale NIE ZAMIENIONA

ZASADA #3 - FORMATOWANIE:
- NIE używaj emoji
- NIE używaj markdown (**, *, #)
- CENY tylko w kolumnie CENA, NIGDY w opisie
- Zachowaj profesjonalny ton

ZASADA #4 - ODPOWIEDŹ:
- TYLKO format tabelaryczny
- Każda linia = jedna usługa
- Zachowaj kolejność jak na wejściu`,
        rules: [
          "Zachowaj dokładnie ${serviceCount} usług",
          "Nie zamieniaj pozycji usług",
          "Nie zmieniaj nazw autorskich/brandowanych",
          "Nie używaj emoji ani markdown",
          "NIE wstawiaj cen/pakietów do opisów",
        ],
        examples: [],
        temperature: 0.1,
        maxTokens: 4096,
      },
      {
        stage: "optimization_seo",
        displayName: "SEO - Słowa kluczowe",
        description: "Instrukcje dodawania słów kluczowych SEO do nazw usług dla lepszej widoczności w wyszukiwarkach",
        promptContent: `=== OPTYMALIZACJA SEO NAZW USŁUG ===

CEL: Dodaj słowa kluczowe, które klienci wpisują w Google szukając danej usługi, zachowując oryginalną nazwę.

STRATEGIA TWORZENIA NAZW SEO:
1. Zidentyfikuj GŁÓWNE słowo kluczowe (co klient szuka w Google)
2. Zachowaj ORYGINALNĄ nazwę usługi jako bazę
3. DODAJ kontekst/korzyść/efekt do nazwy
4. Format: "[Słowo kluczowe] - [oryginalna nazwa] | [korzyść]" lub "[Oryginalna nazwa] - [korzyść/efekt]"

DOZWOLONE MODYFIKACJE:
✓ Dodanie słów kluczowych na początku: "Trądzik - Konsultacja specjalistyczna"
✓ Dodanie korzyści na końcu: "Peeling kawitacyjny - czysta i gładka skóra"
✓ Rozwinięcie skrótu: "Depilacja woskiem nogi" → "Depilacja woskiem nogi - gładkość do 4 tygodni"
✓ Dodanie separatora z kontekstem: "Masaż relaksacyjny | redukcja stresu i napięcia"

ZABRONIONE MODYFIKACJE:
✗ Całkowita zmiana nazwy: "Peeling" → "Zabieg oczyszczający" (BŁĄD!)
✗ Zamiana nazw między usługami
✗ Zmiana nazw autorskich: "MS AquaLift" → "Lifting nawilżający" (BŁĄD!)
✗ Usunięcie charakterystycznych elementów nazwy
✗ Dodawanie emoji lub symboli

NAZWY AUTORSKIE - NIE ZMIENIAJ:
Jeśli nazwa zawiera: MS, BTX, Hydra, Endo, LPG, lub wygląda na nazwę własną zabiegu - ZOSTAW BEZ ZMIAN.
Przykłady nazw do zachowania: "MS AquaLift", "BTX Lift Pro", "Endermologie LPG", "HydraFacial MD"`,
        rules: [
          "Dodawaj słowa kluczowe, nie zamieniaj całej nazwy",
          "Zachowaj rozpoznawalność usługi dla stałych klientów",
          "Nazwy autorskie i brandowane zostaw bez zmian",
          "Używaj formatu: Słowo kluczowe - Nazwa | Korzyść",
          "Nie zamieniaj nazw między usługami",
        ],
        examples: [
          { before: "Konsultacja trądzikowa", after: "Trądzik - konsultacja specjalistyczna | skuteczne leczenie" },
          { before: "Oczyszczanie twarzy", after: "Oczyszczanie twarzy - głęboki peeling i nawilżenie" },
          { before: "Depilacja woskiem łydki", after: "Depilacja woskiem łydki - gładka skóra do 4 tygodni" },
          { before: "Masaż relaksacyjny", after: "Masaż relaksacyjny całego ciała | redukcja stresu" },
          { before: "MS AquaLift", after: "MS AquaLift" },
          { before: "Endermologie LPG", after: "Endermologie LPG" },
          { before: "Makijaż okolicznościowy", after: "Makijaż okolicznościowy - perfekcyjny look na każdą okazję" },
        ],
        temperature: 0.2,
        maxTokens: 4096,
      },
      {
        stage: "optimization_descriptions",
        displayName: "Opisy usług",
        description: "Instrukcje tworzenia przekonujących opisów usług z językiem korzyści",
        promptContent: `=== TWORZENIE PROFESJONALNYCH OPISÓW USŁUG ===

CEL: Napisz opisy, które przekonają klienta do rezerwacji, używając języka korzyści.

STRUKTURA OPISU (max 150 znaków):
1. CO ZYSKUJE KLIENT (efekt/rezultat)
2. DLA KOGO jest usługa (opcjonalnie)
3. WYRÓŻNIK (co czyni ją wyjątkową)

JĘZYK KORZYŚCI - używaj:
✓ "Zyskasz...", "Efekt to...", "Rezultat: ..."
✓ "Idealne dla...", "Polecane przy..."
✓ "Natychmiastowy efekt", "Długotrwałe działanie"
✓ Konkrety: "gładka skóra do 4 tygodni", "redukcja zmarszczek o 30%"

UNIKAJ:
✗ Cen w opisie (są w osobnym polu!)
✗ Ogólników: "profesjonalny zabieg", "wysoka jakość"
✗ Zbyt długich opisów (max 2-3 zdania)
✗ Emoji i symboli
✗ Powtarzania nazwy usługi w opisie

JEŚLI USŁUGA NIE MA OPISU:
Stwórz krótki, przekonujący opis bazując na nazwie usługi.

JEŚLI USŁUGA MA OPIS Z CENĄ:
Usuń informację o cenie z opisu - zostaw tylko część merytoryczną.`,
        rules: [
          "Max 150 znaków (2-3 zdania)",
          "Język korzyści - co klient zyskuje",
          "Nie powtarzaj cen w opisie",
          "Nie używaj emoji",
          "Każda usługa powinna mieć opis",
        ],
        examples: [
          { before: "(brak opisu)", after: "Głębokie oczyszczanie skóry z efektem natychmiastowego rozświetlenia. Idealne przed ważnym wyjściem." },
          { before: "Cena od 150 zł. Zabieg na twarz.", after: "Kompleksowa pielęgnacja twarzy z widocznym efektem odmłodzenia. Skóra odzyskuje blask i elastyczność." },
          { before: "Masaż", after: "Głęboka relaksacja całego ciała. Redukcja napięcia mięśniowego i stresu. Poczujesz się jak nowa/nowy." },
          { before: "Depilacja laserowa pach", after: "Trwałe pozbycie się owłosienia. Gładka skóra bez podrażnień. Efekty widoczne już po pierwszym zabiegu." },
        ],
        temperature: 0.3,
        maxTokens: 4096,
      },
      {
        stage: "optimization_order",
        displayName: "Kolejność usług",
        description: "Instrukcje optymalizacji kolejności usług w kategorii dla lepszej konwersji",
        promptContent: `=== OPTYMALIZACJA KOLEJNOŚCI USŁUG ===

CEL: Ułóż usługi w kolejności maksymalizującej konwersję i ułatwiającej klientom wybór.

PRIORYTET SORTOWANIA (od góry do dołu):

1. BESTSELLERY I NAJPOPULARNIEJSZE
   - Usługi z tagami "Bestseller", "Hit", "Najpopularniejsze"
   - Podstawowe usługi danej kategorii (np. "Manicure klasyczny" przed "Manicure japoński")

2. USŁUGI FLAGOWE / PREMIUM
   - Zabiegi wyróżniające salon
   - Usługi z wyższą marżą
   - Nowości (ale NIE na samej górze)

3. WARIANTY I ROZSZERZENIA
   - Różne wersje tej samej usługi pogrupowane razem
   - Od podstawowej do najbardziej rozbudowanej

4. PAKIETY I ZESTAWY
   - Pakiety łączone na końcu sekcji
   - Karnety i abonamenty

5. KONSULTACJE (jeśli są w kategorii)
   - Konsultacje wstępne mogą być na początku LUB na końcu
   - Zależy od charakteru kategorii

ZASADY GRUPOWANIA:
- Podobne usługi obok siebie (np. wszystkie manicure razem)
- Warianty od najtańszego do najdroższego
- Zachowaj logiczny przepływ (basic → advanced → premium)

UWAGA: Nie usuwaj ani nie dodawaj usług - tylko zmień ich kolejność!`,
        rules: [
          "Bestsellery i popularne usługi na górze",
          "Grupuj podobne usługi razem",
          "Pakiety i zestawy na końcu",
          "Warianty od basic do premium",
          "Zachowaj wszystkie usługi - tylko zmień kolejność",
        ],
        examples: [
          { before: "1. Manicure japoński, 2. Manicure klasyczny, 3. Manicure hybrydowy", after: "1. Manicure klasyczny, 2. Manicure hybrydowy, 3. Manicure japoński" },
          { before: "1. Pakiet VIP, 2. Masaż 30min, 3. Masaż 60min", after: "1. Masaż 30min, 2. Masaż 60min, 3. Pakiet VIP" },
        ],
        temperature: 0.1,
        maxTokens: 4096,
      },
      {
        stage: "optimization_prices",
        displayName: "Formatowanie cen",
        description: "Instrukcje ujednolicania formatu cen w cenniku",
        promptContent: `=== FORMATOWANIE I UJEDNOLICANIE CEN ===

CEL: Ujednolić format wszystkich cen dla spójnego, profesjonalnego wyglądu.

STANDARDOWY FORMAT CEN:

1. POJEDYNCZA CENA:
   - "150 zł" (bez groszy dla pełnych kwot)
   - "149,50 zł" (z groszami gdy są)
   - NIE: "150.00 zł", "150 PLN", "150,-"

2. CENA OD:
   - "od 100 zł"
   - NIE: "od 100zł", "OD 100 zł", "100+ zł"

3. ZAKRES CEN:
   - "100 - 200 zł" (ze spacjami wokół myślnika)
   - NIE: "100-200 zł", "100zł-200zł", "100 do 200 zł"

4. CENA ZA JEDNOSTKĘ:
   - "50 zł / 30 min"
   - "100 zł / szt."
   - NIE: "50zł/30min"

ZASADY:
- NIE zmieniaj WARTOŚCI cen - tylko FORMAT
- Jeśli cena wygląda na błędną (np. "10 zł" za drogi zabieg) - zostaw jak jest
- Usuń "PLN" i zamień na "zł"
- Usuń niepotrzebne zera po przecinku (150,00 → 150)
- Popraw literówki (np. "zł" nie "zl" nie "ZŁ")

UWAGA: Ceny w opisach usług powinny być USUNIĘTE z opisu - są w osobnym polu.`,
        rules: [
          "Format: X zł (bez groszy dla pełnych kwot)",
          "Zakres: X - Y zł (ze spacjami)",
          "Cena od: od X zł",
          "NIE zmieniaj wartości cen, tylko format",
          "Usuń PLN, zamień na zł",
        ],
        examples: [
          { before: "150.00 PLN", after: "150 zł" },
          { before: "od 100zł do 200zł", after: "100 - 200 zł" },
          { before: "50 zl", after: "50 zł" },
          { before: "100,-", after: "100 zł" },
          { before: "od150", after: "od 150 zł" },
        ],
        temperature: 0.1,
        maxTokens: 4096,
      },
      {
        stage: "optimization_duplicates",
        displayName: "Duplikaty i literówki",
        description: "Instrukcje wykrywania zduplikowanych usług i poprawiania literówek",
        promptContent: `=== WYKRYWANIE DUPLIKATÓW I POPRAWIANIE LITERÓWEK ===

CEL: Zidentyfikuj potencjalne duplikaty i popraw oczywiste błędy, BEZ usuwania usług.

WYKRYWANIE DUPLIKATÓW:

Oznacz jako potencjalny duplikat gdy:
- Dwie usługi mają niemal identyczne nazwy (np. "Manicure klasyczny" i "Klasyczny manicure")
- Identyczna cena + bardzo podobny opis
- Ta sama usługa pod różnymi nazwami

JAK OZNACZAĆ DUPLIKATY:
- W polu OPIS dodaj na końcu: "[Możliwy duplikat z: nazwa_usługi]"
- NIE usuwaj żadnej usługi - tylko oznacz
- Decyzję o usunięciu podejmie właściciel salonu

POPRAWIANIE LITERÓWEK:

Popraw oczywiste błędy:
✓ "Manikure" → "Manicure"
✓ "Masaż relakacyjny" → "Masaż relaksacyjny"
✓ "Depilaca" → "Depilacja"
✓ "Hydrafaciall" → "Hydrafacial"
✓ Podwójne spacje, zbędne znaki

NIE poprawiaj:
✗ Nazw autorskich (mogą wyglądać na błędne, ale są celowe)
✗ Specyficznych terminów branżowych których nie rozpoznajesz
✗ Słów w innych językach

ZACHOWAJ WSZYSTKIE USŁUGI - tylko oznacz duplikaty i popraw literówki!`,
        rules: [
          "Nie usuwaj żadnych usług - tylko oznaczaj",
          "Duplikaty oznaczaj w opisie: [Możliwy duplikat z: ...]",
          "Poprawiaj tylko oczywiste literówki",
          "Nie zmieniaj nazw autorskich",
          "Zachowaj oryginalną liczbę usług",
        ],
        examples: [
          { before: "Manikure klasyczny", after: "Manicure klasyczny" },
          { before: "Masaż relakacyjny", after: "Masaż relaksacyjny" },
          { before: "Oczyszczanie twarzy (gdy istnieje też 'Twarz - oczyszczanie')", after: "Oczyszczanie twarzy [Możliwy duplikat z: Twarz - oczyszczanie]" },
        ],
        temperature: 0.1,
        maxTokens: 4096,
      },
      {
        stage: "optimization_duration",
        displayName: "Czas trwania usług",
        description: "Instrukcje ujednolicania i uzupełniania czasu trwania usług",
        promptContent: `=== CZAS TRWANIA USŁUG ===

CEL: Ujednolić format czasu i uzupełnić brakujące wartości dla usług bez podanego czasu.

STANDARDOWY FORMAT CZASU:

1. MINUTY (do 60 min):
   - "30 min", "45 min", "60 min"
   - NIE: "30min", "30 minut", "0:30"

2. GODZINY (powyżej 60 min):
   - "1h", "1h 30 min", "2h"
   - NIE: "1 godzina", "90 min" (dla 1h 30min)
   - Wyjątek: "90 min" jest OK gdy to standard w salonie

3. ZAKRES CZASU:
   - "30 - 45 min", "1h - 1h 30 min"
   - NIE: "30-45min", "ok. 30 min"

SZACOWANIE CZASU (gdy brak):

Typowe czasy dla usług beauty:
- Konsultacja: 15 - 30 min
- Manicure klasyczny: 30 - 45 min
- Manicure hybrydowy: 60 - 90 min
- Pedicure: 45 - 60 min
- Masaż częściowy: 30 min
- Masaż całego ciała: 60 - 90 min
- Peeling twarzy: 30 - 45 min
- Zabieg na twarz (pełny): 60 - 90 min
- Depilacja woskiem (nogi): 30 - 45 min
- Depilacja laserowa (mała strefa): 15 - 20 min
- Makijaż dzienny: 30 - 45 min
- Makijaż wieczorowy: 60 min
- Henna brwi: 15 - 20 min

ZASADY:
- Jeśli nie jesteś pewny czasu - zostaw pole puste (lepsze brak niż błędna wartość)
- Zaokrąglaj do 5 lub 15 minut
- Nie zgaduj czasów dla zabiegów specjalistycznych`,
        rules: [
          "Format: X min lub Xh Xmin",
          "Zaokrąglaj do 5 lub 15 minut",
          "Szacuj tylko dla typowych usług",
          "Gdy niepewny - zostaw puste",
          "Ujednolicaj istniejące czasy do standardowego formatu",
        ],
        examples: [
          { before: "30 minut", after: "30 min" },
          { before: "1 godzina", after: "1h" },
          { before: "90 min", after: "1h 30 min" },
          { before: "ok. 45min", after: "45 min" },
          { before: "(brak - manicure klasyczny)", after: "45 min" },
        ],
        temperature: 0.1,
        maxTokens: 4096,
      },
      {
        stage: "optimization_tags",
        displayName: "Tagi usług",
        description: "Instrukcje dodawania tagów promujących i kategoryzujących usługi",
        promptContent: `=== SYSTEM TAGÓW USŁUG ===

CEL: Dodaj tagi które wyróżnią kluczowe usługi i ułatwią klientom wybór.

DOSTĘPNE TAGI:

TAGI PROMOCYJNE (max 1 na usługę):
- "Bestseller" - najpopularniejsza usługa w kategorii (max 1-2 na kategorię)
- "Nowość" - nowa usługa w ofercie (max 1-2 na kategorię)
- "Hit" - zyskująca popularność

TAGI WARTOŚCI:
- "Premium" - usługa z wyższej półki
- "Luksus" - ekskluzywne zabiegi
- "Budget-friendly" - przystępna cenowo opcja

TAGI INFORMACYJNE:
- "Dla par" - usługa dla dwóch osób
- "Dla mężczyzn" - dedykowana mężczyznom
- "Pierwsza wizyta" - idealna na start

ZASADY TAGOWANIA:

1. NIE taguj wszystkiego - max 30% usług w kategorii
2. Jeden tag promujący na usługę (Bestseller LUB Nowość LUB Hit)
3. Można łączyć tag promujący z informacyjnym (np. "Bestseller, Dla par")
4. Max 2 tagi na usługę

KTÓRE USŁUGI TAGOWAĆ:
✓ Najpopularniejsze/najczęściej rezerwowane
✓ Usługi z najwyższą marżą
✓ Nowości w ofercie
✓ Usługi wyróżniające salon

KTÓRYCH NIE TAGOWAĆ:
✗ Podstawowych, standardowych usług
✗ Wszystkich usług w kategorii
✗ Usług z niską marżą

FORMAT W ODPOWIEDZI:
W kolumnie TAGI wpisz: "Bestseller" lub "Nowość, Premium" lub "-" (jeśli brak tagów)`,
        rules: [
          "Max 30% usług w kategorii z tagami",
          "Max 2 tagi na usługę",
          "Jeden tag promujący (Bestseller/Nowość/Hit)",
          "Można łączyć z tagiem informacyjnym",
          "Nie taguj podstawowych usług",
        ],
        examples: [
          { before: "Manicure hybrydowy (najpopularniejszy)", after: "Bestseller" },
          { before: "Masaż dla dwojga (nowy)", after: "Nowość, Dla par" },
          { before: "Konsultacja (podstawowa)", after: "-" },
          { before: "Zabieg anti-aging premium", after: "Premium" },
        ],
        temperature: 0.2,
        maxTokens: 4096,
      },
    ];

    for (const template of defaultTemplates) {
      // Sprawdź czy już istnieje
      const existing = await ctx.db
        .query("promptTemplates")
        .withIndex("by_stage", (q) => q.eq("stage", template.stage))
        .first();

      if (existing) {
        // Aktualizuj istniejący szablon
        await ctx.db.patch(existing._id, {
          ...template,
          updatedAt: now,
          version: existing.version + 1,
        });
      } else {
        await ctx.db.insert("promptTemplates", {
          ...template,
          updatedAt: now,
          version: 1,
          isActive: true,
        });
      }
    }

    return null;
  },
});

/**
 * Lista wszystkich użytkowników (tylko dla adminów)
 */
export const listUsers = query({
  args: { clerkId: v.string() },
  returns: v.array(v.object({
    _id: v.id("users"),
    email: v.string(),
    name: v.optional(v.string()),
    role: v.optional(v.union(v.literal("user"), v.literal("admin"))),
    credits: v.number(),
    createdAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const isAdmin = await isUserAdmin(ctx, args.clerkId);
    if (!isAdmin) {
      return [];
    }

    const users = await ctx.db.query("users").collect();

    return users.map(u => ({
      _id: u._id,
      email: u.email,
      name: u.name,
      role: u.role,
      credits: u.credits,
      createdAt: u.createdAt,
    }));
  },
});
