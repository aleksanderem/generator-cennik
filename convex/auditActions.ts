"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  parseBooksyData,
  parseAuditReport,
  validateScrapedData,
  calculateAuditStats,
  type ScrapedData,
  type AuditReport,
  type AuditStats,
  type AuditIssue,
  type ServiceTransformation,
  type QuickWin,
  type ScoreBreakdown,
  type EnhancedAuditReport,
  type MissingSeoKeyword,
  type IssueSeverity,
  type AuditDimension,
} from "./auditHelpers";

// --- UTILITY FUNCTIONS ---

/**
 * Strip markdown formatting from AI responses.
 * Removes bold, italic, headers, backticks, etc.
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

// --- BOOKSY DIRECT API ---

// Booksy API configuration
const BOOKSY_API_BASE = "https://pl.booksy.com/core/v2/customer_api";
const BOOKSY_HEADERS = {
  "accept": "application/json, text/plain, */*",
  "accept-language": "pl-PL, pl",
  "x-access-token": "GACioqQNYSx5wVxsgNZfq2DHz5YvSOOt",
  "x-api-key": "web-e3d812bf-d7a2-445d-ab38-55589ae6a121",
  "x-app-version": "3.0",
  "x-fingerprint": "3bd6e818-f4e0-4f78-a2fa-da68498ff9a2",
};

interface BooksyServiceVariant {
  duration: number;
  price: number | null;
  service_price: string;
  label: string;
}

interface BooksyService {
  id: number;
  name: string;
  description?: string;
  price: number | null;
  service_price: string;
  variants?: BooksyServiceVariant[];
}

interface BooksyServiceCategory {
  id: number;
  name: string;
  services: BooksyService[];
}

interface BooksyBusiness {
  id: number;
  name: string;
  description?: string;
  photo?: string;
  location?: {
    address: string;
    city?: string;
  };
  reviews_rank?: number;
  reviews_count?: number;
  service_categories?: BooksyServiceCategory[];
}

interface BooksyApiResponse {
  business?: BooksyBusiness;
  error?: string;
}

/**
 * Extract business ID from Booksy URL.
 * Examples:
 * - https://booksy.com/pl-pl/98814_beauty4ever-ul-woloska-16_medycyna-estetyczna_3_warszawa
 * - Returns "98814"
 */
function extractBusinessId(url: string): string | null {
  // Pattern: /pl-pl/{businessId}_{slug}
  const match = url.match(/\/pl-pl\/(\d+)_/);
  return match ? match[1] : null;
}

/**
 * Fetch salon data directly from Booksy API.
 * This is faster and more reliable than web scraping.
 */
async function fetchFromBooksyApi(businessId: string): Promise<BooksyApiResponse> {
  const apiUrl = `${BOOKSY_API_BASE}/businesses/${businessId}/?no_thumbs=true&with_markdown=1&with_combos=1`;

  const response = await fetch(apiUrl, {
    method: "GET",
    headers: BOOKSY_HEADERS,
  });

  if (!response.ok) {
    throw new Error(`Booksy API error: ${response.status}`);
  }

  return await response.json() as BooksyApiResponse;
}

/**
 * Convert Booksy API response to ScrapedData format.
 * PRESERVES all data including variants - nothing is lost.
 */
function convertBooksyApiToScrapedData(apiResponse: BooksyApiResponse): ScrapedData {
  const business = apiResponse.business;
  if (!business) {
    throw new Error("No business data in API response");
  }

  const categories = (business.service_categories || []).map((cat) => ({
    name: cat.name,
    services: cat.services.map((svc) => {
      const booksyVariants = svc.variants || [];

      // Convert Booksy variants to our format - PRESERVE ALL
      const variants = booksyVariants.length > 0
        ? booksyVariants.map((v) => ({
            label: v.label,
            price: v.service_price || (v.price ? `${v.price} zł` : ""),
            duration: v.duration ? formatDuration(v.duration) : undefined,
          }))
        : undefined;

      // Get duration from first variant if service doesn't have one
      const firstVariant = booksyVariants[0];

      return {
        name: svc.name,
        price: svc.service_price || (svc.price ? `${svc.price} zł` : "Darmowa"),
        duration: firstVariant?.duration ? formatDuration(firstVariant.duration) : undefined,
        description: svc.description?.slice(0, 500),
        variants,
      };
    }),
  }));

  // Count total services INCLUDING variants
  let totalServices = 0;
  for (const cat of categories) {
    for (const svc of cat.services) {
      if (svc.variants && svc.variants.length > 0) {
        totalServices += svc.variants.length;
      } else {
        totalServices += 1;
      }
    }
  }

  return {
    salonName: business.name,
    salonAddress: business.location?.address,
    salonLogoUrl: business.photo,
    categories,
    totalServices,
    rawMarkdown: `Booksy API data for ${business.name}`,
  };
}

/**
 * Format duration in minutes to human-readable string.
 */
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}min`;
}

// --- FIRECRAWL FALLBACK (for non-Booksy URLs or API failures) ---

interface FirecrawlResponse {
  success: boolean;
  data?: {
    markdown?: string;
    html?: string;
  };
  error?: string;
}

/**
 * Scrape using Firecrawl as fallback method.
 */
async function scrapeWithFirecrawl(url: string): Promise<FirecrawlResponse> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY not configured");
  }

  const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url,
      formats: ["markdown"],
      waitFor: 5000,
      timeout: 90000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Firecrawl error: ${response.status} - ${errorText}`);
  }

  return await response.json() as FirecrawlResponse;
}

/**
 * Validate scraped data - throws on error for use in actions
 */
function validateScrapedDataOrThrow(data: ScrapedData): void {
  const error = validateScrapedData(data);
  if (error) {
    throw new Error(error.message);
  }
}

// --- MAIN SCRAPING ACTION ---

