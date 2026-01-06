/**
 * Pure helper functions for audit processing.
 * Extracted for testability - no Convex dependencies.
 */

// --- TYPES ---

export interface ScrapedService {
  name: string;
  price: string;
  duration?: string;
  description?: string;
}

export interface ScrapedCategory {
  name: string;
  services: ScrapedService[];
}

export interface ScrapedData {
  salonName?: string;
  salonAddress?: string;
  salonLogoUrl?: string;
  categories: ScrapedCategory[];
  totalServices: number;
  rawMarkdown: string;
}

export interface AuditReport {
  overallScore: number;
  generalFeedback: string;
  salesPotential: string;
  strengths: string[];
  weaknesses: Array<{ point: string; consequence: string }>;
  recommendations: string[];
  beforeAfter?: {
    before: string;
    after: string;
    explanation: string;
  };
  growthTips: Array<{
    category: "SEO" | "Konwersja" | "Retencja" | "Wizerunek";
    title: string;
    description: string;
    impact: "Wysoki" | "Średni" | "Niski";
  }>;
}

// --- ENHANCED AUDIT TYPES ---

export type IssueSeverity = "critical" | "major" | "minor";
export type AuditDimension = "completeness" | "naming" | "descriptions" | "structure" | "pricing" | "seo" | "ux";
export type EffortLevel = "low" | "medium" | "high";
export type ImpactLevel = "high" | "medium" | "low";
export type SearchVolume = "high" | "medium" | "low";
export type TransformationType = "name" | "description" | "category";

export interface AuditStats {
  totalServices: number;
  totalCategories: number;
  servicesWithDescription: number;
  servicesWithDuration: number;
  servicesWithFixedPrice: number;  // Nie "od..." tylko konkretna cena
  avgServicesPerCategory: number;
  largestCategory: { name: string; count: number };
  smallestCategory: { name: string; count: number };
  duplicateNames: string[];  // Lista zduplikowanych nazw usług
  emptyCategories: string[];  // Kategorie bez usług
  oversizedCategories: string[];  // Kategorie z >20 usługami
  undersizedCategories: string[];  // Kategorie z <3 usługami
}

export interface AuditIssue {
  severity: IssueSeverity;
  dimension: AuditDimension;
  issue: string;
  impact: string;  // Jak wpływa na rezerwacje
  affectedCount: number;  // Ile usług/kategorii dotyczy
  example: string;  // Konkretny przykład z cennika
  fix: string;  // Jak naprawić
}

export interface ServiceTransformation {
  type: TransformationType;
  serviceName: string;  // Nazwa usługi której dotyczy
  before: string;
  after: string;
  reason: string;
  impactScore: number;  // 1-10 jak bardzo poprawi
}

export interface MissingSeoKeyword {
  keyword: string;
  searchVolume: SearchVolume;
  suggestedPlacement: string;  // Gdzie dodać (kategoria lub usługa)
  reason?: string;  // Uzasadnienie dlaczego warto dodać
}

export interface QuickWin {
  action: string;
  effort: EffortLevel;
  impact: ImpactLevel;
  example: string;
  affectedServices: number;  // Ile usług dotyczy
}

export interface ScoreBreakdown {
  completeness: number;   // 0-15: % usług z opisem, czasem, ceną
  naming: number;         // 0-20: jakość nazw usług
  descriptions: number;   // 0-20: jakość opisów
  structure: number;      // 0-15: logika kategorii
  pricing: number;        // 0-15: strategia cenowa
  seo: number;            // 0-10: słowa kluczowe
  ux: number;             // 0-5: user experience
}

export interface IndustryComparison {
  yourScore: number;
  industryAverage: number;
  topPerformers: number;
  percentile: number;  // W jakim percentylu jest ten cennik
}

export interface EnhancedAuditReport {
  // Wersja raportu - dla backward compatibility
  version: "v2";

  // Podsumowanie
  totalScore: number;  // 0-100 (suma wymiarów)
  scoreBreakdown: ScoreBreakdown;

  // Statystyki faktyczne (bez AI)
  stats: AuditStats;

  // Top problemy (priorytetyzowane przez AI)
  topIssues: AuditIssue[];

  // Transformacje przed/po (konkretne przykłady)
  transformations: ServiceTransformation[];

  // Brakujące słowa kluczowe
  missingSeoKeywords: MissingSeoKeyword[];

  // Quick wins - szybkie wygrane
  quickWins: QuickWin[];

