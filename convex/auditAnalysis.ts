"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// ============================================
// TYPES
// ============================================

export interface ScrapedData {
  salonName?: string;
  salonAddress?: string;
  salonLogoUrl?: string;
  categories: Array<{
    name: string;
    services: Array<{
      name: string;
      price: string;
      duration?: string;
      description?: string;
    }>;
  }>;
  totalServices: number;
}

export interface KeywordData {
  keyword: string;
  count: number;
  categories: string[];
  services: string[];
}

export interface CategoryDistribution {
  categoryName: string;
  keywordCount: number;
  topKeywords: string[];
}

interface KeywordReport {
  keywords: KeywordData[];
  categoryDistribution: CategoryDistribution[];
  suggestions: string[];
}

type CategoryChangeType =
  | "move_service"
  | "merge_categories"
  | "split_category"
  | "rename_category"
  | "reorder_categories"
  | "create_category";

interface CategoryChange {
  type: CategoryChangeType;
  description: string;
  fromCategory?: string;
  toCategory?: string;
  services?: string[];
  reason: string;
}

interface CategoryProposal {
  originalStructure: ScrapedData["categories"];
  proposedStructure: ScrapedData["categories"];
  changes: CategoryChange[];
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Strip markdown formatting from AI responses.
 * Removes bold (**), italic (*/_), headers (#), backticks, etc.
 */
function stripMarkdown(text: string): string {
  return text
    // Remove bold: **text** or __text__
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    // Remove italic: *text* or _text_ (be careful with underscores in words)
    .replace(/(?<!\w)\*([^*]+)\*(?!\w)/g, '$1')
    .replace(/(?<!\w)_([^_]+)_(?!\w)/g, '$1')
    // Remove inline code: `text`
    .replace(/`([^`]+)`/g, '$1')
    // Remove headers: # ## ### etc
    .replace(/^#{1,6}\s+/gm, '')
    // Remove strikethrough: ~~text~~
    .replace(/~~(.+?)~~/g, '$1')
    // Clean up any remaining asterisks at start/end
    .replace(/^\*+|\*+$/g, '')
    .trim();
}

// ============================================
// KEYWORD ANALYSIS
// ============================================

// Polish beauty industry keywords to look for
export const BEAUTY_KEYWORDS = [
  // Zabiegi na twarz
  "lifting", "mezoterapia", "botox", "kwas hialuronowy", "peeling", "mikrodermabrazja",
  "oczyszczanie", "nawilżanie", "odmładzanie", "redukcja zmarszczek", "ujędrnianie",
  "kolagen", "retinol", "witamina c", "hydrafacial", "peel", "laser", "rf",

  // Ciało
  "endermologia", "lipoliza", "kriolipoliza", "masaż", "drenaż limfatyczny",
  "cellulit", "rozstępy", "wyszczuplanie", "modelowanie", "ujędrnianie ciała",
  "karboksyterapia", "liposukcja", "cavitation", "ultradźwięki",

  // Depilacja
  "depilacja laserowa", "depilacja", "woskowanie", "ipl", "shr",
  "bikini", "nogi", "pachy", "twarz", "wąsik", "broda",

  // Paznokcie
  "manicure", "pedicure", "hybryda", "żel", "przedłużanie", "paznokcie",
  "stylizacja paznokci", "japoński",

  // Włosy
  "strzyżenie", "koloryzacja", "balayage", "ombre", "keratyna",
  "botox na włosy", "regeneracja", "laminowanie", "prostowanie",

  // Brwi i rzęsy
  "brwi", "rzęsy", "henna", "laminowanie brwi", "przedłużanie rzęs", "microblading",
  "pmu", "makijaż permanentny",

  // Inne
  "konsultacja", "pakiet", "promocja", "bestseller", "nowość", "premium",
  "relaks", "spa", "wellness", "detoks", "kroplówka", "infuzja",
];

/**
 * Extract and count keywords from scraped pricelist data.
 * This is a rule-based extraction (no AI needed).
 */
export function extractKeywords(scrapedData: ScrapedData): KeywordData[] {
  const keywordMap = new Map<string, KeywordData>();

  for (const category of scrapedData.categories) {
    for (const service of category.services) {
      const textToAnalyze = `${service.name} ${service.description || ""}`.toLowerCase();

      for (const keyword of BEAUTY_KEYWORDS) {
        if (textToAnalyze.includes(keyword.toLowerCase())) {
          const existing = keywordMap.get(keyword);
          if (existing) {
            existing.count++;
            if (!existing.categories.includes(category.name)) {
              existing.categories.push(category.name);
            }
            existing.services.push(service.name);
          } else {
            keywordMap.set(keyword, {
              keyword,
              count: 1,
              categories: [category.name],
              services: [service.name],
            });
          }
        }
      }
    }
  }

  // Sort by count descending
  return Array.from(keywordMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 50); // Top 50 keywords
}

/**
 * Calculate keyword distribution per category.
 */
export function calculateCategoryDistribution(
  scrapedData: ScrapedData,
  keywords: KeywordData[]
): CategoryDistribution[] {
  const distribution: CategoryDistribution[] = [];

  for (const category of scrapedData.categories) {
    const categoryKeywords = keywords.filter((k) =>
      k.categories.includes(category.name)
    );

    distribution.push({
      categoryName: category.name,
      keywordCount: categoryKeywords.length,
      topKeywords: categoryKeywords.slice(0, 5).map((k) => k.keyword),
    });
  }

  // Sort by keyword count descending
  return distribution.sort((a, b) => b.keywordCount - a.keywordCount);
}

/**
 * Generate AI suggestions for missing/recommended keywords.
 */
async function generateKeywordSuggestions(
  apiKey: string,
  scrapedData: ScrapedData,
  foundKeywords: KeywordData[]
): Promise<string[]> {
  const foundKeywordList = foundKeywords.map((k) => k.keyword).join(", ");
  const categoryList = scrapedData.categories.map((c) => c.name).join(", ");

  const prompt = `Jesteś ekspertem SEO dla salonów beauty na platformie Booksy.

KONTEKST:
- Salon: ${scrapedData.salonName || "Nieznany"}
- Kategorie: ${categoryList}
- Znalezione słowa kluczowe: ${foundKeywordList}
- Liczba usług: ${scrapedData.totalServices}

ZADANIE:
Zasugeruj 5-8 słów kluczowych SEO, które BRAKUJĄ w tym cenniku, a które pomogłyby w pozycjonowaniu na Booksy.

FORMAT ODPOWIEDZI:
- [słowo kluczowe 1]: [krótkie uzasadnienie dlaczego warto dodać]
- [słowo kluczowe 2]: [krótkie uzasadnienie]
...

ZASADY:
1. Sugeruj tylko słowa kluczowe pasujące do usług, które salon prawdopodobnie oferuje
2. Skup się na słowach, które klienci faktycznie wyszukują
3. Nie powtarzaj słów, które już są w cenniku
4. Używaj polskich nazw`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 1024,
        },
      }),
    }
  );

  if (!response.ok) {
    console.error("[KeywordSuggestions] Gemini API error:", response.status);
    return ["Dodaj słowa kluczowe opisujące efekty zabiegów", "Użyj popularnych nazw zabiegów"];
  }

  interface GeminiResponse {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  }

  const result = (await response.json()) as GeminiResponse;
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "";

  // Parse the suggestions from the response, stripping markdown formatting
  const suggestions: string[] = [];
  const lines = text.split("\n").filter((l) => l.trim().startsWith("-"));

  for (const line of lines) {
    const suggestion = stripMarkdown(line.replace(/^-\s*/, "").trim());
    if (suggestion) {
      suggestions.push(suggestion);
    }
  }

  return suggestions.slice(0, 8);
}

// ============================================
// CATEGORY PROPOSAL GENERATION
// ============================================

/**
 * Generate AI-powered category reorganization proposal.
 */
async function generateCategoryProposalWithAI(
  apiKey: string,
  scrapedData: ScrapedData,
  keywordReport: KeywordReport
): Promise<CategoryProposal> {
  const topKeywords = keywordReport.keywords.slice(0, 10).map((k) => k.keyword).join(", ");

  // Build category summary
  const categorySummary = scrapedData.categories
    .map((c) => `- ${c.name}: ${c.services.length} usług`)
    .join("\n");

  // Build services list (limited to avoid huge prompts)
  let servicesPreview = "";
  for (const cat of scrapedData.categories.slice(0, 5)) {
    servicesPreview += `\n## ${cat.name}\n`;
    for (const svc of cat.services.slice(0, 5)) {
      servicesPreview += `- ${svc.name}\n`;
    }
    if (cat.services.length > 5) {
      servicesPreview += `... i ${cat.services.length - 5} więcej\n`;
    }
  }