export const scrapeBooksyProfile = internalAction({
  args: { auditId: v.id("audits") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const audit = await ctx.runQuery(internal.audits.getAuditInternal, {
      auditId: args.auditId,
    });

    if (!audit || !audit.sourceUrl) {
      throw new Error("Audit or URL not found");
    }

    await ctx.runMutation(internal.audits.updateProgress, {
      auditId: args.auditId,
      status: "scraping",
      progress: 10,
      progressMessage: "Łączenie z Booksy...",
    });

    try {
      let parsedData: ScrapedData;

      // Try Booksy Direct API first (faster & more reliable)
      const businessId = extractBusinessId(audit.sourceUrl);

      if (businessId) {
        await ctx.runMutation(internal.audits.updateProgress, {
          auditId: args.auditId,
          progress: 20,
          progressMessage: "Pobieranie danych z API Booksy...",
        });

        try {
          const apiResponse = await fetchFromBooksyApi(businessId);
          parsedData = convertBooksyApiToScrapedData(apiResponse);
          console.log(`[Booksy API] Found ${parsedData.categories.length} categories, ${parsedData.totalServices} services`);
        } catch (apiError) {
          console.log(`[Booksy API] Failed: ${apiError}, falling back to Firecrawl`);
          // Fall through to Firecrawl
          parsedData = await scrapeWithFirecrawlFallback(audit.sourceUrl);
        }
      } else {
        // Non-Booksy URL or couldn't extract ID - use Firecrawl
        console.log("[Booksy API] Could not extract business ID, using Firecrawl");
        parsedData = await scrapeWithFirecrawlFallback(audit.sourceUrl);
      }

      await ctx.runMutation(internal.audits.updateProgress, {
        auditId: args.auditId,
        progress: 35,
        progressMessage: "Przetwarzanie danych cennika...",
      });

      validateScrapedDataOrThrow(parsedData);

      await ctx.runMutation(internal.audits.saveScrapedData, {
        auditId: args.auditId,
        scrapedDataJson: JSON.stringify(parsedData),
        categoriesCount: parsedData.categories.length,
        servicesCount: parsedData.totalServices,
        salonName: parsedData.salonName,
        salonAddress: parsedData.salonAddress,
        salonLogoUrl: parsedData.salonLogoUrl,
      });

      await ctx.scheduler.runAfter(0, internal.auditActions.analyzeWithAI, {
        auditId: args.auditId,
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Nieznany błąd";
      const retryCount = audit.retryCount || 0;

      await ctx.runMutation(internal.audits.handleScrapingError, {
        auditId: args.auditId,
        errorMessage,
        shouldRetry: retryCount < 3 && !errorMessage.includes("Za mało usług"),
      });
    }

    return null;
  },
});

/**
 * Firecrawl fallback for when Booksy API fails or URL is not from Booksy.
 */
async function scrapeWithFirecrawlFallback(sourceUrl: string): Promise<ScrapedData> {
  const firecrawlResult = await scrapeWithFirecrawl(sourceUrl);

  if (!firecrawlResult.success) {
    throw new Error(firecrawlResult.error || "Nie udało się pobrać danych ze strony");
  }

  const rawMarkdown = firecrawlResult.data?.markdown || "";
  if (!rawMarkdown) {
    throw new Error("Nie udało się pobrać danych ze strony");
  }

  return parseBooksyData(rawMarkdown, firecrawlResult.data?.html);
}

// --- AI ANALYSIS ---

/**
 * Generate audit report using chunked approach.
 * Splits the analysis into multiple smaller AI calls to avoid JSON truncation.
 */
async function generateAuditReport(scrapedDataJson: string): Promise<AuditReport> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const scrapedData: ScrapedData = JSON.parse(scrapedDataJson);

  // Build a summary of the pricelist (limited to avoid huge prompts)
  const pricelistSummary = buildPricelistSummary(scrapedData);

  // Step 1: Get core analysis (score, feedback, strengths, weaknesses)
  console.log("[Audit] Step 1: Generating core analysis...");
  const coreAnalysis = await generateCoreAnalysis(apiKey, scrapedData, pricelistSummary);

  // Step 2: Get recommendations and beforeAfter
  console.log("[Audit] Step 2: Generating recommendations...");
  const recommendations = await generateRecommendations(apiKey, scrapedData, pricelistSummary);

  // Step 3: Get growth tips
  console.log("[Audit] Step 3: Generating growth tips...");
  const growthTips = await generateGrowthTips(apiKey, scrapedData, pricelistSummary);

  // Combine all parts into final report
  const report: AuditReport = {
    overallScore: coreAnalysis.overallScore,
    generalFeedback: coreAnalysis.generalFeedback,
    salesPotential: coreAnalysis.salesPotential,
    strengths: coreAnalysis.strengths,
    weaknesses: coreAnalysis.weaknesses,
    recommendations: recommendations.recommendations,
    beforeAfter: recommendations.beforeAfter,
    growthTips: growthTips,
  };

  console.log("[Audit] Report generation complete");
  return report;
}

/**
 * Build a condensed summary of the pricelist for AI prompts.
 * Limits to first few services per category to avoid huge prompts.
 */
function buildPricelistSummary(scrapedData: ScrapedData): string {
  const maxServicesPerCategory = 5;
  const maxCategories = 10;

  const categories = scrapedData.categories.slice(0, maxCategories);

  let summary = `SALON: ${scrapedData.salonName || "Nieznany"}
ADRES: ${scrapedData.salonAddress || "Nieznany"}
STATYSTYKI: ${scrapedData.categories.length} kategorii, ${scrapedData.totalServices} usług

PRZYKŁADOWE USŁUGI:\n`;

  for (const cat of categories) {
    summary += `\n## ${cat.name} (${cat.services.length} usług)\n`;
    const services = cat.services.slice(0, maxServicesPerCategory);
    for (const s of services) {
      summary += `- ${s.name}: ${s.price}`;
      if (s.duration) summary += ` (${s.duration})`;
      if (s.description) summary += ` - ${s.description.substring(0, 50)}...`;
      summary += "\n";
    }
    if (cat.services.length > maxServicesPerCategory) {
      summary += `  ... i ${cat.services.length - maxServicesPerCategory} więcej usług\n`;
    }
  }

  if (scrapedData.categories.length > maxCategories) {
    summary += `\n... i ${scrapedData.categories.length - maxCategories} więcej kategorii\n`;
  }

  return summary;
}

/**
 * Generate core analysis: score, feedback, strengths, weaknesses
 */
async function generateCoreAnalysis(
  apiKey: string,
  scrapedData: ScrapedData,
  pricelistSummary: string
): Promise<{
  overallScore: number;
  generalFeedback: string;
  salesPotential: string;
  strengths: string[];
  weaknesses: Array<{ point: string; consequence: string }>;
}> {
  const prompt = `Jesteś audytorem cenników salonów beauty.

${pricelistSummary}

ZADANIE: Oceń cennik i odpowiedz w formacie:

SCORE: [liczba 0-100]
FEEDBACK: [2-3 zdania podsumowania]
POTENTIAL: [Niski/Średni/Wysoki] - [krótkie uzasadnienie]

STRENGTHS:
- [mocna strona 1]
- [mocna strona 2]
- [mocna strona 3]

WEAKNESSES:
- [problem 1] | [konsekwencja dla klienta]
- [problem 2] | [konsekwencja dla klienta]
- [problem 3] | [konsekwencja dla klienta]

WAŻNE: Nie używaj JSON. Odpowiedz dokładnie w podanym formacie tekstowym.`;

  const text = await callGeminiText(apiKey, prompt);

  // Parse the structured text response
  const lines = text.split("\n").map((l: string) => l.trim()).filter((l: string) => l);

  let overallScore = 50;
  let generalFeedback = "";
  let salesPotential = "Średni";
  const strengths: string[] = [];
  const weaknesses: Array<{ point: string; consequence: string }> = [];

  let section = "";
  for (const line of lines) {
    if (line.startsWith("SCORE:")) {
      const match = line.match(/\d+/);
      if (match) overallScore = Math.min(100, Math.max(0, parseInt(match[0], 10)));
    } else if (line.startsWith("FEEDBACK:")) {
      generalFeedback = line.replace("FEEDBACK:", "").trim();
    } else if (line.startsWith("POTENTIAL:")) {
      salesPotential = line.replace("POTENTIAL:", "").trim();
    } else if (line.startsWith("STRENGTHS:")) {
      section = "strengths";
    } else if (line.startsWith("WEAKNESSES:")) {
      section = "weaknesses";
    } else if (line.startsWith("-")) {
      const content = stripMarkdown(line.substring(1).trim());
      if (section === "strengths" && content) {
        strengths.push(content);
      } else if (section === "weaknesses" && content) {
        const parts = content.split("|").map((p: string) => stripMarkdown(p.trim()));
        weaknesses.push({
          point: parts[0] || content,
          consequence: parts[1] || "Wpływa negatywnie na doświadczenie klienta",
        });
      }
    }
  }

  // Ensure we have at least some data
  if (strengths.length === 0) {
    strengths.push("Cennik jest dostępny online");
  }
  if (weaknesses.length === 0) {
    weaknesses.push({ point: "Brak szczegółowej analizy", consequence: "Wymaga weryfikacji" });
  }

  return { overallScore, generalFeedback, salesPotential, strengths, weaknesses };
}

/**
 * Generate recommendations and before/after example
 */
async function generateRecommendations(
  apiKey: string,
  scrapedData: ScrapedData,
  pricelistSummary: string
): Promise<{
  recommendations: string[];
  beforeAfter: { before: string; after: string; explanation: string };
}> {
  // Find a real service name for the before/after example
  const sampleService = scrapedData.categories[0]?.services[0];
  const sampleName = sampleService?.name || "Zabieg kosmetyczny";

  const prompt = `Jesteś ekspertem od optymalizacji cenników beauty.

${pricelistSummary}

ZADANIE: Podaj rekomendacje i przykład poprawy.

RECOMMENDATIONS:
- [konkretna rekomendacja 1]
- [konkretna rekomendacja 2]
- [konkretna rekomendacja 3]
- [konkretna rekomendacja 4]
- [konkretna rekomendacja 5]

BEFORE_AFTER:
BEFORE: ${sampleName}
AFTER: [poprawiona wersja nazwy "${sampleName}"]
EXPLANATION: [dlaczego zmiana jest lepsza]

WAŻNE:
- Rekomendacje muszą być konkretne i praktyczne
- W BEFORE użyj dokładnie nazwy "${sampleName}" z oryginalnego cennika
- Nie używaj JSON ani emoji`;

  const text = await callGeminiText(apiKey, prompt);

  const lines = text.split("\n").map((l: string) => l.trim()).filter((l: string) => l);

  const recommendations: string[] = [];
  let beforeAfter = {
    before: sampleName,
    after: sampleName + " - Profesjonalny Zabieg",
    explanation: "Dodano opis korzyści dla klienta",
  };

  let section = "";
  for (const line of lines) {
    if (line.startsWith("RECOMMENDATIONS:")) {
      section = "recommendations";
    } else if (line.startsWith("BEFORE_AFTER:")) {
      section = "beforeafter";
    } else if (line.startsWith("BEFORE:")) {
      beforeAfter.before = line.replace("BEFORE:", "").trim() || sampleName;
    } else if (line.startsWith("AFTER:")) {
      beforeAfter.after = line.replace("AFTER:", "").trim() || beforeAfter.after;
    } else if (line.startsWith("EXPLANATION:")) {
      beforeAfter.explanation = line.replace("EXPLANATION:", "").trim() || beforeAfter.explanation;
    } else if (line.startsWith("-") && section === "recommendations") {
      const content = stripMarkdown(line.substring(1).trim());
      if (content) recommendations.push(content);
    }
  }

  if (recommendations.length === 0) {
    recommendations.push("Dodaj opisy do wszystkich usług");
    recommendations.push("Uporządkuj kategorie według popularności");
    recommendations.push("Dodaj czas trwania do każdej usługi");
  }

  return { recommendations, beforeAfter };
}

type GrowthTipCategory = "SEO" | "Konwersja" | "Retencja" | "Wizerunek";
type GrowthTipImpact = "Wysoki" | "Średni" | "Niski";

interface GrowthTip {
  category: GrowthTipCategory;
  title: string;
  description: string;
  impact: GrowthTipImpact;
}

/**
 * Generate growth tips
 */
async function generateGrowthTips(
  apiKey: string,
  scrapedData: ScrapedData,
  pricelistSummary: string
): Promise<GrowthTip[]> {
  const prompt = `Jesteś strategiem marketingu dla salonów beauty.

${pricelistSummary}

ZADANIE: Podaj 4 porady wzrostu dla tego salonu.

FORMAT (każda porada w nowej linii):
TIP: [SEO/Konwersja/Retencja/Wizerunek] | [tytuł porady] | [opis 1-2 zdania] | [Wysoki/Średni/Niski]

Przykład:
TIP: SEO | Słowa kluczowe w nazwach | Dodaj popularne frazy jak "lifting" czy "odmładzanie" do nazw usług | Wysoki

Podaj dokładnie 4 porady, każda w formacie TIP:`;

  const text = await callGeminiText(apiKey, prompt);

  const lines = text.split("\n").map((l: string) => l.trim()).filter((l: string) => l);

  const tips: GrowthTip[] = [];
  const validCategories: GrowthTipCategory[] = ["SEO", "Konwersja", "Retencja", "Wizerunek"];
  const validImpacts: GrowthTipImpact[] = ["Wysoki", "Średni", "Niski"];

  for (const line of lines) {
    if (line.startsWith("TIP:")) {
      const content = line.replace("TIP:", "").trim();
      const parts = content.split("|").map((p: string) => p.trim());

      if (parts.length >= 4) {
        const category = parts[0] as GrowthTipCategory;
        const impact = parts[3] as GrowthTipImpact;

        tips.push({
          category: validCategories.includes(category) ? category : "Konwersja",
          title: parts[1] || "Porada",
          description: parts[2] || "Szczegóły do uzupełnienia",
          impact: validImpacts.includes(impact) ? impact : "Średni",
        });
      }
    }
  }

  // Ensure at least some tips
  if (tips.length === 0) {
    tips.push({
      category: "SEO",
      title: "Optymalizacja nazw usług",
      description: "Dodaj słowa kluczowe do nazw usług, które klienci wyszukują",
      impact: "Wysoki",
    });
    tips.push({
      category: "Konwersja",
      title: "Opisy usług",
      description: "Dodaj krótkie, przekonujące opisy do każdej usługi",
      impact: "Wysoki",
    });
  }

  return tips.slice(0, 4);
}

// --- ENHANCED AUDIT FUNCTIONS (V2) ---

/**
 * Build full pricelist for AI analysis (not limited like buildPricelistSummary).
 * For very large pricelists, we chunk and process separately.
 */
function buildFullPricelistText(data: ScrapedData, maxServices: number = 150): string {
  let text = `SALON: ${data.salonName || "Nieznany"}\n\n`;
  let serviceCount = 0;

  for (const cat of data.categories) {
    text += `\n## KATEGORIA: ${cat.name} (${cat.services.length} usług)\n`;

    for (const s of cat.services) {
      if (serviceCount >= maxServices) {
        text += `\n[... i jeszcze ${data.totalServices - serviceCount} usług]\n`;
        return text;
      }

      text += `- "${s.name}" | ${s.price}`;
      if (s.duration) text += ` | ${s.duration}`;
      if (s.description) text += ` | OPIS: ${s.description.substring(0, 100)}`;
      text += "\n";
      serviceCount++;
    }
  }

  return text;
}

/**
 * Analyze service names and return scoring + issues.
 */
async function analyzeNamingQuality(
  apiKey: string,
  data: ScrapedData,
  stats: AuditStats
): Promise<{
  score: number;
  issues: AuditIssue[];
  transformations: ServiceTransformation[];
}> {
  const pricelistText = buildFullPricelistText(data, 100);

  const prompt = `Jesteś ekspertem od copywritingu dla salonów beauty w Polsce.

${pricelistText}

ZADANIE: Oceń JAKOŚĆ NAZW usług i WYCZYŚĆ zbędne elementy. Skala 0-20 punktów.

KRYTERIA:
- Czy nazwy są KRÓTKIE i ZROZUMIAŁE? (ideał: 2-6 słów, max 40 znaków)
- Czy nie zawierają MARKETINGOWYCH BZDUR? (typu "100% skuteczności", "gładkość na długo")
- Czy są UNIKALNE? (brak duplikatów)

TWOJE ZADANIE TO CZYSZCZENIE NAZW - USUWANIE ZBĘDNYCH ELEMENTÓW:

1. USUŃ marketingowe sufiksy po myślniku lub dwukropku:
   ZŁE: "Pachy + Całe nogi - 100% skuteczności niezależnie od koloru skóry"
   DOBRE: "Pachy + Całe nogi"

2. USUŃ frazesy korzyści:
   ZŁE: "Mezoterapia: głębokie nawilżenie i odmłodzenie"
   DOBRE: "Mezoterapia"

3. USUŃ instrukcje i notatki:
   ZŁE: "Ramiona: łączyć z przedramionami"
   DOBRE: "Ramiona"

4. USUŃ zbędne opisy w nawiasach (chyba że to istotna informacja):
   ZŁE: "Depilacja (trwałe efekty gładkiej skóry)"
   DOBRE: "Depilacja"
   OK: "Depilacja (pachy + bikini)" - to jest OK bo określa zakres

5. NIE DODAWAJ niczego do nazw - tylko USUWAJ zbędne elementy

PRZYKŁADY TRANSFORMACJI:
- "Pachy + Całe nogi - 100% skuteczności" → "Pachy + Całe nogi"
- "Mezoterapia igłowa: odmłodzenie skóry twarzy" → "Mezoterapia igłowa twarzy"
- "2 okolice małe: wąsik + broda / pachy + wąsik" → "2 okolice małe"
- "Masaż relaksacyjny - pełen relaks i odprężenie" → "Masaż relaksacyjny"

FORMAT ODPOWIEDZI:

SCORE: [0-20]

TOP_ISSUES:
ISSUE: [critical/major/minor] | naming | [opis problemu] | [wpływ] | [ile usług] | [przykład] | [jak naprawić]

TRANSFORMATIONS:
TRANSFORM: name | [oryginalna nazwa ZE ŚMIECIAMI] | [OCZYSZCZONA krótka nazwa] | [co usunięto] | [wpływ 1-10]

Podaj TRANSFORM tylko dla nazw które mają zbędne elementy do usunięcia. Jeśli nazwa jest już krótka i czysta - NIE zmieniaj jej.`;

  const text = await callGeminiText(apiKey, prompt);
  return parseNamingAnalysis(text);
}

function parseNamingAnalysis(text: string): {
  score: number;
  issues: AuditIssue[];
  transformations: ServiceTransformation[];
} {
  const lines = text.split("\n").map(l => l.trim()).filter(l => l);
  let score = 10;
  const issues: AuditIssue[] = [];
  const transformations: ServiceTransformation[] = [];
  const transformedNames = new Set<string>(); // Track to avoid duplicates

  for (const line of lines) {
    if (line.startsWith("SCORE:")) {
      const match = line.match(/\d+/);
      if (match) score = Math.min(20, Math.max(0, parseInt(match[0], 10)));
    } else if (line.startsWith("ISSUE:")) {
      const parts = line.replace("ISSUE:", "").split("|").map(p => stripMarkdown(p.trim()));
      if (parts.length >= 7) {
        const example = parts[5] || "";
        const fix = parts[6] || "";

        issues.push({
          severity: (parts[0] as IssueSeverity) || "minor",
          dimension: (parts[1] as AuditDimension) || "naming",
          issue: parts[2] || "",
          impact: parts[3] || "",
          affectedCount: parseInt(parts[4], 10) || 1,
          example,
          fix,
        });

        // IMPORTANT: Extract transformations from ISSUE fix suggestions
        // If the fix looks like an improved name (contains the original + extra text),
        // create a transformation entry automatically
        if (example && fix) {
          // Parse example - might be comma-separated like: "Konsultacja", "MS AquaLift"
          const exampleNames = example
            .split(/[,;]/)
            .map(n => n.replace(/^["'„""'']+|["'„""'']+$/g, '').trim())
            .filter(n => n.length > 2);

          // Extract all quoted strings from fix text
          // Pattern: "Some Name: with improvement" or 'Some Name - with details'
          const quotedStrings = fix.match(/["'„""''][^"'„""'']+["'„""'']/g) || [];
          const cleanQuotedStrings = quotedStrings.map(s =>
            s.replace(/^["'„""'']+|["'„""'']+$/g, '').trim()
          );

          // For each example name, find a CLEANED (shorter) version in fix
          for (const originalName of exampleNames) {
            const normalizedOriginal = originalName.toLowerCase();
            if (transformedNames.has(normalizedOriginal)) continue;

            // Look for cleaned version: shorter than original, or original starts with candidate
            for (const candidate of cleanQuotedStrings) {
              const candidateLower = candidate.toLowerCase();

              // Check if candidate is a cleaned version of original:
              // 1. Original name starts with candidate (candidate is prefix)
              // 2. Candidate is shorter than original
              // 3. Candidate is at least 3 chars
              const isCleanedVersion =
                (normalizedOriginal.startsWith(candidateLower) ||
                 normalizedOriginal.includes(candidateLower + ":") ||
                 normalizedOriginal.includes(candidateLower + " -")) &&
                candidate.length < originalName.length &&
                candidate.length >= 3;

              if (isCleanedVersion && validateNameTransformation(originalName, candidate)) {
                transformedNames.add(normalizedOriginal);
                transformations.push({
                  type: "name",
                  serviceName: originalName,
                  before: originalName,
                  after: candidate,
                  reason: "Cleaned from issue fix suggestion",
                  impactScore: 6,
                });
                console.log(`[parseNamingAnalysis] Extracted CLEANED name from ISSUE: "${originalName}" -> "${candidate}"`);
                break;
              }
            }
          }
        }
      }
    } else if (line.startsWith("TRANSFORM:")) {
      const parts = line.replace("TRANSFORM:", "").split("|").map(p => stripMarkdown(p.trim()));
      if (parts.length >= 5) {
        const before = parts[1] || "";
        const after = parts[2] || "";
        const normalizedBefore = before.toLowerCase().trim();

        // VALIDATION: Reject bad transformations
        const isValidTransform = validateNameTransformation(before, after);

        // Skip if we already have a transformation for this name or if invalid
        if (!transformedNames.has(normalizedBefore) && isValidTransform) {
          transformedNames.add(normalizedBefore);
          transformations.push({
            type: "name",
            serviceName: before,
            before,
            after,
            reason: parts[3] || "",
            impactScore: parseInt(parts[4], 10) || 5,
          });
        } else if (!isValidTransform) {
          console.log(`[parseNamingAnalysis] REJECTED invalid transform: "${before}" -> "${after}"`);
        }
      }
    }
  }

  return { score, issues: issues.slice(0, 5), transformations: transformations.slice(0, 10) };
}

/**
 * Validate that a name transformation is sensible.
 * NEW PHILOSOPHY: Transformations should CLEAN (shorten) names, not add to them.
 */
function validateNameTransformation(before: string, after: string): boolean {
  // Rule 1: After name should be SHORTER or same length (we're cleaning, not adding)
  // Allow small increase only for fixing typos/clarity (max +5 chars)
  if (after.length > before.length + 5) {
    console.log(`[validateNameTransformation] Rejected: result is longer than original (${after.length} vs ${before.length})`);
    return false;
  }

  // Rule 2: After name can't be longer than 50 chars total
  if (after.length > 50) {
    console.log(`[validateNameTransformation] Rejected: too long (${after.length} chars)`);
    return false;
  }

  // Rule 3: After name can't have colon followed by descriptive phrase
  const colonIndex = after.indexOf(":");
  if (colonIndex > 0) {
    const afterColon = after.substring(colonIndex + 1).trim().toLowerCase();
    // Check if what's after colon looks like a benefit phrase (lowercase, long)
    if (afterColon.length > 15 && /^[a-ząćęłńóśźż]/.test(afterColon)) {
      console.log(`[validateNameTransformation] Rejected: still has descriptive suffix after colon`);
      return false;
    }
  }

  // Rule 4: Reject if after STILL contains marketing garbage words
  const garbagePatterns = [
    /100%\s*skuteczn/i,
    /długotrwał[ąa]\s+gładkoś/i,
    /niezależnie\s+od/i,
    /pełen\s+relaks/i,
    /głębok[ie]\s+nawilżen/i,
    /trwał[eay]\s+(efekt|usuw)/i,
  ];

  for (const pattern of garbagePatterns) {
    if (pattern.test(after)) {
      console.log(`[validateNameTransformation] Rejected: still contains marketing garbage`);
      return false;
    }
  }

  // Rule 5: If we cleaned a name, the after should NOT contain the garbage that was in before
  // (this ensures we actually removed something, not just reshuffled)
  if (before.includes(":") && after.includes(":")) {
    const beforeAfterColon = before.split(":")[1]?.trim() || "";
    const afterAfterColon = after.split(":")[1]?.trim() || "";
    // If after colon part is still long, reject
    if (afterAfterColon.length > 20) {
      console.log(`[validateNameTransformation] Rejected: didn't clean the colon suffix properly`);
      return false;
    }
  }

  // Rule 6: After name must be at least 3 chars
  if (after.trim().length < 3) {
    console.log(`[validateNameTransformation] Rejected: result too short`);
    return false;
  }

  // Rule 7: Prefer transformations that actually shorten the name
  // If the name is the same or longer, it better be fixing something specific
  if (after.length >= before.length) {
    // Only allow if it's a minor fix (typo, capitalization)
    const similarity = calculateSimilarity(before.toLowerCase(), after.toLowerCase());
    if (similarity < 0.8) {
      console.log(`[validateNameTransformation] Rejected: not shorter and too different (similarity: ${similarity})`);
      return false;
    }
  }

  return true;
}

/**
 * Simple similarity calculation (Jaccard-like on words)
 */
function calculateSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.split(/\s+/).filter(w => w.length > 1));
  const wordsB = new Set(b.split(/\s+/).filter(w => w.length > 1));

  if (wordsA.size === 0 && wordsB.size === 0) return 1;

  let intersection = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) intersection++;
  }

  const union = wordsA.size + wordsB.size - intersection;
  return union === 0 ? 1 : intersection / union;
}

/**
 * Analyze service descriptions quality.
 */
async function analyzeDescriptionsQuality(
  apiKey: string,
  data: ScrapedData,
  stats: AuditStats
): Promise<{
  score: number;
  issues: AuditIssue[];
  transformations: ServiceTransformation[];
}> {
  // Filter services that have descriptions
  const servicesWithDesc = data.categories.flatMap(c =>
    c.services.filter(s => s.description && s.description.trim().length > 0)
      .map(s => ({ category: c.name, ...s }))
  );

  if (servicesWithDesc.length === 0) {
    return {
      score: 0,
      issues: [{
        severity: "critical",
        dimension: "descriptions",
        issue: "Brak opisów usług",
        impact: "Klienci nie wiedzą czego się spodziewać, co drastycznie obniża konwersję",
        affectedCount: stats.totalServices,
        example: "Żadna usługa nie ma opisu",
        fix: "Dodaj krótkie opisy (50-150 znaków) do każdej usługi opisujące korzyść dla klienta",
      }],
      transformations: [],
    };
  }

  let descText = `USŁUGI Z OPISAMI (${servicesWithDesc.length} z ${stats.totalServices}):\n\n`;
  for (const s of servicesWithDesc.slice(0, 50)) {
    descText += `- "${s.name}" [${s.category}]\n  OPIS: ${s.description}\n\n`;
  }

  const prompt = `Jesteś copywriterem specjalizującym się w usługach beauty.

${descText}

STATYSTYKA: ${servicesWithDesc.length} usług ma opis z ${stats.totalServices} (${Math.round(servicesWithDesc.length / stats.totalServices * 100)}%)

ZADANIE: Oceń JAKOŚĆ OPISÓW. Skala 0-20 punktów.

KRYTERIA:
- Czy mówi CO KLIENT ZYSKA? (efekt, rezultat)
- Czy określa DLA KOGO jest usługa?
- Czy ma odpowiednią długość? (ideał: 50-200 znaków)
- Czy jest przekonujący i budzi zaufanie?
- Czy NIE jest zbyt techniczny?

FORMAT:

SCORE: [0-20]

TOP_ISSUES:
ISSUE: [critical/major/minor] | descriptions | [problem] | [wpływ] | [ile usług] | [przykład] | [naprawa]

TRANSFORMATIONS:
TRANSFORM: description | [nazwa usługi] | [oryginalny opis] | [lepszy opis] | [dlaczego lepszy] | [wpływ 1-10]

Max 5 ISSUE i 3 TRANSFORM.`;

  const text = await callGeminiText(apiKey, prompt);
  return parseDescriptionAnalysis(text);
}

function parseDescriptionAnalysis(text: string): {
  score: number;
  issues: AuditIssue[];
  transformations: ServiceTransformation[];
} {
  const lines = text.split("\n").map(l => l.trim()).filter(l => l);
  let score = 10;
  const issues: AuditIssue[] = [];
  const transformations: ServiceTransformation[] = [];

  for (const line of lines) {
    if (line.startsWith("SCORE:")) {
      const match = line.match(/\d+/);
      if (match) score = Math.min(20, Math.max(0, parseInt(match[0], 10)));
    } else if (line.startsWith("ISSUE:")) {
      const parts = line.replace("ISSUE:", "").split("|").map(p => stripMarkdown(p.trim()));
      if (parts.length >= 7) {
        issues.push({
          severity: (parts[0] as IssueSeverity) || "minor",
          dimension: "descriptions",
          issue: parts[2] || "",
          impact: parts[3] || "",
          affectedCount: parseInt(parts[4], 10) || 1,
          example: parts[5] || "",
          fix: parts[6] || "",
        });
      }
    } else if (line.startsWith("TRANSFORM:")) {
      const parts = line.replace("TRANSFORM:", "").split("|").map(p => stripMarkdown(p.trim()));
      if (parts.length >= 6) {
        transformations.push({
          type: "description",
          serviceName: parts[1] || "",
          before: parts[2] || "",
          after: parts[3] || "",
          reason: parts[4] || "",
          impactScore: parseInt(parts[5], 10) || 5,
        });
      }
    }
  }

  return { score, issues: issues.slice(0, 5), transformations: transformations.slice(0, 3) };
}

/**
 * Analyze structure, pricing and generate quick wins.
 */
async function analyzeStructureAndPricing(
  apiKey: string,
  data: ScrapedData,
  stats: AuditStats
): Promise<{
  structureScore: number;
  pricingScore: number;
  issues: AuditIssue[];
  quickWins: QuickWin[];
  missingSeoKeywords: MissingSeoKeyword[];
}> {
  // Build category summary
  let structureText = `STRUKTURA CENNIKA:\n\n`;
  for (const cat of data.categories) {
    const hasProblems = cat.services.length > 20 ? " [ZA DUŻO]" :
                        cat.services.length < 3 && cat.services.length > 0 ? " [ZA MAŁO]" :
                        cat.services.length === 0 ? " [PUSTA]" : "";
    structureText += `- ${cat.name}: ${cat.services.length} usług${hasProblems}\n`;

    // Show price range
    const prices = cat.services
      .map(s => {
        const match = s.price.match(/(\d+)/);
        return match ? parseInt(match[0], 10) : null;
      })
      .filter((p): p is number => p !== null);

    if (prices.length > 0) {
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      structureText += `  Ceny: ${minPrice} - ${maxPrice} zł\n`;
    }
  }

  structureText += `\nSTATYSTYKI:
- Kategorii: ${stats.totalCategories}
- Usług łącznie: ${stats.totalServices}
- Średnio usług/kategorię: ${stats.avgServicesPerCategory}
- Największa: ${stats.largestCategory.name} (${stats.largestCategory.count})
- Najmniejsza: ${stats.smallestCategory.name} (${stats.smallestCategory.count})
- Duplikaty nazw: ${stats.duplicateNames.length > 0 ? stats.duplicateNames.join(", ") : "brak"}
- Puste kategorie: ${stats.emptyCategories.length > 0 ? stats.emptyCategories.join(", ") : "brak"}
- Za duże (>20): ${stats.oversizedCategories.length > 0 ? stats.oversizedCategories.join(", ") : "brak"}
- Za małe (<3): ${stats.undersizedCategories.length > 0 ? stats.undersizedCategories.join(", ") : "brak"}`;

  const prompt = `Jesteś konsultantem UX i strategii cenowej dla salonów beauty.

${structureText}

ZADANIE: Oceń STRUKTURĘ (0-15 pkt) i STRATEGIĘ CENOWĄ (0-15 pkt).

STRUKTURA - KRYTERIA:
- Logiczne grupowanie usług
- Optymalna wielkość kategorii (3-15 usług)
- Jasne nazwy kategorii
- Bestsellery/popularne łatwo dostępne

CENY - KRYTERIA:
- Czy są pakiety/zestawy?
- Spójność cenowa w kategoriach
- Czy ceny konkretne (nie "od...")?
- Psychologia cen (99 vs 100)

FORMAT:

STRUCTURE_SCORE: [0-15]
PRICING_SCORE: [0-15]

TOP_ISSUES:
ISSUE: [critical/major/minor] | [structure/pricing] | [problem] | [wpływ] | [ile dotyczy] | [przykład] | [naprawa]

QUICK_WINS:
WIN: [akcja do wykonania] | [low/medium effort] | [high/medium impact] | [przykład] | [ile usług dotyczy]

SEO_KEYWORDS:
KEYWORD: [brakujące słowo kluczowe] | [high/medium/low volume] | [gdzie dodać] | [krótkie uzasadnienie dlaczego warto]

Max 5 ISSUE, 5 WIN, 5 KEYWORD.`;

  const text = await callGeminiText(apiKey, prompt);
  return parseStructureAnalysis(text);
}

function parseStructureAnalysis(text: string): {
  structureScore: number;
  pricingScore: number;
  issues: AuditIssue[];
  quickWins: QuickWin[];
  missingSeoKeywords: MissingSeoKeyword[];
} {
  const lines = text.split("\n").map(l => l.trim()).filter(l => l);
  let structureScore = 8;
  let pricingScore = 8;
  const issues: AuditIssue[] = [];
  const quickWins: QuickWin[] = [];
  const missingSeoKeywords: MissingSeoKeyword[] = [];

  for (const line of lines) {
    if (line.startsWith("STRUCTURE_SCORE:")) {
      const match = line.match(/\d+/);
      if (match) structureScore = Math.min(15, Math.max(0, parseInt(match[0], 10)));
    } else if (line.startsWith("PRICING_SCORE:")) {
      const match = line.match(/\d+/);
      if (match) pricingScore = Math.min(15, Math.max(0, parseInt(match[0], 10)));
    } else if (line.startsWith("ISSUE:")) {
      const parts = line.replace("ISSUE:", "").split("|").map(p => stripMarkdown(p.trim()));
      if (parts.length >= 7) {
        issues.push({
          severity: (parts[0] as IssueSeverity) || "minor",
          dimension: (parts[1] as AuditDimension) || "structure",
          issue: parts[2] || "",
          impact: parts[3] || "",
          affectedCount: parseInt(parts[4], 10) || 1,
          example: parts[5] || "",
          fix: parts[6] || "",
        });
      }
    } else if (line.startsWith("WIN:")) {
      const parts = line.replace("WIN:", "").split("|").map(p => stripMarkdown(p.trim()));
      if (parts.length >= 5) {
        quickWins.push({
          action: parts[0] || "",
          effort: (parts[1] as "low" | "medium" | "high") || "medium",
          impact: (parts[2] as "high" | "medium" | "low") || "medium",
          example: parts[3] || "",
          affectedServices: parseInt(parts[4], 10) || 1,
        });
      }
    } else if (line.startsWith("KEYWORD:")) {
      const parts = line.replace("KEYWORD:", "").split("|").map(p => stripMarkdown(p.trim()));
      if (parts.length >= 3) {
        missingSeoKeywords.push({
          keyword: parts[0] || "",
          searchVolume: (parts[1] as "high" | "medium" | "low") || "medium",
          suggestedPlacement: parts[2] || "",
          reason: parts[3] || undefined,
        });
      }
    }
  }

  return {
    structureScore,
    pricingScore,
    issues: issues.slice(0, 5),
    quickWins: quickWins.slice(0, 5),
    missingSeoKeywords: missingSeoKeywords.slice(0, 5),
  };
}

/**
 * Calculate completeness score based on stats.
 */
function calculateCompletenessScore(stats: AuditStats): number {
  // 0-15 points based on field completeness
  const descriptionRate = stats.totalServices > 0
    ? stats.servicesWithDescription / stats.totalServices
    : 0;
  const durationRate = stats.totalServices > 0
    ? stats.servicesWithDuration / stats.totalServices
    : 0;
  const fixedPriceRate = stats.totalServices > 0
    ? stats.servicesWithFixedPrice / stats.totalServices
    : 0;

  // Weight: descriptions (6pt), duration (5pt), fixed price (4pt)
  const score = Math.round(descriptionRate * 6 + durationRate * 5 + fixedPriceRate * 4);
  return Math.min(15, score);
}

/**
 * Calculate SEO score based on keyword coverage.
 */
function calculateSeoScore(missingSeoKeywords: MissingSeoKeyword[], stats: AuditStats): number {
  // 0-10 points
  // Fewer missing keywords = better score
  const highVolumeMissing = missingSeoKeywords.filter(k => k.searchVolume === "high").length;
  const mediumVolumeMissing = missingSeoKeywords.filter(k => k.searchVolume === "medium").length;
  const lowVolumeMissing = missingSeoKeywords.filter(k => k.searchVolume === "low").length;

  // Start at 10, subtract for missing keywords
  let score = 10 - (highVolumeMissing * 2) - (mediumVolumeMissing * 1) - (lowVolumeMissing * 0.5);

  // IMPORTANT: If there are ANY missing keywords, cap at 9 (can't be perfect if there are suggestions)
  if (missingSeoKeywords.length > 0 && score > 9) {
    score = 9;
  }

  return Math.max(0, Math.min(10, Math.round(score)));
}

/**
 * Calculate UX score based on structure.
 */
function calculateUxScore(stats: AuditStats): number {
  // 0-5 points based on user experience factors
  let score = 5;

  // Penalize empty categories
  if (stats.emptyCategories.length > 0) score -= 1;

  // Penalize oversized categories (hard to navigate)
  if (stats.oversizedCategories.length > 0) score -= 1;

  // Penalize undersized categories (fragmented)
  if (stats.undersizedCategories.length > 2) score -= 1;

  // Penalize duplicate names (confusing)
  if (stats.duplicateNames.length > 0) score -= 1;

  // Penalize very uneven category sizes
  if (stats.largestCategory.count > stats.smallestCategory.count * 10) score -= 1;

  return Math.max(0, score);
}

/**
 * Generate summary text for the audit.
 */
async function generateSummary(
  apiKey: string,
  totalScore: number,
  stats: AuditStats,
  topIssues: AuditIssue[]
): Promise<string> {
  const issuesSummary = topIssues.slice(0, 3).map(i => `- ${i.issue}`).join("\n");

  const prompt = `Napisz krótkie podsumowanie audytu cennika salonu beauty (2-3 zdania).

WYNIK: ${totalScore}/100 punktów
USŁUG: ${stats.totalServices}
KATEGORII: ${stats.totalCategories}
USŁUGI Z OPISEM: ${stats.servicesWithDescription}/${stats.totalServices}

GŁÓWNE PROBLEMY:
${issuesSummary || "Brak krytycznych problemów"}

Napisz podsumowanie po polsku, bez emoji, profesjonalnie ale przystępnie. Wskaż najważniejszy problem do naprawienia.`;

  return await callGeminiText(apiKey, prompt);
}

/**
 * Main function to generate enhanced audit report.
 * Combines statistical analysis with AI insights.
 */
export async function generateEnhancedAuditReport(
  scrapedDataJson: string
): Promise<EnhancedAuditReport> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const scrapedData: ScrapedData = JSON.parse(scrapedDataJson);

  // Step 1: Calculate hard statistics (no AI)
  console.log("[Enhanced Audit] Step 1: Calculating statistics...");
  const stats = calculateAuditStats(scrapedData);

  // Step 2: AI analysis of naming quality
  console.log("[Enhanced Audit] Step 2: Analyzing naming quality...");
  const namingAnalysis = await analyzeNamingQuality(apiKey, scrapedData, stats);

  // Step 3: AI analysis of descriptions
  console.log("[Enhanced Audit] Step 3: Analyzing descriptions...");
  const descAnalysis = await analyzeDescriptionsQuality(apiKey, scrapedData, stats);

  // Step 4: AI analysis of structure and pricing
  console.log("[Enhanced Audit] Step 4: Analyzing structure and pricing...");
  const structureAnalysis = await analyzeStructureAndPricing(apiKey, scrapedData, stats);

  // Calculate dimension scores
  const completenessScore = calculateCompletenessScore(stats);
  const seoScore = calculateSeoScore(structureAnalysis.missingSeoKeywords, stats);
  const uxScore = calculateUxScore(stats);

  const scoreBreakdown: ScoreBreakdown = {
    completeness: completenessScore,
    naming: namingAnalysis.score,
    descriptions: descAnalysis.score,
    structure: structureAnalysis.structureScore,
    pricing: structureAnalysis.pricingScore,
    seo: seoScore,
    ux: uxScore,
  };

  let totalScore = Object.values(scoreBreakdown).reduce((a, b) => a + b, 0);

  // Combine all issues and sort by severity
  const allIssues = [
    ...namingAnalysis.issues,
    ...descAnalysis.issues,
    ...structureAnalysis.issues,
  ];

  const severityOrder: Record<IssueSeverity, number> = { critical: 0, major: 1, minor: 2 };
  const topIssues = allIssues
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
    .slice(0, 10);

  // IMPORTANT: Cap total score if there are any issues, quick wins, or missing keywords
  // It makes no sense to show 100% when there are recommendations for improvement
  const hasAnyRecommendations =
    topIssues.length > 0 ||
    structureAnalysis.quickWins.length > 0 ||
    structureAnalysis.missingSeoKeywords.length > 0 ||
    namingAnalysis.transformations.length > 0 ||
    descAnalysis.transformations.length > 0;

  if (hasAnyRecommendations && totalScore > 95) {
    totalScore = 95;
  }

  // Combine transformations
  const transformations = [
    ...namingAnalysis.transformations,
    ...descAnalysis.transformations,
  ].slice(0, 8);

  // Generate summary
  console.log("[Enhanced Audit] Step 5: Generating summary...");
  const summary = await generateSummary(apiKey, totalScore, stats, topIssues);

  // Industry comparison (simplified - could be enhanced with real data)
  const industryComparison = {
    yourScore: totalScore,
    industryAverage: 55, // Placeholder - could fetch from DB
    topPerformers: 85,
    percentile: Math.round((totalScore / 100) * 100),
  };

  console.log(`[Enhanced Audit] Complete. Total score: ${totalScore}/100`);

  return {
    version: "v2",
    totalScore,
    scoreBreakdown,
    stats,
    topIssues,
    transformations,
    missingSeoKeywords: structureAnalysis.missingSeoKeywords,
    quickWins: structureAnalysis.quickWins,
    industryComparison,
    summary: summary.trim(),
  };
}

/**
 * Call Gemini API and return plain text response
 */
async function callGeminiText(apiKey: string, prompt: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  interface GeminiResponse {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  }

  const result = await response.json() as GeminiResponse;
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Brak odpowiedzi od AI");
  }

  return text;
}

