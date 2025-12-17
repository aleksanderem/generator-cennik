"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  parseBooksyData,
  parseAuditReport,
  validateScrapedData,
  type ScrapedData,
  type AuditReport,
} from "./auditHelpers";

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
 */
function convertBooksyApiToScrapedData(apiResponse: BooksyApiResponse): ScrapedData {
  const business = apiResponse.business;
  if (!business) {
    throw new Error("No business data in API response");
  }

  const categories = (business.service_categories || []).map((cat) => ({
    name: cat.name,
    services: cat.services.map((svc) => {
      // Get duration from first variant if available
      const variant = svc.variants?.[0];
      const durationMinutes = variant?.duration;

      return {
        name: svc.name,
        price: svc.service_price || (svc.price ? `${svc.price} zł` : "Darmowa"),
        duration: durationMinutes ? formatDuration(durationMinutes) : undefined,
        description: svc.description?.slice(0, 200),
      };
    }),
  }));

  const totalServices = categories.reduce((acc, c) => acc + c.services.length, 0);

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
      const content = line.substring(1).trim();
      if (section === "strengths" && content) {
        strengths.push(content);
      } else if (section === "weaknesses" && content) {
        const parts = content.split("|").map((p: string) => p.trim());
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
      const content = line.substring(1).trim();
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
      progress: 60,
      progressMessage: "AI analizuje cennik...",
    });

    try {
      await ctx.runMutation(internal.audits.updateProgress, {
        auditId: args.auditId,
        progress: 75,
        progressMessage: "Generowanie raportu...",
      });

      const report = await generateAuditReport(audit.scrapedDataJson);

      await ctx.runMutation(internal.audits.updateProgress, {
        auditId: args.auditId,
        progress: 90,
        progressMessage: "Finalizacja raportu...",
      });

      // Sanitize report data to remove problematic characters
      const sanitizedReport = sanitizeReportData(report);
      const reportJson = JSON.stringify(sanitizedReport);

      // Validate JSON is parseable before saving
      try {
        JSON.parse(reportJson);
        console.log(`[Audit] Report JSON validated successfully, length: ${reportJson.length}`);
      } catch (validationError) {
        console.error("[Audit] Generated JSON is invalid:", validationError);
        throw new Error("Wygenerowany raport jest nieprawidłowy. Spróbuj ponownie.");
      }

      await ctx.runMutation(internal.audits.completeAudit, {
        auditId: args.auditId,
        overallScore: sanitizedReport.overallScore,
        rawData: audit.scrapedDataJson,
        reportJson: reportJson,
      });

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
