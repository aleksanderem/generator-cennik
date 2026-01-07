"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

// Type for prompt templates from database
interface PromptTemplate {
  promptContent: string;
  rules?: string[];
  examples?: { before: string; after: string }[];
  temperature?: number;
  maxTokens?: number;
}

type PromptTemplatesMap = Record<string, PromptTemplate>;

// ============================================
// OPTIMIZATION ACTION (runs in Node.js runtime)
// ============================================
// ARCHITECTURE: Uses chunked category-by-category processing
// to avoid JSON truncation issues with large pricelists.
// Each category is optimized separately, then assembled.
// Uses selectedOptions from user to customize optimization.
// ============================================

// Optimization option types
type OptimizationOption =
  | "descriptions"
  | "seo"
  | "categories"
  | "order"
  | "prices"
  | "duplicates"
  | "duration"
  | "tags";

interface ServiceVariant {
  label: string;
  price: string;
  duration?: string;
}

interface ServiceInput {
  name: string;
  price: string;
  description?: string;
  duration?: string;
  isPromo?: boolean;
  tags?: string[];
  variants?: ServiceVariant[];
}

interface CategoryInput {
  categoryName: string;
  services: ServiceInput[];
}

interface PricingDataInput {
  salonName?: string;
  categories: CategoryInput[];
}

interface OptimizedService {
  name: string;
  price: string;
  description?: string;
  duration?: string;
  isPromo: boolean;
  tags?: string[];
  variants?: ServiceVariant[];
}

interface OptimizedCategory {
  categoryName: string;
  services: OptimizedService[];
}

interface ChangeRecord {
  type: string;
  category?: string;
  service?: string;
  before?: string;
  after?: string;
  reason: string;
}