  const prompt = `Jesteś ekspertem UX salonów beauty. Zaproponuj OPTYMALNĄ strukturę kategorii.

OBECNA STRUKTURA:
${categorySummary}

PRZYKŁADOWE USŁUGI:
${servicesPreview}

TOP SŁOWA KLUCZOWE:
${topKeywords}

ZADANIE:
Zaproponuj reorganizację kategorii, która:
1. Ułatwi nowemu klientowi szybkie znalezienie usługi
2. Maksymalnie 8-12 głównych kategorii
3. Kategorie mają sens sprzedażowy (np. "Bestsellery", "Zabiegi na Twarz")
4. Duplikaty usług mogą być w wielu kategoriach (np. usługa w "Bestsellery" i w oryginalnej kategorii)

FORMAT ODPOWIEDZI:
PROPOSED_CATEGORIES:
- [Nazwa kategorii 1]
- [Nazwa kategorii 2]
...

CHANGES:
CHANGE: [move_service/merge_categories/split_category/rename_category/reorder_categories/create_category]
FROM: [nazwa obecnej kategorii lub "N/A"]
TO: [nazwa nowej/docelowej kategorii]
DESCRIPTION: [co dokładnie zmienić]
REASON: [dlaczego ta zmiana pomoże]
---
CHANGE: ...

ZASADY:
1. Każda zmiana musi mieć uzasadnienie biznesowe
2. Nie usuwaj usług - możesz je tylko przenosić lub duplikować
3. Zaproponuj max 10 zmian
4. Nie używaj emoji`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 3000,
        },
      }),
    }
  );

  if (!response.ok) {
    console.error("[CategoryProposal] Gemini API error:", response.status);
    throw new Error("Nie udało się wygenerować propozycji kategorii");
  }

  interface GeminiResponse {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  }

  const result = (await response.json()) as GeminiResponse;
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "";

  // Parse the AI response
  const changes: CategoryChange[] = [];
  const proposedCategoryNames: string[] = [];

  // Parse proposed categories (strip markdown formatting)
  const categorySection = text.match(/PROPOSED_CATEGORIES:([\s\S]*?)(?=CHANGES:|$)/i);
  if (categorySection) {
    const categoryLines = categorySection[1].split("\n").filter((l) => l.trim().startsWith("-"));
    for (const line of categoryLines) {
      const name = stripMarkdown(line.replace(/^-\s*/, "").trim());
      if (name) {
        proposedCategoryNames.push(name);
      }
    }
  }

  // Parse changes
  const changeBlocks = text.split(/---|\n(?=CHANGE:)/i).filter((b) => b.includes("CHANGE:"));

  for (const block of changeBlocks) {
    const typeMatch = block.match(/CHANGE:\s*(\w+)/i);
    const fromMatch = block.match(/FROM:\s*(.+?)(?=\n|$)/i);
    const toMatch = block.match(/TO:\s*(.+?)(?=\n|$)/i);
    const descMatch = block.match(/DESCRIPTION:\s*(.+?)(?=\n|REASON:|$)/is);
    const reasonMatch = block.match(/REASON:\s*(.+?)(?=\n|---|$)/is);

    if (typeMatch && descMatch && reasonMatch) {
      const changeType = typeMatch[1].toLowerCase() as CategoryChangeType;
      const validTypes: CategoryChangeType[] = [
        "move_service",
        "merge_categories",
        "split_category",
        "rename_category",
        "reorder_categories",
        "create_category",
      ];

      if (validTypes.includes(changeType)) {
        changes.push({
          type: changeType,
          description: stripMarkdown(descMatch[1].trim()),
          fromCategory: fromMatch?.[1]?.trim() !== "N/A" ? stripMarkdown(fromMatch?.[1]?.trim() || "") : undefined,
          toCategory: toMatch?.[1]?.trim() ? stripMarkdown(toMatch[1].trim()) : undefined,
          reason: stripMarkdown(reasonMatch[1].trim()),
        });
      }
    }
  }

  // Build proposed structure based on AI suggestions
  // For now, we keep the original structure and let the user decide
  // The "proposedStructure" will be populated by applying the changes
  const proposedStructure = buildProposedStructure(scrapedData.categories, changes, proposedCategoryNames);

  return {
    originalStructure: scrapedData.categories,
    proposedStructure,
    changes: changes.slice(0, 10),
  };
}