/**
 * Sanitize AI response to extract valid JSON.
 * Handles markdown code blocks, trailing content, and common issues.
 */
function sanitizeJsonResponse(text: string): string {
  let cleaned = text.trim();

  // Remove markdown code blocks if present
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }

  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }

  cleaned = cleaned.trim();

  // Find the first { and last } to extract JSON object
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  // Fix common JSON issues
  // Remove trailing commas before } or ]
  cleaned = cleaned.replace(/,(\s*[}\]])/g, "$1");

  // Replace single quotes with double quotes (common AI mistake)
  // But be careful not to replace apostrophes inside strings
  // This is a simple approach - more robust would need proper parsing

  return cleaned;
}

/**
 * Sanitize report data to remove problematic characters that could break JSON.
 * Cleans all string fields recursively.
 */
function sanitizeReportData(report: AuditReport): AuditReport {
  const cleanString = (str: string | undefined): string | undefined => {
    if (!str) return str;
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
      // Limit string length to prevent extremely long texts
      .substring(0, 5000);
  };

  return {
    overallScore: Math.min(100, Math.max(0, report.overallScore || 50)),
    generalFeedback: cleanString(report.generalFeedback) || '',
    salesPotential: cleanString(report.salesPotential) || 'Średni',
    strengths: (report.strengths || []).map(s => cleanString(s) || '').filter(Boolean).slice(0, 10),
    weaknesses: (report.weaknesses || []).map(w => ({
      point: cleanString(w.point) || '',
      consequence: cleanString(w.consequence) || '',
    })).filter(w => w.point).slice(0, 10),
    recommendations: (report.recommendations || []).map(r => cleanString(r) || '').filter(Boolean).slice(0, 10),
    beforeAfter: report.beforeAfter ? {
      before: cleanString(report.beforeAfter.before) || '',
      after: cleanString(report.beforeAfter.after) || '',
      explanation: cleanString(report.beforeAfter.explanation) || '',
    } : { before: '', after: '', explanation: '' },
    growthTips: (report.growthTips || []).map(tip => ({
      category: tip.category || 'Konwersja',
      title: cleanString(tip.title) || '',
      description: cleanString(tip.description) || '',
      impact: tip.impact || 'Średni',
    })).filter(t => t.title).slice(0, 4),
  };
}