export const runOptimization = internalAction({
  args: { jobId: v.id("optimizationJobs") },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get job data
    const job = await ctx.runQuery(internal.optimizationJobs.getJobInternal, {
      jobId: args.jobId,
    });

    if (!job) {
      console.error("Job not found:", args.jobId);
      return null;
    }

    if (job.status !== "pending") {
      console.log("Job already processed:", args.jobId, job.status);
      return null;
    }

    // Update status to processing
    await ctx.runMutation(internal.optimizationJobs.updateJobProgress, {
      jobId: args.jobId,
      status: "processing",
      progress: 5,
      progressMessage: "Analizuję cennik...",
      currentStep: 1,
    });

    try {
      // Parse input data
      const pricingData: PricingDataInput = JSON.parse(job.inputPricingDataJson);
      const recommendations: string[] = job.auditRecommendationsJson
        ? JSON.parse(job.auditRecommendationsJson)
        : [];

      // Get selected optimization options from audit (if exists)
      let selectedOptions: OptimizationOption[] = [
        "descriptions", "seo", "order", "prices", "duplicates", "duration", "tags"
      ]; // Default: all options except categories

      if (job.auditId) {
        const optionsData = await ctx.runQuery(
          internal.auditAnalysisQueries.getOptimizationOptionsInternal,
          { auditId: job.auditId }
        );
        if (optionsData?.selectedOptions) {
          selectedOptions = optionsData.selectedOptions;
          console.log(`[Optimization] Using user-selected options: ${selectedOptions.join(", ")}`);
        }
      }

      // Fetch prompt templates from database (admin-configurable)
      let promptTemplates: PromptTemplatesMap = {};
      try {
        promptTemplates = await ctx.runQuery(internal.admin.getAllActivePromptTemplates, {});
        const templateCount = Object.keys(promptTemplates).length;
        if (templateCount > 0) {
          console.log(`[Optimization] Loaded ${templateCount} prompt templates from database`);
        }
      } catch (e) {
        console.log("[Optimization] No custom prompt templates found, using defaults");
      }

      // Initialize Gemini
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY not configured");
      }

      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(apiKey);
      // Using gemini-2.5-flash - fast AND follows instructions well (2.0-flash ignored rules, 2.5-pro too slow)
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const totalCategories = pricingData.categories.length;
      const optimizedCategories: OptimizedCategory[] = [];
      const allChanges: ChangeRecord[] = [];
      let totalServicesProcessed = 0;
      const totalServices = pricingData.categories.reduce(
        (acc, cat) => acc + cat.services.length, 0
      );

      console.log(`[Optimization] Starting chunked processing: ${totalCategories} categories, ${totalServices} services`);

      // Process each category separately to avoid JSON truncation
      for (let i = 0; i < totalCategories; i++) {
        const category = pricingData.categories[i];
        const categoryProgress = Math.round(10 + (i / totalCategories) * 75);

        await ctx.runMutation(internal.optimizationJobs.updateJobProgress, {
          jobId: args.jobId,
          progress: categoryProgress,
          progressMessage: `Optymalizuję kategorię ${i + 1}/${totalCategories}: ${category.categoryName}...`,
          currentStep: i + 1,
        });

        try {
          // Optimize single category with selected options and custom templates
          const optimizedCategory = await optimizeSingleCategory(
            model,
            category,
            recommendations,
            pricingData.salonName,
            selectedOptions,
            promptTemplates
          );

          // Validate service count matches
          if (optimizedCategory.services.length !== category.services.length) {
            console.warn(
              `[Optimization] Category "${category.categoryName}" service count mismatch: ` +
              `input=${category.services.length}, output=${optimizedCategory.services.length}. Using original.`
            );
            // Fallback: use original services with minimal cleanup
            optimizedCategories.push({
              categoryName: optimizedCategory.categoryName || category.categoryName,
              services: category.services.map(svc => ({
                name: svc.name,
                price: svc.price,
                description: svc.description,
                duration: svc.duration,
                isPromo: svc.isPromo || false,
                tags: svc.tags,
              })),
            });
          } else {
            optimizedCategories.push(optimizedCategory);

            // Track changes for this category
            for (let j = 0; j < category.services.length; j++) {
              const original = category.services[j];
              const optimized = optimizedCategory.services[j];

              if (original.name !== optimized.name) {
                allChanges.push({
                  type: "name_improved",
                  category: category.categoryName,
                  service: original.name,
                  before: original.name,
                  after: optimized.name,
                  reason: "Poprawiono nazwę dla lepszej czytelności",
                });
              }

              if (!original.description && optimized.description) {
                allChanges.push({
                  type: "description_added",
                  category: category.categoryName,
                  service: optimized.name,
                  before: "",
                  after: optimized.description,
                  reason: "Dodano opis usługi",
                });
              }
            }

            if (category.categoryName !== optimizedCategory.categoryName) {
              allChanges.push({
                type: "category_renamed",
                before: category.categoryName,
                after: optimizedCategory.categoryName,
                reason: "Poprawiono nazwę kategorii",
              });
            }
          }

          totalServicesProcessed += category.services.length;

        } catch (categoryError) {
          // If single category fails, use original data for that category
          console.error(`[Optimization] Failed to optimize category "${category.categoryName}":`, categoryError);
          optimizedCategories.push({
            categoryName: category.categoryName,
            services: category.services.map(svc => ({
              name: svc.name,
              price: svc.price,
              description: svc.description,
              duration: svc.duration,
              isPromo: svc.isPromo || false,
              tags: svc.tags,
            })),
          });
          totalServicesProcessed += category.services.length;
        }

        // Small delay between categories to avoid rate limiting
        if (i < totalCategories - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      // Verify step
      await ctx.runMutation(internal.optimizationJobs.updateJobProgress, {
        jobId: args.jobId,
        progress: 90,
        progressMessage: "Weryfikuję wyniki...",
        currentStep: totalCategories + 1,
      });

      // Build optimized pricing data
      const optimizedPricingData = {
        salonName: pricingData.salonName,
        categories: optimizedCategories,
      };

      // Final validation
      const outputServiceCount = optimizedCategories.reduce(
        (acc, cat) => acc + cat.services.length, 0
      );

      console.log(`[Optimization] Completed: ${optimizedCategories.length} categories, ${outputServiceCount} services`);
      console.log(`[Optimization] Changes tracked: ${allChanges.length}`);

      if (outputServiceCount !== totalServices) {
        console.warn(`[Optimization] Total service count mismatch: input=${totalServices}, output=${outputServiceCount}`);
      }

      // Build result summary
      const summary = {
        totalChanges: allChanges.length,
        duplicatesFound: allChanges.filter(c => c.type === "duplicate_merged").length,
        descriptionsAdded: allChanges.filter(c => c.type === "description_added").length,
        namesImproved: allChanges.filter(c => c.type === "name_improved").length,
        categoriesOptimized: allChanges.filter(c =>
          c.type === "category_renamed" || c.type === "category_reordered"
        ).length,
      };

      // Sanitize all string data to remove problematic characters
      // IMPORTANT: Preserve variants - they are nested price options from Booksy
      const sanitizedCategories = optimizedCategories.map(cat => ({
        categoryName: sanitizeString(cat.categoryName),
        services: cat.services.map(svc => ({
          name: sanitizeString(svc.name),
          price: sanitizeString(svc.price),
          description: svc.description ? sanitizeString(svc.description) : undefined,
          duration: svc.duration ? sanitizeString(svc.duration) : undefined,
          isPromo: svc.isPromo,
          tags: svc.tags?.map(t => sanitizeString(t)),
          // PRESERVE VARIANTS - nested price options from Booksy API
          variants: svc.variants?.map(v => ({
            label: sanitizeString(v.label),
            price: sanitizeString(v.price),
            duration: v.duration ? sanitizeString(v.duration) : undefined,
          })),
        })),
      }));

      const sanitizedPricingData = {
        salonName: pricingData.salonName ? sanitizeString(pricingData.salonName) : undefined,
        categories: sanitizedCategories,
      };

      const sanitizedChanges = allChanges.map(change => ({
        type: change.type,
        category: change.category ? sanitizeString(change.category) : undefined,
        service: change.service ? sanitizeString(change.service) : undefined,
        before: change.before ? sanitizeString(change.before) : undefined,
        after: change.after ? sanitizeString(change.after) : undefined,
        reason: sanitizeString(change.reason),
      }));

      const optimizationResult = {
        optimizedPricingData: sanitizedPricingData,
        changes: sanitizedChanges,
        summary,
        recommendations: recommendations.slice(0, 5).map(r => sanitizeString(r)),
        qualityScore: calculateQualityScore(sanitizedPricingData, sanitizedChanges),
      };

      // Validate JSON before saving
      const outputJson = JSON.stringify(sanitizedPricingData);
      const resultJson = JSON.stringify(optimizationResult);

      try {
        JSON.parse(outputJson);
        JSON.parse(resultJson);
        console.log(`[Optimization] JSON validated. PricingData: ${outputJson.length} chars, Result: ${resultJson.length} chars`);
      } catch (validationError) {
        console.error("[Optimization] Generated JSON is invalid:", validationError);
        throw new Error("Wygenerowane dane są nieprawidłowe. Spróbuj ponownie.");
      }

      // Save step
      await ctx.runMutation(internal.optimizationJobs.updateJobProgress, {
        jobId: args.jobId,
        progress: 95,
        progressMessage: "Zapisuję zoptymalizowany cennik...",
        currentStep: totalCategories + 2,
      });

      // Complete job
      await ctx.runMutation(internal.optimizationJobs.completeJob, {
        jobId: args.jobId,
        outputPricingDataJson: outputJson,
        optimizationResultJson: resultJson,
      });

      console.log("Optimization completed for job:", args.jobId);

    } catch (error) {
      console.error("Optimization failed:", error);

      // Build user-friendly error message
      const rawMessage = error instanceof Error ? error.message : "Nieznany błąd";
      const userFriendlyMessage = getUserFriendlyErrorMessage(rawMessage);
      const isOverloaded = rawMessage.includes("overloaded") || rawMessage.includes("503");

      await ctx.runMutation(internal.optimizationJobs.failJob, {
        jobId: args.jobId,
        errorMessage: userFriendlyMessage,
        shouldRetry: isOverloaded,
      });
    }

    return null;
  },
});