/**
 * Build proposed category structure by applying changes to original.
 * IMPORTANT: Copy full service data, not just names!
 */
function buildProposedStructure(
  original: ScrapedData["categories"],
  changes: CategoryChange[],
  proposedNames: string[]
): ScrapedData["categories"] {
  // Start with a DEEP copy of original - preserve all service data
  const proposed = JSON.parse(JSON.stringify(original)) as ScrapedData["categories"];

  // Build a map of all services for quick lookup
  const allServicesMap = new Map<string, ScrapedData["categories"][0]["services"][0]>();
  for (const cat of original) {
    for (const service of cat.services) {
      allServicesMap.set(service.name.toLowerCase().trim(), service);
    }
  }

  // Apply rename changes
  for (const change of changes) {
    if (change.type === "rename_category" && change.fromCategory && change.toCategory) {
      const cat = proposed.find((c) => c.name === change.fromCategory);
      if (cat) {
        cat.name = change.toCategory;
      }
    }
  }

  // Add new categories from AI suggestions WITH services
  for (const name of proposedNames) {
    const existingCat = proposed.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (!existingCat) {
      // For new categories like "Bestsellery", "Promocje" - populate with relevant services
      const newCat: ScrapedData["categories"][0] = { name, services: [] };

      // If it's a special category, try to populate it with relevant services
      const nameLower = name.toLowerCase();
      if (nameLower.includes("bestseller") || nameLower.includes("popularn")) {
        // Add first 3-5 services from the largest categories as "bestsellers"
        const largestCats = [...original].sort((a, b) => b.services.length - a.services.length);
        for (const cat of largestCats.slice(0, 3)) {
          for (const svc of cat.services.slice(0, 2)) {
            if (!newCat.services.find(s => s.name === svc.name)) {
              newCat.services.push({ ...svc });
            }
          }
        }
      } else if (nameLower.includes("promocj") || nameLower.includes("świąt") || nameLower.includes("ofert")) {
        // Look for services with promo indicators
        for (const cat of original) {
          for (const svc of cat.services) {
            const svcLower = (svc.name + (svc.description || "")).toLowerCase();
            if (svcLower.includes("promo") || svcLower.includes("pakiet") || svcLower.includes("zestaw") || svcLower.includes("rabat")) {
              if (!newCat.services.find(s => s.name === svc.name)) {
                newCat.services.push({ ...svc });
              }
            }
          }
        }
      }

      // Only add category if it has services or is explicitly proposed
      if (newCat.services.length > 0 || proposedNames.includes(name)) {
        proposed.push(newCat);
      }
    }
  }

  // Apply move_service changes
  for (const change of changes) {
    if (change.type === "move_service" && change.services && change.toCategory) {
      const targetCat = proposed.find(c => c.name === change.toCategory);
      if (targetCat) {
        for (const serviceName of change.services) {
          const fullService = allServicesMap.get(serviceName.toLowerCase().trim());
          if (fullService && !targetCat.services.find(s => s.name === fullService.name)) {
            targetCat.services.push({ ...fullService });
          }
        }
      }
    }
  }

  // Reorder if needed - put important categories first
  const priorityOrder = ["Bestsellery", "Promocje", "Nowości", "Zabiegi na Twarz", "Depilacja"];
  proposed.sort((a, b) => {
    const aIdx = priorityOrder.findIndex((p) => a.name.toLowerCase().includes(p.toLowerCase()));
    const bIdx = priorityOrder.findIndex((p) => b.name.toLowerCase().includes(p.toLowerCase()));
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return 0;
  });

  return proposed;
}