  // Benchmark branżowy
  industryComparison: IndustryComparison;

  // Ogólne podsumowanie tekstowe
  summary: string;

  // Zachowanie starego formatu dla kompatybilności
  legacyReport?: AuditReport;
}

/**
 * Type guard dla sprawdzania czy raport jest w nowym formacie
 */
export function isEnhancedAuditReport(report: unknown): report is EnhancedAuditReport {
  return (
    typeof report === "object" &&
    report !== null &&
    "version" in report &&
    (report as EnhancedAuditReport).version === "v2" &&
    "scoreBreakdown" in report
  );
}

// --- PARSERS ---

/**
 * Parse Booksy data from markdown content.
 * Extracts salon info, categories, and services with prices.
 */
export function parseBooksyData(markdown: string, html?: string): ScrapedData {
  const categories: ScrapedCategory[] = [];
  let salonName: string | undefined;
  let salonAddress: string | undefined;

  // Try to extract salon name
  const nameMatch = markdown.match(/^#\s*(.+?)(?:\n|$)/m) ||
    markdown.match(/(?:salon|nazwa)[\s:]+([^\n]+)/i);
  if (nameMatch) {
    salonName = nameMatch[1].trim();
  }

  // Try to extract address
  const addressMatch = markdown.match(/(?:adres|lokalizacja|ul\.)[\s:]+([^\n]+)/i);
  if (addressMatch) {
    salonAddress = addressMatch[1].trim();
  }

  // Parse services
  const lines = markdown.split("\n");
  let currentCategory: ScrapedCategory = { name: "Usługi", services: [] };

  const pricePattern = /(\d+[.,]?\d*)\s*(zł|PLN|pln)/i;
  const durationPattern = /(\d+)\s*(min|h|godzin)/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Check if line is a category header
    if (line.startsWith("##") || line.startsWith("**")) {
      const categoryName = line.replace(/^#+\s*/, "").replace(/\*\*/g, "").trim();
      if (categoryName && categoryName.length > 2 && categoryName.length < 100) {
        if (currentCategory.services.length > 0) {
          categories.push(currentCategory);
        }
        currentCategory = { name: categoryName, services: [] };
        continue;
      }
    }

    // Look for service entries with prices
    const priceMatch = line.match(pricePattern);
    if (priceMatch) {
      const priceIndex = line.indexOf(priceMatch[0]);
      let serviceName = line.substring(0, priceIndex).trim();

      serviceName = serviceName
        .replace(/[-–—]\s*$/, "")
        .replace(/^\d+\.\s*/, "")
        .replace(/\*\*/g, "")
        .trim();

      if (serviceName.length > 2 && serviceName.length < 200) {
        const service: ScrapedService = {
          name: serviceName,
          price: priceMatch[0].trim(),
        };

        const afterPrice = line.substring(priceIndex + priceMatch[0].length);
        const durationMatch = afterPrice.match(durationPattern) ||
          lines[i + 1]?.match(durationPattern);
        if (durationMatch) {
          service.duration = durationMatch[0];
        }

        const nextLine = lines[i + 1]?.trim();
        if (nextLine && !pricePattern.test(nextLine) &&
            !nextLine.startsWith("#") && !nextLine.startsWith("**") &&
            nextLine.length > 10 && nextLine.length < 500) {
          service.description = nextLine;
        }

        currentCategory.services.push(service);
      }
    }
  }

  if (currentCategory.services.length > 0) {
    categories.push(currentCategory);
  }

  // Fallback HTML parsing
  if (categories.length === 0 || categories.reduce((acc, c) => acc + c.services.length, 0) < 3) {
    if (html) {
      const htmlParsed = parseFromHtml(html);
      if (htmlParsed.categories.length > 0) {
        return htmlParsed;
      }
    }
  }

  const totalServices = categories.reduce((acc, c) => acc + c.services.length, 0);

  return {
    salonName,
    salonAddress,
    categories,
    totalServices,
    rawMarkdown: markdown,
  };
}

/**
 * Fallback HTML parser for when markdown parsing fails.
 */
export function parseFromHtml(html: string): ScrapedData {
  const categories: ScrapedCategory[] = [];
  const currentCategory: ScrapedCategory = { name: "Usługi", services: [] };

  const servicePattern = /<(?:div|li|article)[^>]*class="[^"]*(?:service|item|offer)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|li|article)>/gi;

  let match;
  while ((match = servicePattern.exec(html)) !== null) {
    const content = match[1];

    const nameMatch = content.match(/<(?:h\d|span|p)[^>]*class="[^"]*(?:name|title)[^"]*"[^>]*>([^<]+)</i) ||
      content.match(/<(?:h\d|strong|b)>([^<]+)</i);
    const priceMatch = content.match(/(\d+[.,]?\d*)\s*(zł|PLN)/i);

    if (nameMatch && priceMatch) {
      const service: ScrapedService = {
        name: nameMatch[1].trim(),
        price: priceMatch[0],
      };

      const durationMatch = content.match(/(\d+)\s*(min|h)/i);
      if (durationMatch) {
        service.duration = durationMatch[0];
      }

      currentCategory.services.push(service);
    }
  }

  if (currentCategory.services.length > 0) {
    categories.push(currentCategory);
  }

  return {
    categories,
    totalServices: currentCategory.services.length,
    rawMarkdown: "",
  };
}