// Helper: Optimize a single category using plain text response (no JSON)
async function optimizeSingleCategory(
  model: any,
  category: CategoryInput,
  recommendations: string[],
  salonName?: string,
  selectedOptions: OptimizationOption[] = ["descriptions", "seo", "order", "prices", "duplicates", "duration", "tags"],
  promptTemplates: PromptTemplatesMap = {}
): Promise<OptimizedCategory> {
  const serviceCount = category.services.length;

  // Helper to get template or use default
  const getTemplateContent = (stage: string, defaultContent: string): string => {
    if (promptTemplates[stage]?.promptContent) {
      return promptTemplates[stage].promptContent;
    }
    return defaultContent;
  };

  // Helper to format examples from template
  const formatExamples = (stage: string): string => {
    const template = promptTemplates[stage];
    if (template?.examples && template.examples.length > 0) {
      return template.examples
        .map(ex => `- Przykład: "${ex.before}" → "${ex.after}"`)
        .join("\n");
    }
    return "";
  };

  // Build dynamic prompt based on selected options
  let optionsInstructions = "";

  // Default prompt contents (used if no database template exists)
  // These should match the templates in admin.ts initializeDefaultPromptTemplates

  const defaultDescriptions = `=== TWORZENIE PROFESJONALNYCH OPISÓW USŁUG ===

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
Usuń informację o cenie z opisu - zostaw tylko część merytoryczną.`;

  const defaultSeo = `=== OPTYMALIZACJA SEO NAZW USŁUG ===

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
Przykłady nazw do zachowania: "MS AquaLift", "BTX Lift Pro", "Endermologie LPG", "HydraFacial MD"`;

  const defaultOrder = `=== OPTYMALIZACJA KOLEJNOŚCI USŁUG ===

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

ZASADY GRUPOWANIA:
- Podobne usługi obok siebie (np. wszystkie manicure razem)
- Warianty od najtańszego do najdroższego
- Zachowaj logiczny przepływ (basic → advanced → premium)

UWAGA: Nie usuwaj ani nie dodawaj usług - tylko zmień ich kolejność!`;

  const defaultPrices = `=== FORMATOWANIE I UJEDNOLICANIE CEN ===

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

ZASADY:
- NIE zmieniaj WARTOŚCI cen - tylko FORMAT
- Usuń "PLN" i zamień na "zł"
- Usuń niepotrzebne zera po przecinku (150,00 → 150)
- Popraw literówki (np. "zł" nie "zl" nie "ZŁ")`;

  const defaultDuplicates = `=== WYKRYWANIE DUPLIKATÓW I POPRAWIANIE LITERÓWEK ===

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
Popraw oczywiste błędy: "Manikure" → "Manicure", "Masaż relakacyjny" → "Masaż relaksacyjny"
NIE poprawiaj nazw autorskich (mogą wyglądać na błędne, ale są celowe)

ZACHOWAJ WSZYSTKIE USŁUGI - tylko oznacz duplikaty i popraw literówki!`;

  const defaultDuration = `=== CZAS TRWANIA USŁUG ===

CEL: Ujednolić format czasu i uzupełnić brakujące wartości dla usług bez podanego czasu.

STANDARDOWY FORMAT CZASU:
- MINUTY: "30 min", "45 min", "60 min" (NIE: "30min", "30 minut")
- GODZINY: "1h", "1h 30 min", "2h" (NIE: "1 godzina", "90 min")
- ZAKRES: "30 - 45 min" (NIE: "30-45min", "ok. 30 min")

TYPOWE CZASY DLA USŁUG BEAUTY:
- Konsultacja: 15 - 30 min
- Manicure klasyczny: 30 - 45 min
- Manicure hybrydowy: 60 - 90 min
- Masaż częściowy: 30 min
- Masaż całego ciała: 60 - 90 min
- Peeling twarzy: 30 - 45 min
- Depilacja woskiem (nogi): 30 - 45 min

ZASADY:
- Jeśli nie jesteś pewny czasu - zostaw pole puste
- Zaokrąglaj do 5 lub 15 minut`;

  const defaultTags = `=== SYSTEM TAGÓW USŁUG ===

CEL: Dodaj tagi które wyróżnią kluczowe usługi i ułatwią klientom wybór.

DOSTĘPNE TAGI:
- "Bestseller" - najpopularniejsza usługa (max 1-2 na kategorię)
- "Nowość" - nowa usługa w ofercie
- "Hit" - zyskująca popularność
- "Premium" - usługa z wyższej półki
- "Dla par" - usługa dla dwóch osób
- "Dla mężczyzn" - dedykowana mężczyznom

ZASADY TAGOWANIA:
1. NIE taguj wszystkiego - max 30% usług w kategorii
2. Max 2 tagi na usługę
3. Jeden tag promujący na usługę (Bestseller LUB Nowość LUB Hit)

KTÓRE USŁUGI TAGOWAĆ:
✓ Najpopularniejsze/najczęściej rezerwowane
✓ Usługi z najwyższą marżą
✓ Nowości w ofercie

FORMAT: "Bestseller" lub "Nowość, Premium" lub "-" (jeśli brak tagów)`;

  if (selectedOptions.includes("descriptions")) {
    optionsInstructions += "\n" + getTemplateContent("optimization_descriptions", defaultDescriptions);
  }

  if (selectedOptions.includes("seo")) {
    let seoContent = getTemplateContent("optimization_seo", defaultSeo);
    const seoExamples = formatExamples("optimization_seo");
    if (seoExamples) {
      seoContent += "\n" + seoExamples;
    }
    optionsInstructions += "\n" + seoContent;
  }

  if (selectedOptions.includes("order")) {
    optionsInstructions += "\n" + getTemplateContent("optimization_order", defaultOrder);
  }

  if (selectedOptions.includes("prices")) {
    optionsInstructions += "\n" + getTemplateContent("optimization_prices", defaultPrices);
  }

  if (selectedOptions.includes("duplicates")) {
    optionsInstructions += "\n" + getTemplateContent("optimization_duplicates", defaultDuplicates);
  }

  if (selectedOptions.includes("duration")) {
    optionsInstructions += "\n" + getTemplateContent("optimization_duration", defaultDuration);
  }

  if (selectedOptions.includes("tags")) {
    optionsInstructions += "\n" + getTemplateContent("optimization_tags", defaultTags);
  }

  // If no options selected, use minimal optimization
  if (!optionsInstructions.trim()) {
    optionsInstructions = `
[MINIMALNA OPTYMALIZACJA]
- Popraw oczywiste literówki
- NIE zmieniaj niczego innego`;
  }

  // Get main rules from template or use defaults
  const defaultMainRules = `=== NIEPODWAŻALNE ZASADY OPTYMALIZACJI ===

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
- Zachowaj kolejność jak na wejściu`;

  let mainRules = getTemplateContent("optimization_main", defaultMainRules);
  // Replace ${serviceCount} placeholder in template
  mainRules = mainRules.replace(/\$\{serviceCount\}/g, String(serviceCount));

  const prompt = `Jesteś ekspertem od optymalizacji cenników dla salonów beauty.
Zoptymalizuj poniższą kategorię usług TYLKO w wybranych obszarach.

${mainRules}

WYBRANE OBSZARY OPTYMALIZACJI:
${optionsInstructions}

${recommendations.length > 0 ? `REKOMENDACJE Z AUDYTU:\n${recommendations.slice(0, 3).join("\n")}` : ""}

KATEGORIA: ${category.categoryName}
Salon: ${salonName || "Nieznany"}

USŁUGI (NUMER | NAZWA | CENA | OPIS | CZAS):
${category.services.map((svc, idx) =>
  `${idx + 1} | ${svc.name} | ${svc.price} | ${svc.description || "-"} | ${svc.duration || "-"}`
).join("\n")}

ODPOWIEDŹ - DOKŁADNIE ${serviceCount} linii w tej samej kolejności:
NUMER | ULEPSZONA_NAZWA | CENA | OPIS | CZAS | TAGI

WAŻNE:
- Linia 1 = ulepszona wersja usługi #1 z listy wejściowej
- Linia 2 = ulepszona wersja usługi #2 z listy wejściowej
- itd. NIE zamieniaj kolejności!

Na końcu:
KATEGORIA: Nazwa kategorii

Odpowiedz TYLKO w podanym formacie.`;

  // Get temperature from main template or use default
  const temperature = promptTemplates["optimization_main"]?.temperature ?? 0.1;
  const maxTokens = promptTemplates["optimization_main"]?.maxTokens ?? 4096;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  });

  const response = result.response;
  const text = response.text();

  if (!text) {
    throw new Error("Otrzymano pustą odpowiedź od AI");
  }

  // Parse line-by-line response
  const lines = text.split("\n").filter((line: string) => line.trim());
  const optimizedServices: OptimizedService[] = [];
  let newCategoryName = category.categoryName;

  for (const line of lines) {
    const trimmed = line.trim();

    // Check for category name line
    if (trimmed.startsWith("KATEGORIA:")) {
      newCategoryName = trimmed.replace("KATEGORIA:", "").trim() || category.categoryName;
      continue;
    }

    // Parse service line: NUMER | NAZWA | CENA | OPIS | CZAS
    const parts = trimmed.split("|").map((p: string) => p.trim());

    if (parts.length >= 3) {
      const indexPart = parseInt(parts[0], 10);

      // Skip if not a valid service line
      if (isNaN(indexPart) || indexPart < 1 || indexPart > serviceCount) {
        continue;
      }

      const originalService = category.services[indexPart - 1];
      if (!originalService) continue;

      const optimizedService: OptimizedService = {
        name: parts[1] || originalService.name,
        price: originalService.price, // Always keep original price
        // Clean AI-provided description or fallback to cleaned original
        description: cleanDescription((parts[3] && parts[3] !== "-") ? parts[3] : originalService.description),
        duration: (parts[4] && parts[4] !== "-") ? parts[4] : originalService.duration,
        isPromo: originalService.isPromo || false,
        tags: originalService.tags,
        // PRESERVE VARIANTS - nested price options from Booksy API
        variants: originalService.variants,
      };

      optimizedServices.push(optimizedService);
    }
  }

  // If parsing failed or count mismatch, fall back to original services
  if (optimizedServices.length !== serviceCount) {
    console.warn(
      `[Optimization] Parsing yielded ${optimizedServices.length} services instead of ${serviceCount}. ` +
      `Falling back to original data for category "${category.categoryName}".`
    );

    return {
      categoryName: newCategoryName,
      services: category.services.map(svc => ({
        name: svc.name,
        price: svc.price,
        // Clean description to remove markdown and prices from original Booksy data
        description: cleanDescription(svc.description),
        duration: svc.duration,
        isPromo: svc.isPromo || false,
        tags: svc.tags,
        // PRESERVE VARIANTS - nested price options from Booksy API
        variants: svc.variants,
      })),
    };
  }

  return {
    categoryName: newCategoryName,
    services: optimizedServices,
  };
}