// ============================================
// INTERNAL ACTIONS & MUTATIONS
// ============================================

/**
 * Generate keyword report for an audit.
 * This action runs after scraping is complete.
 */
export const generateKeywordReport = internalAction({
  args: { auditId: v.id("audits") },
  returns: v.id("keywordReports"),
  handler: async (ctx, args) => {
    console.log(`[KeywordReport] Starting for audit ${args.auditId}`);

    const audit = await ctx.runQuery(internal.audits.getAuditInternal, {
      auditId: args.auditId,
    });

    if (!audit?.scrapedDataJson) {
      throw new Error("No scraped data found for keyword analysis");
    }

    const scrapedData: ScrapedData = JSON.parse(audit.scrapedDataJson);

    // Step 1: Extract keywords (rule-based, fast)
    console.log("[KeywordReport] Extracting keywords...");
    const keywords = extractKeywords(scrapedData);
    console.log(`[KeywordReport] Found ${keywords.length} keywords`);

    // Step 2: Calculate distribution
    const categoryDistribution = calculateCategoryDistribution(scrapedData, keywords);

    // Step 3: Generate AI suggestions for missing keywords
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    let suggestions: string[] = [];

    if (apiKey) {
      console.log("[KeywordReport] Generating AI suggestions...");
      try {
        suggestions = await generateKeywordSuggestions(apiKey, scrapedData, keywords);
      } catch (e) {
        console.error("[KeywordReport] AI suggestions failed:", e);
        suggestions = ["Nie udało się wygenerować sugestii"];
      }
    }

    // Save to database (mutations are in auditAnalysisQueries.ts - separate file for V8 runtime)
    const reportId: Id<"keywordReports"> = await ctx.runMutation(
      internal.auditAnalysisQueries.saveKeywordReport,
      {
        auditId: args.auditId,
        keywords,
        categoryDistribution,
        suggestions,
      }
    );

    console.log(`[KeywordReport] Saved report ${reportId}`);
    return reportId;
  },
});