// --- VALIDATORS ---

export interface ValidationError {
  code: "NO_CATEGORIES" | "TOO_FEW_SERVICES" | "TOO_MANY_EMPTY_CATEGORIES";
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Validate scraped data meets minimum requirements for analysis.
 * Returns null if valid, or ValidationError if invalid.
 */
export function validateScrapedData(data: ScrapedData): ValidationError | null {
  if (!data.categories || data.categories.length === 0) {
    return {
      code: "NO_CATEGORIES",
      message: "Nie znaleziono kategorii usług na stronie Booksy",
    };
  }

  if (data.totalServices < 3) {
    return {
      code: "TOO_FEW_SERVICES",
      message: `Za mało usług do analizy (znaleziono: ${data.totalServices}, minimum: 3)`,
      details: { found: data.totalServices, minimum: 3 },
    };
  }

  const emptyCategories = data.categories.filter(c => c.services.length === 0);
  if (emptyCategories.length > data.categories.length * 0.5) {
    return {
      code: "TOO_MANY_EMPTY_CATEGORIES",
      message: "Dane niekompletne - zbyt wiele pustych kategorii",
      details: {
        total: data.categories.length,
        empty: emptyCategories.length,
      },
    };
  }

  return null;
}

// --- AI RESPONSE PARSING ---

/**
 * Parse and validate AI-generated audit report.
 * Ensures all required fields are present and valid.
 */
export function parseAuditReport(jsonString: string): AuditReport {
  const report = JSON.parse(jsonString) as AuditReport;

  // Validate and fix overallScore
  if (typeof report.overallScore !== "number" || report.overallScore < 0 || report.overallScore > 100) {
    report.overallScore = 50;
  }

  // Ensure required arrays exist
  if (!Array.isArray(report.strengths)) {
    report.strengths = [];
  }

  if (!Array.isArray(report.weaknesses)) {
    report.weaknesses = [];
  }

  if (!Array.isArray(report.recommendations)) {
    report.recommendations = [];
  }

  if (!Array.isArray(report.growthTips)) {
    report.growthTips = [];
  }

  // Validate growthTips
  report.growthTips = report.growthTips.filter(tip => {
    const validCategories = ["SEO", "Konwersja", "Retencja", "Wizerunek"];
    const validImpacts = ["Wysoki", "Średni", "Niski"];
    return (
      validCategories.includes(tip.category) &&
      validImpacts.includes(tip.impact) &&
      typeof tip.title === "string" &&
      typeof tip.description === "string"
    );
  });

  // Ensure string fields
  if (typeof report.generalFeedback !== "string") {
    report.generalFeedback = "";
  }

  if (typeof report.salesPotential !== "string") {
    report.salesPotential = "";
  }

  return report;
}

/**
 * Sanitize AI response - remove any emojis and clean up text.
 */
export function sanitizeAiResponse(text: string): string {
  // Remove emojis using unicode ranges
  const emojiPattern = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]/gu;
  return text.replace(emojiPattern, "").trim();
}

// --- AUDIT STATS CALCULATION ---

/**
 * Check if a price string represents a fixed price (not "od...", "od ", "from...")
 */