// Helper: Sanitize string to remove characters that could break JSON
function sanitizeString(str: string): string {
  if (!str) return '';
  return str
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove control characters except newline and tab
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Replace problematic unicode characters
    .replace(/[\uFFFD\uFFFE\uFFFF]/g, '')
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Limit string length
    .substring(0, 2000)
    .trim();
}

// Helper: Clean description text - remove markdown and prices
function cleanDescription(desc: string | undefined): string {
  if (!desc) return '';

  let cleaned = desc
    // Remove bold markdown **text**
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    // Remove italic markdown *text*
    .replace(/\*([^*]+)\*/g, '$1')
    // Remove lines that are primarily prices/packages (e.g., "Pakiet 4 zabiegów: 1260 zł")
    .replace(/^.*(?:Pakiet|pakiet|PAKIET)\s+\d+\s+(?:zabiegów|zabiegu).*?zł.*$/gm, '')
    // Remove standalone price patterns like "od 250 zł" at start
    .replace(/^od\s+[\d\s,.]+\s*zł\s*$/gi, '')
    // Remove price mentions within text (careful to not break valid content)
    .replace(/\*\*Pakiet[^*]+\*\*/g, '')
    // Remove "**Laser Thunder MT...**" style technical specs
    .replace(/\*\*Laser[^*]+\*\*/g, '')
    .replace(/\*\*Qool-air\*\*/g, '')
    .replace(/\*\*\d+[–-]\d+\s+(?:zabiegów|tygodni)\*\*/g, '')
    // Clean up multiple newlines
    .replace(/\n{3,}/g, '\n\n')
    // Clean up leading/trailing whitespace
    .trim();

  // If description became empty or too short, return empty
  if (cleaned.length < 10) {
    return '';
  }

  return cleaned;
}