/**
 * Generate category proposal for an audit.
 * Requires keyword report to be generated first.
 */
export const generateCategoryProposal = internalAction({
  args: {
    auditId: v.id("audits"),
    keywordReportId: v.id("keywordReports"),
  },
  returns: v.id("categoryProposals"),
  handler: async (ctx, args) => {
    console.log(`[CategoryProposal] Starting for audit ${args.auditId}`);

    const audit = await ctx.runQuery(internal.audits.getAuditInternal, {
      auditId: args.auditId,
    });

    if (!audit?.scrapedDataJson) {
      throw new Error("No scraped data found");
    }

    const keywordReport = await ctx.runQuery(internal.auditAnalysisQueries.getKeywordReport, {
      keywordReportId: args.keywordReportId,
    });

    if (!keywordReport) {
      throw new Error("Keyword report not found");
    }

    const scrapedData: ScrapedData = JSON.parse(audit.scrapedDataJson);

    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    console.log("[CategoryProposal] Generating AI proposal...");
    const proposal = await generateCategoryProposalWithAI(apiKey, scrapedData, keywordReport);

    // Save to database (mutations are in auditAnalysisQueries.ts - separate file for V8 runtime)
    const proposalId: Id<"categoryProposals"> = await ctx.runMutation(
      internal.auditAnalysisQueries.saveCategoryProposal,
      {
        auditId: args.auditId,
        originalStructureJson: JSON.stringify(proposal.originalStructure),
        proposedStructureJson: JSON.stringify(proposal.proposedStructure),
        changes: proposal.changes,
      }
    );

    console.log(`[CategoryProposal] Saved proposal ${proposalId}`);
    return proposalId;
  },
});