function isFixedPrice(price: string): boolean {
  const lowerPrice = price.toLowerCase().trim();
  // Check for "od", "from", "ab" (German) patterns indicating variable pricing
  if (lowerPrice.startsWith("od ") || lowerPrice.startsWith("od") && /\d/.test(lowerPrice[2])) {
    return false;
  }
  if (lowerPrice.includes("od ")) return false;
  if (lowerPrice.includes("from ")) return false;
  if (lowerPrice.includes(" - ")) return false; // Range like "100 - 200 zł"
  if (lowerPrice.includes("–")) return false; // En-dash range
  return true;
}

/**
 * Calculate comprehensive audit statistics from scraped data.
 * These are hard numbers, not AI-generated - fully deterministic.
 */
export function calculateAuditStats(data: ScrapedData): AuditStats {
  const allServices = data.categories.flatMap(c => c.services);

  // Basic counts
  const totalServices = allServices.length;
  const totalCategories = data.categories.length;

  // Field completeness
  const servicesWithDescription = allServices.filter(s =>
    s.description && s.description.trim().length > 0
  ).length;

  const servicesWithDuration = allServices.filter(s =>
    s.duration && s.duration.trim().length > 0
  ).length;

  const servicesWithFixedPrice = allServices.filter(s =>
    s.price && isFixedPrice(s.price)
  ).length;

  // Category size analysis
  const categorySizes = data.categories.map(c => ({
    name: c.name,
    count: c.services.length
  }));

  const avgServicesPerCategory = totalCategories > 0
    ? Math.round((totalServices / totalCategories) * 10) / 10
    : 0;

  const sortedBySize = [...categorySizes].sort((a, b) => b.count - a.count);
  const largestCategory = sortedBySize[0] || { name: "Brak", count: 0 };
  const smallestCategory = sortedBySize[sortedBySize.length - 1] || { name: "Brak", count: 0 };

  // Find duplicate service names
  const nameCounts = new Map<string, number>();
  for (const service of allServices) {
    const normalizedName = service.name.toLowerCase().trim();
    nameCounts.set(normalizedName, (nameCounts.get(normalizedName) || 0) + 1);
  }
  const duplicateNames = Array.from(nameCounts.entries())
    .filter(([_, count]) => count > 1)
    .map(([name, _]) => name);

  // Problematic categories
  const emptyCategories = data.categories
    .filter(c => c.services.length === 0)
    .map(c => c.name);

  const oversizedCategories = data.categories
    .filter(c => c.services.length > 20)
    .map(c => c.name);

  const undersizedCategories = data.categories
    .filter(c => c.services.length > 0 && c.services.length < 3)
    .map(c => c.name);

  return {
    totalServices,
    totalCategories,
    servicesWithDescription,
    servicesWithDuration,
    servicesWithFixedPrice,
    avgServicesPerCategory,
    largestCategory,
    smallestCategory,
    duplicateNames,
    emptyCategories,
    oversizedCategories,
    undersizedCategories,
  };
}

// --- URL VALIDATION ---

/**
 * Validate Booksy URL format.
 */
export function isValidBooksyUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes("booksy.com");
  } catch {
    return false;
  }
}

/**
 * Extract salon ID from Booksy URL if present.
 * Handles formats like:
 * - https://booksy.com/pl-pl/123456/salon-name/789012
 * - https://booksy.com/en-us/business/salon/123456
 */
export function extractBooksySalonId(url: string): string | null {
  // Try to match the last numeric segment in the URL path
  const match = url.match(/booksy\.com\/[^?#]*\/(\d+)(?:[?#]|$)/i);
  return match ? match[1] : null;
}

// --- PRICINGDATA CONVERSION ---

/**
 * PricingData format used by the pricelist editor/generator.
 * Mirrors types.ts but defined here to avoid circular deps.
 */
export interface PricingDataService {
  name: string;
  price: string;
  description?: string;
  duration?: string;
  isPromo: boolean;
  imageUrl?: string;
  tags?: string[];
}

export interface PricingDataCategory {
  categoryName: string;
  services: PricingDataService[];
}

export interface PricingData {
  salonName?: string;
  categories: PricingDataCategory[];
}

/**
 * Convert ScrapedData (from Booksy) to PricingData (for pricelist storage).
 * Adds required isPromo field and maps category structure.
 */
export function convertScrapedDataToPricingData(scraped: ScrapedData): PricingData {
  return {
    salonName: scraped.salonName,
    categories: scraped.categories.map(cat => ({
      categoryName: cat.name,
      services: cat.services.map(service => ({
        name: service.name,
        price: service.price,
        description: service.description,
        duration: service.duration,
        isPromo: false,
      })),
    })),
  };
}