// Helper: Calculate quality score based on optimization results
function calculateQualityScore(
  pricingData: { categories: OptimizedCategory[] },
  changes: ChangeRecord[]
): number {
  let score = 50; // Base score

  const totalServices = pricingData.categories.reduce(
    (acc, cat) => acc + cat.services.length, 0
  );

  // +points for descriptions
  const servicesWithDesc = pricingData.categories.reduce(
    (acc, cat) => acc + cat.services.filter(s => s.description).length, 0
  );
  const descriptionRate = totalServices > 0 ? servicesWithDesc / totalServices : 0;
  score += Math.round(descriptionRate * 25);

  // +points for changes made
  if (changes.length > 0) {
    score += Math.min(changes.length * 2, 15);
  }

  // +points for consistent naming
  const avgNameLength = pricingData.categories.reduce(
    (acc, cat) => acc + cat.services.reduce((a, s) => a + s.name.length, 0), 0
  ) / Math.max(totalServices, 1);

  if (avgNameLength > 20 && avgNameLength < 60) {
    score += 10; // Good name length
  }

  return Math.min(Math.max(score, 0), 100);
}

// Helper: Convert technical errors to user-friendly messages
function getUserFriendlyErrorMessage(rawError: string): string {
  if (rawError.includes("Unterminated string") || rawError.includes("JSON")) {
    return "Wystąpił problem podczas przetwarzania odpowiedzi AI. Spróbuj ponownie.";
  }
  if (rawError.includes("overloaded") || rawError.includes("503")) {
    return "Serwer AI jest chwilowo przeciążony. Spróbuj ponownie za chwilę.";
  }
  if (rawError.includes("GEMINI_API_KEY")) {
    return "Błąd konfiguracji - skontaktuj się z administratorem.";
  }
  if (rawError.includes("timeout") || rawError.includes("ETIMEDOUT")) {
    return "Przekroczono czas oczekiwania. Spróbuj ponownie.";
  }
  if (rawError.includes("rate limit") || rawError.includes("429")) {
    return "Zbyt wiele zapytań. Poczekaj chwilę i spróbuj ponownie.";
  }
  // Default: return a generic but helpful message
  return "Optymalizacja nie powiodła się. Spróbuj ponownie lub skontaktuj się z pomocą techniczną.";
}