// ============================================
// DYNAMIC OPTIMIZATION PROMPT BUILDER
// ============================================

/**
 * Optimization option types matching schema.
 * These correspond to the toggles in the optimization UI.
 */
export type OptimizationOption =
  | "descriptions"  // Opisy usług (język korzyści)
  | "seo"           // Słowa kluczowe SEO
  | "categories"    // Struktura kategorii (wymaga accepted proposal)
  | "order"         // Kolejność usług
  | "prices"        // Formatowanie cen
  | "duplicates"    // Wykrywanie duplikatów
  | "duration"      // Szacowanie czasu trwania
  | "tags";         // Tagi (Bestseller/Nowość/Premium)

/**
 * Audit context for optimization - data from the audit analysis.
 */
export interface AuditContext {
  salonName?: string;
  overallScore?: number;
  weaknesses?: string[];
  suggestedKeywords?: string[];
  categoryProposalJson?: string;
}

/**
 * Build dynamic optimization prompt based on selected options.
 *
 * This function constructs a customized AI prompt that only includes
 * instructions for the optimization areas the user has selected.
 *
 * @param selectedOptions - Array of optimization options selected by user
 * @param auditContext - Context from the audit (scores, recommendations, keywords)
 * @param categoryServices - Services in the current category being optimized
 * @returns Formatted prompt string for AI optimization
 */