// --- TEST FUNCTION FOR BOOKSY API ---
export const testBooksyApi = internalAction({
  args: { url: v.string() },
  returns: v.object({
    success: v.boolean(),
    categoriesCount: v.number(),
    servicesCount: v.number(),
    salonName: v.optional(v.string()),
    salonAddress: v.optional(v.string()),
    salonLogoUrl: v.optional(v.string()),
    method: v.string(),
    categories: v.array(v.object({
      name: v.string(),
      servicesCount: v.number(),
    })),
  }),
  handler: async (ctx, args) => {
    console.log(`[Test] Starting Booksy API test for: ${args.url}`);

    const businessId = extractBusinessId(args.url);
    if (!businessId) {
      console.log(`[Test] Could not extract business ID from URL`);
      return {
        success: false,
        categoriesCount: 0,
        servicesCount: 0,
        salonName: undefined,
        salonAddress: undefined,
        salonLogoUrl: undefined,
        method: "failed_no_business_id",
        categories: [],
      };
    }

    try {
      const apiResponse = await fetchFromBooksyApi(businessId);
      const parsedData = convertBooksyApiToScrapedData(apiResponse);

      console.log(`[Test] Booksy API SUCCESS: ${parsedData.categories.length} categories, ${parsedData.totalServices} services`);

      return {
        success: true,
        categoriesCount: parsedData.categories.length,
        servicesCount: parsedData.totalServices,
        salonName: parsedData.salonName,
        salonAddress: parsedData.salonAddress,
        salonLogoUrl: parsedData.salonLogoUrl,
        method: "booksy_api",
        categories: parsedData.categories.map(c => ({
          name: c.name,
          servicesCount: c.services.length,
        })),
      };
    } catch (error) {
      console.log(`[Test] Booksy API failed: ${error}`);
      return {
        success: false,
        categoriesCount: 0,
        servicesCount: 0,
        salonName: undefined,
        salonAddress: undefined,
        salonLogoUrl: undefined,
        method: "failed_api_error",
        categories: [],
      };
    }
  },
});

