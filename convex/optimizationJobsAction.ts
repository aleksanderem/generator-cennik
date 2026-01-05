"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

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

interface ServiceInput {
  name: string;
  price: string;
  description?: string;
  duration?: string;
  isPromo?: boolean;
  tags?: string[];
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

      // Initialize Gemini
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY not configured");
      }

      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
          // Optimize single category with selected options
          const optimizedCategory = await optimizeSingleCategory(
            model,
            category,
            recommendations,
            pricingData.salonName,
            selectedOptions
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
      const sanitizedCategories = optimizedCategories.map(cat => ({
        categoryName: sanitizeString(cat.categoryName),
        services: cat.services.map(svc => ({
          name: sanitizeString(svc.name),
          price: sanitizeString(svc.price),
          description: svc.description ? sanitizeString(svc.description) : undefined,
          duration: svc.duration ? sanitizeString(svc.duration) : undefined,
          isPromo: svc.isPromo,
          tags: svc.tags?.map(t => sanitizeString(t)),
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
  selectedOptions: OptimizationOption[] = ["descriptions", "seo", "order", "prices", "duplicates", "duration", "tags"]
): Promise<OptimizedCategory> {
  const serviceCount = category.services.length;

  // Build dynamic prompt based on selected options
  let optionsInstructions = "";

  if (selectedOptions.includes("descriptions")) {
    optionsInstructions += `
[OPISY USŁUG] ✓
- Dodaj język korzyści do opisów (co klient zyskuje)
- Jakie efekty można się spodziewać
- Maksymalnie 2-3 zdania na opis (do 100 znaków)
- Jeśli usługa nie ma opisu, dodaj go
`;
  }

  if (selectedOptions.includes("seo")) {
    optionsInstructions += `
[SŁOWA KLUCZOWE SEO] ✓
- Użyj popularnych słów kluczowych w nazwach i opisach
- Słowa które klienci wyszukują (np. "depilacja laserowa", "mezoterapia", "botox")
`;
  }

  if (selectedOptions.includes("order")) {
    optionsInstructions += `
[KOLEJNOŚĆ USŁUG] ✓
- Najpopularniejsze/bestsellerowe usługi na początku
- Usługi premium wyżej
`;
  }

  if (selectedOptions.includes("prices")) {
    optionsInstructions += `
[FORMATOWANIE CEN] ✓
- Ujednolicić format cen (np. "od 50 zł" lub "50-100 zł")
- Popraw literówki w cenach
`;
  }

  if (selectedOptions.includes("duplicates")) {
    optionsInstructions += `
[DUPLIKATY I BŁĘDY] ✓
- Popraw oczywiste literówki w nazwach
- Oznacz podobne usługi w opisie
`;
  }

  if (selectedOptions.includes("duration")) {
    optionsInstructions += `
[CZAS TRWANIA] ✓
- Dodaj szacowany czas usługom bez czasu
- Format: "30 min", "1h", "1h 30min"
`;
  }

  if (selectedOptions.includes("tags")) {
    optionsInstructions += `
[TAGI] ✓
- Dodaj tagi: Bestseller, Nowość, Premium (max 1-2 na usługę)
- Nie wszystkim usługom (max 30%)
`;
  }

  // If no options selected, use minimal optimization
  if (!optionsInstructions) {
    optionsInstructions = `
[MINIMALNA OPTYMALIZACJA]
- Popraw oczywiste literówki
- NIE zmieniaj niczego innego
`;
  }

  const prompt = `Jesteś ekspertem od optymalizacji cenników dla salonów beauty.
Zoptymalizuj poniższą kategorię usług TYLKO w wybranych obszarach.

KRYTYCZNE ZASADY:
1. ZACHOWAJ DOKŁADNIE ${serviceCount} usług - NIE dodawaj, NIE usuwaj
2. NIE zmieniaj cen (chyba że zaznaczono formatowanie cen)
3. NIE używaj emoji
4. Zachowaj kolejność (chyba że zaznaczono kolejność usług)

WYBRANE OBSZARY OPTYMALIZACJI:
${optionsInstructions}

${recommendations.length > 0 ? `REKOMENDACJE Z AUDYTU:\n${recommendations.slice(0, 3).join("\n")}` : ""}

KATEGORIA: ${category.categoryName}
Salon: ${salonName || "Nieznany"}

USŁUGI (NUMER | NAZWA | CENA | OPIS | CZAS):
${category.services.map((svc, idx) =>
  `${idx + 1} | ${svc.name} | ${svc.price} | ${svc.description || "-"} | ${svc.duration || "-"}`
).join("\n")}

ODPOWIEDŹ - DOKŁADNIE ${serviceCount} linii:
NUMER | NAZWA | CENA | OPIS | CZAS | TAGI

Na końcu:
KATEGORIA: Nazwa kategorii

Odpowiedz TYLKO w podanym formacie.`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3, // Lower temperature for more consistent output
      maxOutputTokens: 4096,
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
        description: (parts[3] && parts[3] !== "-") ? parts[3] : originalService.description,
        duration: (parts[4] && parts[4] !== "-") ? parts[4] : originalService.duration,
        isPromo: originalService.isPromo || false,
        tags: originalService.tags,
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
        description: svc.description,
        duration: svc.duration,
        isPromo: svc.isPromo || false,
        tags: svc.tags,
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