export function buildOptimizationPrompt(
  selectedOptions: OptimizationOption[],
  auditContext: AuditContext,
  categoryServices: Array<{
    name: string;
    price: string;
    description?: string;
    duration?: string;
  }>
): string {
  const serviceCount = categoryServices.length;

  // Base prompt header
  let prompt = `Jesteś ekspertem od optymalizacji cenników dla salonów beauty.
Zoptymalizuj poniższą listę usług zgodnie z WYBRANYMI OBSZARAMI.

KONTEKST AUDYTU:
- Salon: ${auditContext.salonName || "Nieznany"}
${auditContext.overallScore !== undefined ? `- Ocena ogólna: ${auditContext.overallScore}/100` : ""}
${auditContext.weaknesses?.length ? `- Słabe strony: ${auditContext.weaknesses.join(", ")}` : ""}

KRYTYCZNE ZASADY (zawsze przestrzegaj):
1. ZACHOWAJ DOKŁADNIE ${serviceCount} usług - NIE dodawaj, NIE usuwaj
2. NIE zmieniaj cen (chyba że wybrano "prices")
3. NIE używaj emoji w nazwach ani opisach
4. Zachowaj kolejność usług (chyba że wybrano "order")

WYBRANE OBSZARY OPTYMALIZACJI:
`;

  // Add section for each selected option
  if (selectedOptions.includes("descriptions")) {
    prompt += `
[OPISY USŁUG] ✓
- Dodaj język korzyści do opisów (co klient zyskuje)
- Dla kogo jest usługa (typ klienta/problemu)
- Jakie efekty można się spodziewać
- Maksymalnie 2-3 zdania na opis
- Jeśli usługa nie ma opisu, dodaj go
`;
  }

  if (selectedOptions.includes("seo")) {
    const keywords = auditContext.suggestedKeywords?.slice(0, 8).join(", ") || "brak";
    prompt += `
[SŁOWA KLUCZOWE SEO] ✓
- Dodaj do nazw/opisów następujące słowa kluczowe: ${keywords}
- Użyj słów naturalnie, nie jako spam
- Skup się na słowach, które klienci wyszukują
`;
  }

  if (selectedOptions.includes("categories") && auditContext.categoryProposalJson) {
    prompt += `
[STRUKTURA KATEGORII] ✓
- Zastosuj zatwierdzoną propozycję reorganizacji kategorii
- Przenieś usługi zgodnie z zatwierdzonym planem
`;
  }

  if (selectedOptions.includes("order")) {
    prompt += `
[KOLEJNOŚĆ USŁUG] ✓
- Umieść najpopularniejsze/bestsellerowe usługi na początku
- Usługi droższe/premium umieść wyżej (po bestsellerach)
- Grupuj podobne usługi obok siebie
`;
  }

  if (selectedOptions.includes("prices")) {
    prompt += `
[FORMATOWANIE CEN] ✓
- Ujednolić format cen (np. "od 50 zł" lub "50-100 zł")
- Popraw literówki w cenach
- Zaokrąglij ceny do pełnych dziesiątek jeśli to sensowne
`;
  }

  if (selectedOptions.includes("duplicates")) {
    prompt += `
[DUPLIKATY I BŁĘDY] ✓
- Oznacz usługi które wyglądają na duplikaty (podobne nazwy/ceny)
- Popraw oczywiste literówki w nazwach
- Zaproponuj połączenie duplikatów (dodaj notatkę w opisie)
`;
  }

  if (selectedOptions.includes("duration")) {
    prompt += `
[CZAS TRWANIA] ✓
- Dodaj szacowany czas trwania usługom, które go nie mają
- Format: "30 min", "1h", "1h 30min"
- Szacuj na podstawie typu usługi i ceny
`;
  }

  if (selectedOptions.includes("tags")) {
    prompt += `
[TAGI I OZNACZENIA] ✓
- Dodaj tagi: Bestseller (popularne), Nowość (nowe trendy), Premium (luksusowe)
- Maksymalnie 1-2 tagi na usługę
- Nie dodawaj tagów do wszystkich usług (max 30% usług)
`;
  }

  // Add services data
  prompt += `

USŁUGI DO OPTYMALIZACJI (format: NUMER | NAZWA | CENA | OPIS | CZAS):
${categoryServices.map((svc, idx) =>
  `${idx + 1} | ${svc.name} | ${svc.price} | ${svc.description || "-"} | ${svc.duration || "-"}`
).join("\n")}

ODPOWIEDŹ:
Zwróć DOKŁADNIE ${serviceCount} linii, każda w formacie:
NUMER | ZOPTYMALIZOWANA_NAZWA | CENA | NOWY_OPIS | CZAS | TAGI

Gdzie TAGI to lista tagów oddzielonych przecinkami (lub "-" jeśli brak).

Na końcu dodaj linię:
KATEGORIA: Zoptymalizowana nazwa kategorii

WAŻNE: Odpowiedz TYLKO liniami w podanym formacie, bez dodatkowego tekstu.`;

  return prompt;
}

/**
 * Check if optimization option requires another option.
 * For example, "categories" requires an accepted category proposal.
 */
export function validateOptimizationOptions(
  selectedOptions: OptimizationOption[],
  hasCategoryProposal: boolean
): { valid: boolean; error?: string } {
  if (selectedOptions.includes("categories") && !hasCategoryProposal) {
    return {
      valid: false,
      error: "Optymalizacja kategorii wymaga zatwierdzenia propozycji reorganizacji",
    };
  }

  if (selectedOptions.length === 0) {
    return {
      valid: false,
      error: "Wybierz co najmniej jeden obszar optymalizacji",
    };
  }

  return { valid: true };
}

// Note: Queries and mutations are defined in auditAnalysisQueries.ts
// (separate file without "use node" - required because Node.js runtime only supports actions)