export const analyzeWithAI = internalAction({
  args: { auditId: v.id("audits") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const audit = await ctx.runQuery(internal.audits.getAuditInternal, {
      auditId: args.auditId,
    });

    if (!audit?.scrapedDataJson) {
      throw new Error("No scraped data found");
    }

    await ctx.runMutation(internal.audits.updateProgress, {
      auditId: args.auditId,
      status: "analyzing",
      progress: 40,
      progressMessage: "Obliczanie statystyk cennika...",
    });

    try {
      // Use enhanced audit report (V2) with 7-dimension scoring
      const enhancedReport = await generateEnhancedAuditReport(audit.scrapedDataJson);

      await ctx.runMutation(internal.audits.updateProgress, {
        auditId: args.auditId,
        progress: 90,
        progressMessage: "Finalizacja raportu...",
      });

      const reportJson = JSON.stringify(enhancedReport);

      // Validate JSON is parseable before saving
      try {
        JSON.parse(reportJson);
        console.log(`[Audit V2] Report JSON validated successfully, length: ${reportJson.length}`);
      } catch (validationError) {
        console.error("[Audit V2] Generated JSON is invalid:", validationError);
        throw new Error("Wygenerowany raport jest nieprawidłowy. Spróbuj ponownie.");
      }

      await ctx.runMutation(internal.audits.completeAudit, {
        auditId: args.auditId,
        overallScore: enhancedReport.totalScore,
        rawData: audit.scrapedDataJson,
        reportJson: reportJson,
      });

      // Generate additional analysis reports (keyword report + category proposal)
      // These run in the background after the main audit is complete
      try {
        console.log("[Audit] Generating keyword report...");
        const keywordReportId = await ctx.runAction(
          internal.auditAnalysis.generateKeywordReport,
          { auditId: args.auditId }
        );
        console.log(`[Audit] Keyword report generated: ${keywordReportId}`);

        console.log("[Audit] Generating category proposal...");
        await ctx.runAction(
          internal.auditAnalysis.generateCategoryProposal,
          { auditId: args.auditId, keywordReportId }
        );
        console.log("[Audit] Category proposal generated");
      } catch (analysisError) {
        // Don't fail the whole audit if additional analysis fails
        console.error("[Audit] Additional analysis failed:", analysisError);
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Błąd analizy AI";

      await ctx.runMutation(internal.audits.failAudit, {
        auditId: args.auditId,
        errorMessage: `Analiza AI nie powiodła się: ${errorMessage}`,
      });
    }

    return null;
  },
});
