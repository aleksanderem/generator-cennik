"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// ============================================
// TYPES
// ============================================

export interface ServiceVariant {
  label: string;
  price: string;
  duration?: string;
}

export type AutoFixType =
  | 'description_added'     // Opis został wygenerowany automatycznie
  | 'name_deduplicated'     // Nazwa była duplikatem - dodano numer
  | 'name_transformed';     // Nazwa została poprawiona przez AI

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
      variants?: ServiceVariant[];
      _autoFixes?: AutoFixType[]; // Etykiety zmian automatycznych
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
  verificationReport?: VerificationReport;
}

// ============================================
// VERIFICATION TYPES
// ============================================

export interface VerificationIssue {
  type: "duplicate" | "missing_description" | "transformation_not_applied" | "category_change_not_applied" | "semantic_issue";
  severity: "error" | "warning" | "info";
  message: string;
  affectedService?: string;
  affectedCategory?: string;
  suggestion?: string;
}

export interface VerificationReport {
  isValid: boolean;
  totalServices: number;
  totalCategories: number;
  stats: {
    servicesWithDescriptions: number;
    servicesWithoutDescriptions: number;
    duplicateNames: number;
    transformationsApplied: number;
    transformationsExpected: number;
    categoryChangesApplied: number;
    categoryChangesExpected: number;
  };
  issues: VerificationIssue[];
  summary: string;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

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
  keywordReport: KeywordReport,
  namingTransformations: Array<{ before: string; after: string }> = [],
  auditIssues: Array<{ example?: string; fix?: string; issue?: string }> = []
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
  // Apply both category changes AND naming transformations from audit
  const proposedStructure = buildProposedStructure(scrapedData.categories, changes, proposedCategoryNames, namingTransformations);

  // Apply audit recommendations (e.g., "move to description", "add skin type info")
  if (auditIssues.length > 0) {
    console.log(`[CategoryProposal] Applying ${auditIssues.length} audit recommendations...`);
    const recommendationCount = applyAuditRecommendations(proposedStructure, auditIssues);
    console.log(`[CategoryProposal] Applied ${recommendationCount} recommendations from audit`);
  }

  // Run verification on the proposed structure
  console.log("[CategoryProposal] Running verification...");
  const verificationReport = verifyProposedStructure(
    scrapedData.categories,
    proposedStructure,
    changes,
    namingTransformations
  );

  // Auto-fix critical issues if any
  if (!verificationReport.isValid) {
    console.log("[CategoryProposal] Applying auto-fixes for critical issues...");
    const fixCount = autoFixProposedStructure(proposedStructure, verificationReport);
    if (fixCount > 0) {
      // Re-run verification after fixes
      const updatedReport = verifyProposedStructure(
        scrapedData.categories,
        proposedStructure,
        changes,
        namingTransformations
      );
      console.log(`[CategoryProposal] After auto-fix: ${updatedReport.summary}`);
      return {
        originalStructure: scrapedData.categories,
        proposedStructure,
        changes: changes.slice(0, 10),
        verificationReport: updatedReport,
      };
    }
  }

  return {
    originalStructure: scrapedData.categories,
    proposedStructure,
    changes: changes.slice(0, 10),
    verificationReport,
  };
}

/**
 * Apply naming improvements to ALL services in the pricelist.
 * If any transformation adds benefits/description to names, apply the same pattern to ALL services.
 * This is NOT limited to pattern-matching - it improves EVERY service that has a description.
 */
function propagateTransformationPatterns(
  categories: ScrapedData["categories"],
  transformations: Array<{ before: string; after: string }>
): void {
  if (transformations.length === 0) return;

  // Track which services have already been transformed
  const transformedNames = new Set<string>();
  for (const t of transformations) {
    transformedNames.add(t.before.toLowerCase().trim());
    transformedNames.add(t.after.toLowerCase().trim());
  }

  // Analyze transformations to detect the TYPE of improvement being made
  let addsBenefitSuffix = false;
  let separator = " - ";

  for (const t of transformations) {
    const before = t.before.trim();
    const after = t.after.trim();

    // Detect if transformation adds a suffix (benefit/description)
    if (after.toLowerCase().startsWith(before.toLowerCase()) && after.length > before.length + 5) {
      addsBenefitSuffix = true;
      const addedPart = after.substring(before.length).trim();
      const separatorMatch = addedPart.match(/^[\s]*[-–:]\s*/);
      if (separatorMatch) {
        separator = separatorMatch[0];
      }
      console.log(`[propagatePatterns] Detected improvement type: ADD_BENEFIT_SUFFIX with separator "${separator.trim()}"`);
      break;
    }
  }

  // If the audit recommends adding benefits to names, apply to ALL services with descriptions
  if (addsBenefitSuffix) {
    let improvedCount = 0;

    for (const cat of categories) {
      for (const service of cat.services) {
        const serviceName = service.name.trim();
        const serviceNameLower = serviceName.toLowerCase();

        // Skip if already transformed or already has a long descriptive name
        if (transformedNames.has(serviceNameLower)) continue;
        if (serviceName.includes(" - ") || serviceName.includes(": ") || serviceName.length > 50) continue;

        // Only improve services that have descriptions we can use
        if (!service.description || service.description.trim().length < 15) continue;

        // Generate improved name using service's description
        const desc = service.description.trim();

        // Extract a short, meaningful benefit phrase from description
        let shortDesc = extractBenefitPhrase(desc);
        if (!shortDesc || shortDesc.length < 5) continue;

        // Create the improved name
        const newName = `${serviceName}${separator}${shortDesc}`;

        // Don't make names excessively long
        if (newName.length > 80) continue;

        console.log(`[propagatePatterns] Improving: "${serviceName}" -> "${newName}"`);
        service.name = newName;
        transformedNames.add(serviceNameLower);
        transformedNames.add(newName.toLowerCase());
        improvedCount++;
      }
    }

    console.log(`[propagatePatterns] Improved ${improvedCount} service names by adding benefit descriptions`);
  }

  // Also generate basic descriptions for services that don't have any
  generateMissingDescriptions(categories);
}

/**
 * Generate simple descriptions for services that don't have any.
 * Uses the service name and category to create a basic description.
 */
function generateMissingDescriptions(categories: ScrapedData["categories"]): void {
  let generatedCount = 0;

  // Category-specific templates
  const categoryTemplates: Record<string, string> = {
    'manicure': 'Profesjonalna pielęgnacja paznokci dłoni',
    'pedicure': 'Profesjonalna pielęgnacja paznokci stóp',
    'masaż': 'Relaksujący zabieg masażu ciała',
    'twarz': 'Zabieg pielęgnacyjny skóry twarzy',
    'ciało': 'Zabieg pielęgnacyjny ciała',
    'włosy': 'Profesjonalna usługa fryzjerska',
    'brwi': 'Stylizacja i pielęgnacja brwi',
    'rzęsy': 'Profesjonalna stylizacja rzęs',
    'depilacja': 'Trwałe usuwanie niechcianego owłosienia',
    'laser': 'Nowoczesny zabieg laserowy',
    'mezoterapia': 'Odżywczy zabieg mezoterapeutyczny',
    'peeling': 'Głębokie oczyszczanie i odnowa skóry',
    'lifting': 'Zabieg ujędrniający i liftingujący',
    'botox': 'Precyzyjny zabieg redukcji zmarszczek',
    'kwas': 'Zabieg z wykorzystaniem aktywnych kwasów',
    'konsultacja': 'Profesjonalna konsultacja ze specjalistą',
  };

  for (const cat of categories) {
    const categoryNameLower = cat.name.toLowerCase();

    for (const service of cat.services) {
      // Skip if service already has a description
      if (service.description && service.description.trim().length > 5) continue;

      // Generate description based on service name and category
      const serviceName = service.name.trim();
      const serviceNameLower = serviceName.toLowerCase();

      // Find matching template from category or service name
      let template = '';
      for (const [keyword, desc] of Object.entries(categoryTemplates)) {
        if (categoryNameLower.includes(keyword) || serviceNameLower.includes(keyword)) {
          template = desc;
          break;
        }
      }

      if (!template) {
        // Generic template based on common beauty service patterns
        if (serviceNameLower.includes('zabieg')) {
          template = 'Profesjonalny zabieg pielęgnacyjny';
        } else if (serviceNameLower.includes('pakiet')) {
          template = 'Kompleksowy pakiet zabiegów';
        } else if (serviceNameLower.includes('kurs') || serviceNameLower.includes('szkolenie')) {
          template = 'Profesjonalne szkolenie z certyfikatem';
        } else {
          template = `Profesjonalna usługa: ${serviceName.split(/[-:–]/)[0].trim()}`;
        }
      }

      // Create description with service-specific details
      let description = template;

      // Add duration info if available
      if (service.duration) {
        description += `. Czas trwania: ${service.duration}`;
      }

      // Add price indication
      if (service.price && !service.price.toLowerCase().includes('od')) {
        description += `. Cena: ${service.price}`;
      }

      service.description = description;
      generatedCount++;
      console.log(`[generateMissingDescriptions] Generated: "${serviceName}" -> "${description.substring(0, 50)}..."`);
    }
  }

  if (generatedCount > 0) {
    console.log(`[generateMissingDescriptions] Generated ${generatedCount} missing descriptions`);
  }
}

/**
 * Extract a short, meaningful benefit phrase from a service description.
 * Focuses on: what the client gets, effects, or key features.
 */
function extractBenefitPhrase(description: string): string {
  const desc = description.trim();

  // Try to find benefit keywords and extract phrase around them
  const benefitPatterns = [
    /(?:zapewnia|daje|gwarantuje|oferuje)\s+([^.,;!?]+)/i,
    /(?:efekt|rezultat|korzyść)[:\s]+([^.,;!?]+)/i,
    /(?:dla|na)\s+([^.,;!?]{10,40})/i,
  ];

  for (const pattern of benefitPatterns) {
    const match = desc.match(pattern);
    if (match && match[1] && match[1].length >= 10 && match[1].length <= 50) {
      return cleanBenefitPhrase(match[1]);
    }
  }

  // Fallback: take first meaningful chunk of description
  // Split by punctuation and take first meaningful segment
  const segments = desc.split(/[.,;!?]+/).map(s => s.trim()).filter(s => s.length > 10);
  if (segments.length > 0) {
    let phrase = segments[0];

    // Limit length and end at word boundary
    if (phrase.length > 50) {
      phrase = phrase.substring(0, 50);
      const lastSpace = phrase.lastIndexOf(" ");
      if (lastSpace > 25) phrase = phrase.substring(0, lastSpace);
    }

    return cleanBenefitPhrase(phrase);
  }

  return "";
}

/**
 * Clean up a benefit phrase for use in service name.
 */
function cleanBenefitPhrase(phrase: string): string {
  let clean = phrase.trim();

  // Remove leading articles and prepositions
  clean = clean.replace(/^(to|jest|który|która|które|zabieg|usługa|ten|ta)\s+/i, "");

  // Remove trailing punctuation
  clean = clean.replace(/[.,;:!?…]+$/, "").trim();

  // Lowercase first letter if it's uppercase (for smooth concatenation)
  if (clean.length > 0 && /^[A-ZĄĆĘŁŃÓŚŹŻ]/.test(clean)) {
    clean = clean.charAt(0).toLowerCase() + clean.slice(1);
  }

  return clean;
}

// ============================================
// VERIFICATION FUNCTIONS
// ============================================

/**
 * Verify the proposed structure after all transformations have been applied.
 * Checks for: duplicates, missing descriptions, unapplied transformations, category changes.
 * Automatically fixes issues where possible.
 */
export function verifyProposedStructure(
  original: ScrapedData["categories"],
  proposed: ScrapedData["categories"],
  changes: CategoryChange[],
  namingTransformations: Array<{ before: string; after: string }>
): VerificationReport {
  const issues: VerificationIssue[] = [];
  let totalServices = 0;
  let servicesWithDescriptions = 0;
  let servicesWithoutDescriptions = 0;
  let duplicateCount = 0;

  // Normalize function for comparison
  const normalize = (s: string): string => {
    return s
      .replace(/^["'„""'']+|["'„""'']+$/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  };

  // 1. BUILD SERVICE MAP TO DETECT DUPLICATES
  const serviceNameMap = new Map<string, { category: string; service: ScrapedData["categories"][0]["services"][0] }[]>();

  for (const cat of proposed) {
    for (const service of cat.services) {
      totalServices++;
      const normalizedName = normalize(service.name);

      if (!serviceNameMap.has(normalizedName)) {
        serviceNameMap.set(normalizedName, []);
      }
      serviceNameMap.get(normalizedName)!.push({ category: cat.name, service });
    }
  }

  // 2. CHECK FOR DUPLICATES
  for (const [normalizedName, occurrences] of serviceNameMap.entries()) {
    if (occurrences.length > 1) {
      // Check if they're in different categories (which might be intentional)
      const categories = new Set(occurrences.map(o => o.category));

      if (categories.size === 1) {
        // Same category - definitely a problem
        duplicateCount++;
        issues.push({
          type: "duplicate",
          severity: "error",
          message: `Zduplikowana nazwa usługi: "${occurrences[0].service.name}" (${occurrences.length}x w kategorii "${occurrences[0].category}")`,
          affectedService: occurrences[0].service.name,
          affectedCategory: occurrences[0].category,
          suggestion: "Usuń duplikat lub zmień nazwę jednej z usług",
        });
      } else if (categories.size < occurrences.length) {
        // Some duplicates in same category
        duplicateCount++;
        issues.push({
          type: "duplicate",
          severity: "warning",
          message: `Usługa "${occurrences[0].service.name}" występuje ${occurrences.length} razy (w kategoriach: ${[...categories].join(", ")})`,
          affectedService: occurrences[0].service.name,
          suggestion: "Jeśli to celowe (np. Bestsellery), zignoruj. W przeciwnym razie usuń duplikaty.",
        });
      }
    }
  }

  // 3. CHECK FOR MISSING DESCRIPTIONS
  for (const cat of proposed) {
    for (const service of cat.services) {
      if (service.description && service.description.trim().length > 5) {
        servicesWithDescriptions++;
      } else {
        servicesWithoutDescriptions++;
        issues.push({
          type: "missing_description",
          severity: "warning",
          message: `Brak opisu usługi: "${service.name}" w kategorii "${cat.name}"`,
          affectedService: service.name,
          affectedCategory: cat.name,
          suggestion: "Dodaj opis zawierający korzyści dla klienta i czas trwania",
        });
      }
    }
  }

  // 4. CHECK IF NAMING TRANSFORMATIONS WERE APPLIED
  let transformationsApplied = 0;
  const transformationsExpected = namingTransformations.length;

  for (const transform of namingTransformations) {
    const normalizedBefore = normalize(transform.before);
    const normalizedAfter = normalize(transform.after);

    // Check if the "after" name exists in proposed structure
    let found = false;
    for (const cat of proposed) {
      for (const service of cat.services) {
        const normalizedServiceName = normalize(service.name);
        if (normalizedServiceName === normalizedAfter ||
            normalizedServiceName.includes(normalizedAfter) ||
            normalizedAfter.includes(normalizedServiceName)) {
          found = true;
          transformationsApplied++;
          break;
        }
      }
      if (found) break;
    }

    if (!found) {
      // Check if the original name still exists (transformation not applied)
      for (const cat of proposed) {
        for (const service of cat.services) {
          if (normalize(service.name) === normalizedBefore) {
            issues.push({
              type: "transformation_not_applied",
              severity: "warning",
              message: `Transformacja nie została zastosowana: "${transform.before}" → "${transform.after}"`,
              affectedService: transform.before,
              suggestion: `Zmień nazwę usługi na: "${transform.after}"`,
            });
            break;
          }
        }
      }
    }
  }

  // 5. CHECK IF CATEGORY CHANGES WERE APPLIED
  let categoryChangesApplied = 0;
  const categoryChangesExpected = changes.length;

  for (const change of changes) {
    let applied = false;

    switch (change.type) {
      case "rename_category": {
        if (change.toCategory) {
          const exists = proposed.some(c => c.name === change.toCategory);
          if (exists) {
            applied = true;
            categoryChangesApplied++;
          }
        }
        break;
      }

      case "create_category": {
        if (change.toCategory) {
          const exists = proposed.some(c => c.name === change.toCategory);
          if (exists) {
            applied = true;
            categoryChangesApplied++;
          }
        }
        break;
      }

      case "move_service": {
        if (change.services && change.toCategory) {
          const targetCat = proposed.find(c => c.name === change.toCategory);
          if (targetCat) {
            const movedCount = change.services.filter(svcName =>
              targetCat.services.some(s => normalize(s.name).includes(normalize(svcName)))
            ).length;
            if (movedCount > 0) {
              applied = true;
              categoryChangesApplied++;
            }
          }
        }
        break;
      }

      case "merge_categories":
      case "split_category":
      case "reorder_categories": {
        // These are harder to verify automatically, mark as applied if no errors
        applied = true;
        categoryChangesApplied++;
        break;
      }
    }

    if (!applied && change.type !== "merge_categories" && change.type !== "split_category" && change.type !== "reorder_categories") {
      issues.push({
        type: "category_change_not_applied",
        severity: "info",
        message: `Zmiana kategorii nie została w pełni zastosowana: ${change.description}`,
        affectedCategory: change.toCategory || change.fromCategory,
        suggestion: change.reason,
      });
    }
  }

  // 6. CHECK FOR SEMANTIC ISSUES
  // Check for very short names (less than 5 chars)
  for (const cat of proposed) {
    for (const service of cat.services) {
      if (service.name.trim().length < 5) {
        issues.push({
          type: "semantic_issue",
          severity: "warning",
          message: `Bardzo krótka nazwa usługi: "${service.name}" (${service.name.length} znaków)`,
          affectedService: service.name,
          affectedCategory: cat.name,
          suggestion: "Rozważ dodanie opisu do nazwy usługi",
        });
      }
    }
  }

  // Check for very long names (more than 100 chars)
  for (const cat of proposed) {
    for (const service of cat.services) {
      if (service.name.trim().length > 100) {
        issues.push({
          type: "semantic_issue",
          severity: "warning",
          message: `Bardzo długa nazwa usługi: "${service.name.substring(0, 50)}..." (${service.name.length} znaków)`,
          affectedService: service.name,
          affectedCategory: cat.name,
          suggestion: "Rozważ skrócenie nazwy i przeniesienie szczegółów do opisu",
        });
      }
    }
  }

  // Check for categories with very few or very many services
  for (const cat of proposed) {
    if (cat.services.length === 0) {
      issues.push({
        type: "semantic_issue",
        severity: "error",
        message: `Pusta kategoria: "${cat.name}"`,
        affectedCategory: cat.name,
        suggestion: "Usuń pustą kategorię lub dodaj do niej usługi",
      });
    } else if (cat.services.length === 1) {
      issues.push({
        type: "semantic_issue",
        severity: "info",
        message: `Kategoria z jedną usługą: "${cat.name}"`,
        affectedCategory: cat.name,
        suggestion: "Rozważ połączenie z inną kategorią",
      });
    } else if (cat.services.length > 30) {
      issues.push({
        type: "semantic_issue",
        severity: "warning",
        message: `Kategoria z dużą liczbą usług: "${cat.name}" (${cat.services.length} usług)`,
        affectedCategory: cat.name,
        suggestion: "Rozważ podzielenie na mniejsze podkategorie",
      });
    }
  }

  // 6b. CHECK FOR NAMES THAT LOOK LIKE INTERNAL NOTES OR INSTRUCTIONS
  const instructionPatterns = [
    /łączyć\s+(z|ze)\s+/i,           // "łączyć z przedramionami"
    /można\s+(łączyć|dodać|wybrać)/i, // "można łączyć z..."
    /patrz\s*:/i,                     // "patrz: ..."
    /uwaga\s*:/i,                     // "uwaga: ..."
    /wybierz\s+(z|jeden|jedną)/i,     // "wybierz z..."
    /do\s+wyboru\s*:/i,               // "do wyboru:"
    /opcjonalnie\s*:/i,               // "opcjonalnie:"
    /lub\s+\d+\s*(zł|pln)/i,          // "lub 50 zł"
    /^\s*\d+\s*(zł|pln)/i,            // starts with price
    /\?\s*$/,                         // ends with question mark
    /^\s*-\s+/,                       // starts with "- "
    /^\s*\*\s+/,                      // starts with "* "
    /dodatkow[oa]\s*:/i,              // "dodatkowo:"
    /info\s*:/i,                      // "info:"
    /ważne\s*:/i,                     // "ważne:"
    /^\s*lub\s+/i,                    // starts with "lub "
  ];

  for (const cat of proposed) {
    for (const service of cat.services) {
      const name = service.name;

      // Check if name matches any instruction pattern
      for (const pattern of instructionPatterns) {
        if (pattern.test(name)) {
          issues.push({
            type: "semantic_issue",
            severity: "error",
            message: `Nazwa wygląda jak notatka wewnętrzna: "${name}"`,
            affectedService: name,
            affectedCategory: cat.name,
            suggestion: "Nazwa powinna opisywać usługę, nie instrukcję",
          });
          break;
        }
      }

      // Check for names with colon followed by instruction-like text
      if (name.includes(":")) {
        const afterColon = name.split(":")[1]?.trim().toLowerCase() || "";
        const instructionWords = ["łączyć", "można", "wybierz", "patrz", "uwaga", "opcja", "lub"];
        if (instructionWords.some(word => afterColon.startsWith(word))) {
          // Already caught above, but double-check
          if (!issues.some(i => i.affectedService === name && i.type === "semantic_issue")) {
            issues.push({
              type: "semantic_issue",
              severity: "error",
              message: `Nazwa zawiera instrukcję po dwukropku: "${name}"`,
              affectedService: name,
              affectedCategory: cat.name,
              suggestion: "Usuń instrukcję i zostaw tylko nazwę usługi",
            });
          }
        }
      }
    }
  }

  // 7. BUILD SUMMARY
  const errorCount = issues.filter(i => i.severity === "error").length;
  const warningCount = issues.filter(i => i.severity === "warning").length;
  const infoCount = issues.filter(i => i.severity === "info").length;

  let summary = "";
  if (errorCount === 0 && warningCount === 0) {
    summary = `✓ Weryfikacja zakończona pomyślnie. ${totalServices} usług w ${proposed.length} kategoriach.`;
  } else if (errorCount === 0) {
    summary = `⚠ Weryfikacja zakończona z ${warningCount} ostrzeżeniami. ${totalServices} usług w ${proposed.length} kategoriach.`;
  } else {
    summary = `✗ Weryfikacja wykryła ${errorCount} błędów i ${warningCount} ostrzeżeń. Wymagana interwencja.`;
  }

  if (servicesWithoutDescriptions > 0) {
    summary += ` ${servicesWithoutDescriptions}/${totalServices} usług bez opisu.`;
  }

  if (duplicateCount > 0) {
    summary += ` ${duplicateCount} duplikatów nazw.`;
  }

  summary += ` Transformacje: ${transformationsApplied}/${transformationsExpected}.`;

  console.log(`[verifyProposedStructure] ${summary}`);
  console.log(`[verifyProposedStructure] Issues: ${errorCount} errors, ${warningCount} warnings, ${infoCount} info`);

  return {
    isValid: errorCount === 0,
    totalServices,
    totalCategories: proposed.length,
    stats: {
      servicesWithDescriptions,
      servicesWithoutDescriptions,
      duplicateNames: duplicateCount,
      transformationsApplied,
      transformationsExpected,
      categoryChangesApplied,
      categoryChangesExpected,
    },
    issues,
    summary,
  };
}

/**
 * Auto-fix common issues in the proposed structure.
 * Returns the number of fixes applied.
 */
export function autoFixProposedStructure(
  proposed: ScrapedData["categories"],
  verificationReport: VerificationReport
): number {
  let fixCount = 0;

  const normalize = (s: string): string => {
    return s.replace(/^["'„""'']+|["'„""'']+$/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  };

  // 1. FIX DUPLICATE NAMES IN SAME CATEGORY
  for (const cat of proposed) {
    const seenNames = new Map<string, number>();

    for (const service of cat.services) {
      const normalizedName = normalize(service.name);
      const count = seenNames.get(normalizedName) || 0;

      if (count > 0) {
        // Append number to make unique
        const originalName = service.name;
        service.name = `${service.name} (${count + 1})`;
        console.log(`[autoFix] Fixed duplicate: "${originalName}" -> "${service.name}"`);

        // Mark service as deduplicated
        if (!service._autoFixes) service._autoFixes = [];
        if (!service._autoFixes.includes('name_deduplicated')) {
          service._autoFixes.push('name_deduplicated');
        }

        fixCount++;
      }

      seenNames.set(normalizedName, count + 1);
    }
  }

  // 2. GENERATE MISSING DESCRIPTIONS
  if (verificationReport.stats.servicesWithoutDescriptions > 0) {
    let descriptionsFilled = 0;
    for (const cat of proposed) {
      for (const service of cat.services) {
        if (!service.description || service.description.trim().length <= 5) {
          const generatedDesc = generateDescriptionForService(service.name, cat.name, service.duration, service.price);
          if (generatedDesc) {
            service.description = generatedDesc;

            // Mark service as having auto-generated description
            if (!service._autoFixes) service._autoFixes = [];
            if (!service._autoFixes.includes('description_added')) {
              service._autoFixes.push('description_added');
            }

            descriptionsFilled++;
          }
        }
      }
    }
    if (descriptionsFilled > 0) {
      console.log(`[autoFix] Generated ${descriptionsFilled} missing descriptions`);
      fixCount += descriptionsFilled;
    }
  }

  // 3. FIX NAMES THAT LOOK LIKE INTERNAL NOTES
  const instructionPatterns = [
    /łączyć\s+(z|ze)\s+/i,
    /można\s+(łączyć|dodać|wybrać)/i,
    /patrz\s*:/i,
    /uwaga\s*:/i,
    /wybierz\s+(z|jeden|jedną)/i,
    /do\s+wyboru\s*:/i,
    /opcjonalnie\s*:/i,
    /dodatkow[oa]\s*:/i,
    /info\s*:/i,
    /ważne\s*:/i,
  ];

  for (const cat of proposed) {
    for (const service of cat.services) {
      const name = service.name;
      let needsFix = false;

      // Check if name matches any instruction pattern
      for (const pattern of instructionPatterns) {
        if (pattern.test(name)) {
          needsFix = true;
          break;
        }
      }

      // Check for names with colon followed by instruction
      if (!needsFix && name.includes(":")) {
        const afterColon = name.split(":")[1]?.trim().toLowerCase() || "";
        const instructionWords = ["łączyć", "można", "wybierz", "patrz", "uwaga", "opcja", "lub"];
        if (instructionWords.some(word => afterColon.startsWith(word))) {
          needsFix = true;
        }
      }

      if (needsFix) {
        const originalName = service.name;
        let fixedName = name;

        // Strategy 1: If has colon, take part before colon (but only if it's meaningful)
        if (name.includes(":")) {
          const beforeColon = name.split(":")[0].trim();
          if (beforeColon.length >= 3 && !/^\d+$/.test(beforeColon)) {
            fixedName = beforeColon;
          }
        }

        // Strategy 2: Remove instruction phrases
        fixedName = fixedName
          .replace(/\s*:\s*łączyć\s+(z|ze)\s+.*/i, "")
          .replace(/\s*-\s*można\s+.*/i, "")
          .replace(/\s*\(.*łączyć.*\)/i, "")
          .replace(/\s*\(.*można.*\)/i, "")
          .trim();

        // Only apply if we actually improved the name
        if (fixedName !== originalName && fixedName.length >= 3) {
          console.log(`[autoFix] Fixed instruction name: "${originalName}" -> "${fixedName}"`);
          service.name = fixedName;

          // Mark as name cleaned
          if (!service._autoFixes) service._autoFixes = [];
          if (!service._autoFixes.includes('name_transformed')) {
            service._autoFixes.push('name_transformed');
          }

          fixCount++;
        }
      }
    }
  }

  // 4. REMOVE EMPTY CATEGORIES
  const originalLength = proposed.length;
  const nonEmptyCategories = proposed.filter(c => c.services.length > 0);
  if (nonEmptyCategories.length < originalLength) {
    // Mutate in place by splicing
    proposed.length = 0;
    proposed.push(...nonEmptyCategories);
    fixCount += (originalLength - nonEmptyCategories.length);
    console.log(`[autoFix] Removed ${originalLength - nonEmptyCategories.length} empty categories`);
  }

  console.log(`[autoFix] Applied ${fixCount} automatic fixes`);
  return fixCount;
}

/**
 * Apply audit recommendations to the proposed structure.
 * Parses AI-generated fixes and executes applicable actions.
 */
export function applyAuditRecommendations(
  proposed: ScrapedData["categories"],
  auditIssues: Array<{ example?: string; fix?: string; issue?: string }>
): number {
  let appliedCount = 0;

  // Helper to find a service by name (fuzzy match)
  const findService = (name: string): { cat: ScrapedData["categories"][0]; service: ScrapedData["categories"][0]["services"][0]; index: number } | null => {
    const normalizedName = name.toLowerCase().trim();
    for (const cat of proposed) {
      for (let i = 0; i < cat.services.length; i++) {
        const svcName = cat.services[i].name.toLowerCase().trim();
        if (svcName === normalizedName || svcName.includes(normalizedName) || normalizedName.includes(svcName)) {
          return { cat, service: cat.services[i], index: i };
        }
      }
    }
    return null;
  };

  for (const issue of auditIssues) {
    if (!issue.example || !issue.fix) continue;

    const example = issue.example.replace(/^["'„""'']+|["'„""'']+$/g, '').trim();
    const fix = issue.fix.toLowerCase();

    // Pattern 1: "Usunąć X z nazwy i przenieść do opisu" or "przenieść do opisu"
    // Example: "Szyja (przód/tył)" -> Remove "(przód/tył)" from name, add to description
    if ((fix.includes('przenieś') || fix.includes('przenieść')) && fix.includes('opis')) {
      const match = findService(example);
      if (match) {
        const { service } = match;

        // Extract what should be moved - look for parentheses, dashes, colons
        const parenMatch = service.name.match(/\(([^)]+)\)/);
        const dashMatch = service.name.match(/\s+-\s+(.+)$/);
        const colonMatch = service.name.match(/:\s*(.+)$/);

        let toMove = '';
        let newName = service.name;

        if (parenMatch && fix.includes(parenMatch[1].toLowerCase().substring(0, 10))) {
          toMove = parenMatch[1];
          newName = service.name.replace(/\s*\([^)]+\)/, '').trim();
        } else if (dashMatch) {
          toMove = dashMatch[1];
          newName = service.name.replace(/\s+-\s+.+$/, '').trim();
        } else if (colonMatch && !service.name.toLowerCase().startsWith('pakiet')) {
          toMove = colonMatch[1];
          newName = service.name.replace(/:\s*.+$/, '').trim();
        } else if (parenMatch) {
          // Default: move parentheses content
          toMove = parenMatch[1];
          newName = service.name.replace(/\s*\([^)]+\)/, '').trim();
        }

        if (toMove && newName !== service.name) {
          // Add to description
          const existingDesc = service.description || '';
          const newDescPart = `Obszar: ${toMove}.`;
          service.description = existingDesc ? `${existingDesc} ${newDescPart}` : newDescPart;

          // Update name
          console.log(`[applyAuditRecommendations] Moved to description: "${service.name}" -> "${newName}" (moved: "${toMove}")`);
          service.name = newName;

          if (!service._autoFixes) service._autoFixes = [];
          if (!service._autoFixes.includes('name_transformed')) {
            service._autoFixes.push('name_transformed');
          }
          appliedCount++;
        }
      }
    }

    // Pattern 2: "Dodać informację o typie skóry" or "dodać dla kogo"
    if ((fix.includes('dodać') || fix.includes('dodaj')) &&
        (fix.includes('typ') || fix.includes('skór') || fix.includes('dla kogo') || fix.includes('skierowana'))) {
      const match = findService(example);
      if (match) {
        const { service, cat } = match;
        const nameLower = service.name.toLowerCase();
        const catLower = cat.name.toLowerCase();

        // Generate appropriate skin type info based on service name
        let skinTypeInfo = '';

        if (nameLower.includes('nawilż') || nameLower.includes('hydra') || nameLower.includes('aqua')) {
          skinTypeInfo = 'Idealne dla skóry suchej, odwodnionej i potrzebującej intensywnego nawilżenia.';
        } else if (nameLower.includes('lift') || nameLower.includes('napinaj') || nameLower.includes('ujędrn')) {
          skinTypeInfo = 'Polecane dla skóry dojrzałej, z oznakami starzenia i utraty jędrności.';
        } else if (nameLower.includes('oczyszcz') || nameLower.includes('detox')) {
          skinTypeInfo = 'Idealne dla skóry tłustej, mieszanej i skłonnej do niedoskonałości.';
        } else if (nameLower.includes('anti-age') || nameLower.includes('odmładz')) {
          skinTypeInfo = 'Polecane dla skóry dojrzałej 35+, z pierwszymi zmarszczkami.';
        } else if (nameLower.includes('rozjaśn') || nameLower.includes('przebarw')) {
          skinTypeInfo = 'Idealne dla skóry z przebarwieniami, nierównym kolorytem.';
        } else if (catLower.includes('twarz') || catLower.includes('pielęgn')) {
          skinTypeInfo = 'Odpowiedni dla każdego typu skóry. Konsultacja pomoże dobrać wariant.';
        }

        if (skinTypeInfo && service.description) {
          // Check if not already has skin type info
          if (!service.description.toLowerCase().includes('skór') &&
              !service.description.toLowerCase().includes('dla kogo') &&
              !service.description.toLowerCase().includes('idealne dla')) {
            service.description = `${service.description} ${skinTypeInfo}`;
            console.log(`[applyAuditRecommendations] Added skin type info to: "${service.name}"`);

            if (!service._autoFixes) service._autoFixes = [];
            if (!service._autoFixes.includes('description_added')) {
              service._autoFixes.push('description_added');
            }
            appliedCount++;
          }
        }
      }
    }

    // Pattern 3: "Usunąć X" from name (without moving to description)
    if (fix.includes('usunąć') && !fix.includes('opis') && !fix.includes('przenieś')) {
      const match = findService(example);
      if (match) {
        const { service } = match;

        // Find what to remove - look for quoted text in fix
        const quotedMatch = issue.fix?.match(/["'„""'']([^"'„""'']+)["'„""'']/);
        if (quotedMatch) {
          const toRemove = quotedMatch[1];
          if (service.name.includes(toRemove)) {
            const newName = service.name.replace(toRemove, '').replace(/\s+/g, ' ').trim();
            if (newName.length >= 3 && newName !== service.name) {
              console.log(`[applyAuditRecommendations] Removed from name: "${service.name}" -> "${newName}"`);
              service.name = newName;

              if (!service._autoFixes) service._autoFixes = [];
              if (!service._autoFixes.includes('name_transformed')) {
                service._autoFixes.push('name_transformed');
              }
              appliedCount++;
            }
          }
        }
      }
    }
  }

  console.log(`[applyAuditRecommendations] Applied ${appliedCount} recommendations from audit`);
  return appliedCount;
}

/**
 * Generate a description for a service based on its name and category.
 * Uses keyword matching and templates to create meaningful descriptions.
 */
function generateDescriptionForService(
  serviceName: string,
  categoryName: string,
  duration?: string,
  price?: string
): string {
  const nameLower = serviceName.toLowerCase();
  const categoryLower = categoryName.toLowerCase();

  // Keyword-based description templates
  const templates: Array<{ keywords: string[]; template: string }> = [
    // Face treatments
    { keywords: ['mezoterapia', 'mezo'], template: 'Zabieg mezoterapii dostarczający składniki odżywcze głęboko w skórę. Efekt: odżywiona, nawilżona i promienna cera.' },
    { keywords: ['peeling'], template: 'Profesjonalny peeling złuszczający martwy naskórek. Efekt: gładka, odświeżona i rozjaśniona skóra.' },
    { keywords: ['lifting', 'lift'], template: 'Zabieg liftingujący i ujędrniający skórę. Efekt: wyraźne napięcie i odmłodzenie.' },
    { keywords: ['botox', 'botoks'], template: 'Precyzyjny zabieg redukcji zmarszczek mimicznych. Efekt: naturalne wygładzenie i odmłodzenie.' },
    { keywords: ['kwas hialuronowy', 'hialuron'], template: 'Zabieg nawilżający z kwasem hialuronowym. Efekt: głębokie nawilżenie i wygładzenie zmarszczek.' },
    { keywords: ['oczyszczanie', 'oczyszczający'], template: 'Dogłębne oczyszczanie skóry usuwające zanieczyszczenia. Efekt: czysta, matowa i odświeżona cera.' },
    { keywords: ['nawilżanie', 'nawilżający'], template: 'Intensywny zabieg nawilżający skórę. Efekt: elastyczna, promienna i zdrowo wyglądająca skóra.' },
    { keywords: ['odmładzanie', 'odmładzający', 'anti-age', 'antiage'], template: 'Kompleksowy zabieg odmładzający. Efekt: redukcja oznak starzenia i świeży wygląd.' },
    { keywords: ['rf', 'radiofrekwencja'], template: 'Zabieg z wykorzystaniem fal radiowych. Efekt: ujędrnienie skóry i poprawa owalu twarzy.' },
    { keywords: ['laser', 'laserowy'], template: 'Nowoczesny zabieg laserowy. Efekt: precyzyjna korekta i widoczna poprawa stanu skóry.' },
    { keywords: ['hydrafacial', 'hydra'], template: 'Kompleksowy zabieg oczyszczająco-nawilżający. Efekt: głęboko oczyszczona i nawilżona skóra.' },

    // Body treatments
    { keywords: ['masaż'], template: 'Relaksujący masaż ciała. Efekt: odprężenie mięśni, redukcja napięcia i głęboki relaks.' },
    { keywords: ['endermologia'], template: 'Zabieg endermologii modelujący sylwetkę. Efekt: redukcja cellulitu i poprawa jędrności skóry.' },
    { keywords: ['kriolipoliza', 'krio'], template: 'Nieinwazyjny zabieg redukcji tkanki tłuszczowej. Efekt: wyszczuplenie wybranej partii ciała.' },
    { keywords: ['cellulit'], template: 'Zabieg antycellulitowy. Efekt: gładka skóra i zredukowany efekt "skórki pomarańczowej".' },
    { keywords: ['drenaż', 'limfatyczny'], template: 'Drenaż limfatyczny wspomagający detoksykację. Efekt: redukcja obrzęków i uczucie lekkości.' },
    { keywords: ['modelowanie', 'wyszczuplanie'], template: 'Zabieg modelujący sylwetkę. Efekt: smuklejsza figura i poprawa proporcji ciała.' },

    // Hair removal
    { keywords: ['depilacja laserowa'], template: 'Trwałe usuwanie owłosienia laserem. Efekt: gładka skóra na długo bez konieczności golenia.' },
    { keywords: ['depilacja', 'woskowanie', 'wosk'], template: 'Profesjonalne usuwanie owłosienia. Efekt: gładka i jedwabista skóra.' },
    { keywords: ['ipl', 'shr'], template: 'Depilacja światłem pulsacyjnym. Efekt: stopniowa redukcja owłosienia i gładka skóra.' },

    // Nails
    { keywords: ['manicure'], template: 'Profesjonalna pielęgnacja dłoni i paznokci. Efekt: zadbane, piękne dłonie.' },
    { keywords: ['pedicure'], template: 'Kompleksowa pielęgnacja stóp i paznokci. Efekt: zdrowe, zadbane stopy.' },
    { keywords: ['hybryda', 'hybrydowy'], template: 'Stylizacja paznokci lakierem hybrydowym. Efekt: trwały manicure bez odpryskiwań przez 2-3 tygodnie.' },
    { keywords: ['żel', 'żelowy'], template: 'Wzmocnienie paznokci metodą żelową. Efekt: mocne, piękne paznokcie.' },
    { keywords: ['przedłużanie paznokci'], template: 'Profesjonalne przedłużanie paznokci. Efekt: eleganckie, długie paznokcie.' },

    // Brows & Lashes
    { keywords: ['brwi', 'brew'], template: 'Profesjonalna stylizacja brwi. Efekt: perfekcyjnie wymodelowane brwi podkreślające spojrzenie.' },
    { keywords: ['rzęsy', 'rzęs'], template: 'Stylizacja rzęs nadająca głębię spojrzeniu. Efekt: gęste, długie rzęsy.' },
    { keywords: ['henna'], template: 'Koloryzacja henną. Efekt: intensywny kolor przez kilka tygodni.' },
    { keywords: ['laminowanie brwi'], template: 'Laminowanie brwi z utrwaleniem kształtu. Efekt: pełne, idealnie ułożone brwi.' },
    { keywords: ['przedłużanie rzęs', 'rzęsy 1:1', 'rzęsy objętościowe'], template: 'Profesjonalne przedłużanie rzęs. Efekt: naturalnie gęste i długie rzęsy.' },
    { keywords: ['microblading', 'pmu', 'makijaż permanentny'], template: 'Trwały makijaż permanentny. Efekt: perfekcyjny wygląd 24/7 bez codziennego makijażu.' },

    // Hair
    { keywords: ['strzyżenie'], template: 'Profesjonalne strzyżenie dopasowane do typu włosów i kształtu twarzy. Efekt: modna fryzura.' },
    { keywords: ['koloryzacja', 'farbowanie'], template: 'Profesjonalna koloryzacja włosów. Efekt: piękny, trwały kolor i zdrowy połysk.' },
    { keywords: ['balayage'], template: 'Koloryzacja techniką balayage. Efekt: naturalnie wyglądające refleksy i głębia koloru.' },
    { keywords: ['ombre'], template: 'Koloryzacja techniką ombre. Efekt: płynne przejście tonalne od ciemnych do jasnych.' },
    { keywords: ['keratyna', 'keratynowe'], template: 'Zabieg keratynowego prostowania i regeneracji. Efekt: gładkie, lśniące i zdrowe włosy.' },
    { keywords: ['laminowanie włosów'], template: 'Zabieg laminowania włosów. Efekt: niesamowity połysk i ochrona przed uszkodzeniami.' },

    // Other
    { keywords: ['konsultacja'], template: 'Profesjonalna konsultacja ze specjalistą. Omówienie potrzeb i dopasowanie zabiegów.' },
    { keywords: ['pakiet'], template: 'Kompleksowy pakiet zabiegów w atrakcyjnej cenie. Efekt: kompleksowa pielęgnacja.' },
    { keywords: ['promocja', 'promo'], template: 'Zabieg w specjalnej cenie promocyjnej. Skorzystaj z wyjątkowej okazji!' },
  ];

  // Find matching template
  for (const { keywords, template } of templates) {
    if (keywords.some(kw => nameLower.includes(kw) || categoryLower.includes(kw))) {
      let description = template;

      // Add duration if available
      if (duration) {
        description += ` Czas trwania: ${duration}.`;
      }

      return description;
    }
  }

  // Fallback: generate generic description based on category
  const categoryTemplates: Record<string, string> = {
    'manicure': 'Profesjonalna pielęgnacja paznokci dłoni zapewniająca piękny, zadbany wygląd.',
    'pedicure': 'Kompleksowa pielęgnacja stóp i paznokci dla zdrowego, estetycznego efektu.',
    'masaż': 'Relaksujący zabieg masażu ciała przynoszący odprężenie i ulgę.',
    'twarz': 'Profesjonalny zabieg pielęgnacyjny dla pięknej, zdrowej skóry twarzy.',
    'ciało': 'Zabieg pielęgnacyjny ciała poprawiający kondycję i wygląd skóry.',
    'włosy': 'Profesjonalna usługa fryzjerska dla pięknych, zdrowych włosów.',
    'brwi': 'Stylizacja i pielęgnacja brwi podkreślająca naturalne piękno.',
    'rzęsy': 'Profesjonalna stylizacja rzęs dla wyrazistego spojrzenia.',
    'depilacja': 'Trwałe usuwanie niechcianego owłosienia dla gładkiej skóry.',
    'laser': 'Nowoczesny zabieg laserowy o wysokiej skuteczności.',
    'mezoterapia': 'Odżywczy zabieg mezoterapeutyczny dla promieniowej skóry.',
    'peeling': 'Głębokie oczyszczanie i odnowa skóry dla świeżego wyglądu.',
    'lifting': 'Zabieg ujędrniający i liftingujący dla młodszego wyglądu.',
  };

  for (const [keyword, template] of Object.entries(categoryTemplates)) {
    if (categoryLower.includes(keyword) || nameLower.includes(keyword)) {
      let description = template;
      if (duration) {
        description += ` Czas trwania: ${duration}.`;
      }
      return description;
    }
  }

  // Ultimate fallback
  const fallback = `Profesjonalna usługa wykonywana przez doświadczonych specjalistów.`;
  return duration ? `${fallback} Czas trwania: ${duration}.` : fallback;
}

/**
 * Automatically clean service name by removing marketing garbage.
 * This is a DETERMINISTIC function - no AI involved.
 */
function autoCleanServiceName(name: string): string {
  let cleaned = name.trim();

  // Pattern 1: Remove everything after " - " if it's marketing text
  // "Pachy + Całe nogi - 100% skuteczności niezależnie od koloru skóry" -> "Pachy + Całe nogi"
  const dashMatch = cleaned.match(/^(.+?)\s+-\s+(.+)$/);
  if (dashMatch) {
    const beforeDash = dashMatch[1].trim();
    const afterDash = dashMatch[2].trim();

    // Check if after dash is marketing garbage (long, contains certain words)
    const isGarbage =
      afterDash.length > 20 ||
      /skuteczn/i.test(afterDash) ||
      /gładkoś[ćc]/i.test(afterDash) ||
      /niezależnie/i.test(afterDash) ||
      /długotrwał/i.test(afterDash) ||
      /komfort/i.test(afterDash) ||
      /profesjonaln/i.test(afterDash) ||
      /100%/i.test(afterDash) ||
      /efekt[yów]?\s/i.test(afterDash) ||
      /idealn/i.test(afterDash) ||
      /perfekcyjn/i.test(afterDash);

    if (isGarbage && beforeDash.length >= 3) {
      cleaned = beforeDash;
    }
  }

  // Pattern 2: Remove everything after ":" if it's marketing text or instruction
  // "Mezoterapia: głębokie nawilżenie" -> "Mezoterapia"
  // "Ramiona: łączyć z przedramionami" -> "Ramiona"
  const colonMatch = cleaned.match(/^(.+?):\s*(.+)$/);
  if (colonMatch) {
    const beforeColon = colonMatch[1].trim();
    const afterColon = colonMatch[2].trim();

    // Check if after colon is garbage
    const isGarbage =
      afterColon.length > 25 ||
      /łączyć/i.test(afterColon) ||
      /można/i.test(afterColon) ||
      /głębok/i.test(afterColon) ||
      /nawilż/i.test(afterColon) ||
      /odmłodz/i.test(afterColon) ||
      /relaks/i.test(afterColon) ||
      /pełen/i.test(afterColon) ||
      /wygod/i.test(afterColon) ||
      /estetyczn/i.test(afterColon) ||
      /obejmuje/i.test(afterColon) ||
      /zapewnia/i.test(afterColon) ||
      /idealne?/i.test(afterColon) ||
      /^\d+%/.test(afterColon); // starts with percentage

    // But keep colons that define scope: "Pakiet: Pachy + Bikini", "2 okolice: małe"
    const isScope =
      /^(pakiet|zestaw|\d+\s*(okolice?|zabiegi?|sesj[ei]))/i.test(beforeColon) ||
      /^[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż]*\s*\+/.test(afterColon); // "Pachy + Bikini"

    if (isGarbage && !isScope && beforeColon.length >= 3) {
      cleaned = beforeColon;
    }
  }

  // Pattern 3: Remove parentheses with marketing content
  // "Depilacja (trwałe efekty)" -> "Depilacja"
  // But keep: "Depilacja (pachy + bikini)" -> keep as is
  const parenMatch = cleaned.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (parenMatch) {
    const beforeParen = parenMatch[1].trim();
    const insideParen = parenMatch[2].trim();

    const isGarbage =
      insideParen.length > 30 ||
      /trwał/i.test(insideParen) ||
      /efekt/i.test(insideParen) ||
      /gładk/i.test(insideParen) ||
      /profesjonaln/i.test(insideParen) ||
      /idealn/i.test(insideParen);

    // Keep scope info like body parts
    const isScope =
      /\+/.test(insideParen) || // "pachy + bikini"
      /^(twarz|ciało|nogi|ręce|plecy|brzuch|pachy|bikini|wąsik|broda)/i.test(insideParen);

    if (isGarbage && !isScope && beforeParen.length >= 3) {
      cleaned = beforeParen;
    }
  }

  // Pattern 4: Trim excessively long names by cutting at reasonable boundary
  if (cleaned.length > 50) {
    // Try to cut at dash or colon
    const cutPoints = [
      cleaned.lastIndexOf(" - "),
      cleaned.lastIndexOf(": "),
      cleaned.lastIndexOf(" / "),
    ].filter(i => i > 10);

    if (cutPoints.length > 0) {
      const cutAt = Math.min(...cutPoints);
      cleaned = cleaned.substring(0, cutAt).trim();
    }
  }

  // Pattern 5: Clean up multiple spaces and trim
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Safety: don't return empty or too short
  if (cleaned.length < 3) {
    return name.trim();
  }

  return cleaned;
}

/**
 * Build proposed category structure by applying changes to original.
 * IMPORTANT: Copy full service data, not just names!
 * Also applies naming transformations from audit to improve service names.
 */
function buildProposedStructure(
  original: ScrapedData["categories"],
  changes: CategoryChange[],
  proposedNames: string[],
  namingTransformations: Array<{ before: string; after: string }> = []
): ScrapedData["categories"] {
  // Start with a DEEP copy of original - preserve all service data
  const proposed = JSON.parse(JSON.stringify(original)) as ScrapedData["categories"];

  // Normalize function - strips quotes, extra whitespace, and common formatting
  const normalize = (s: string): string => {
    return s
      .replace(/^["'„""'']+|["'„""'']+$/g, '') // Strip quotes at start/end
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .trim()
      .toLowerCase();
  };

  // =====================================================
  // STEP 0: AUTOMATIC NAME CLEANING (before AI transforms)
  // This runs deterministically on ALL names to remove garbage
  // =====================================================
  let autoCleanCount = 0;
  for (const cat of proposed) {
    for (const service of cat.services) {
      const cleanedName = autoCleanServiceName(service.name);
      if (cleanedName !== service.name) {
        console.log(`[buildProposedStructure] Auto-cleaned: "${service.name}" -> "${cleanedName}"`);
        service.name = cleanedName;

        // Mark service as auto-cleaned
        if (!service._autoFixes) service._autoFixes = [];
        if (!service._autoFixes.includes('name_transformed')) {
          service._autoFixes.push('name_transformed');
        }
        autoCleanCount++;
      }
    }
  }
  if (autoCleanCount > 0) {
    console.log(`[buildProposedStructure] Auto-cleaned ${autoCleanCount} service names`);
  }

  // Build a map of naming transformations for quick lookup (normalized keys)
  const nameTransformMap = new Map<string, string>();
  for (const t of namingTransformations) {
    const normalizedBefore = normalize(t.before);
    nameTransformMap.set(normalizedBefore, t.after);
    // Also store original for debug
    console.log(`[buildProposedStructure] Transform: "${t.before}" (normalized: "${normalizedBefore}") -> "${t.after}"`);
  }

  // Apply naming transformations to ALL services in proposed structure
  if (namingTransformations.length > 0) {
    let appliedCount = 0;
    for (const cat of proposed) {
      for (const service of cat.services) {
        const normalizedServiceName = normalize(service.name);

        // Try exact match first
        let newName = nameTransformMap.get(normalizedServiceName);

        // If no exact match, try fuzzy match (service name contains transform key or vice versa)
        if (!newName) {
          for (const [transformKey, transformValue] of nameTransformMap.entries()) {
            if (normalizedServiceName.includes(transformKey) || transformKey.includes(normalizedServiceName)) {
              // Extra check: at least 80% match by length to avoid false positives
              const minLen = Math.min(normalizedServiceName.length, transformKey.length);
              const maxLen = Math.max(normalizedServiceName.length, transformKey.length);
              if (minLen / maxLen > 0.8) {
                newName = transformValue;
                console.log(`[buildProposedStructure] Fuzzy match: "${service.name}" ~ "${transformKey}"`);
                break;
              }
            }
          }
        }

        if (newName) {
          console.log(`[buildProposedStructure] Applying: "${service.name}" -> "${newName}"`);
          service.name = newName;

          // Mark service as transformed
          if (!service._autoFixes) service._autoFixes = [];
          if (!service._autoFixes.includes('name_transformed')) {
            service._autoFixes.push('name_transformed');
          }

          appliedCount++;
        }
      }
    }
    console.log(`[buildProposedStructure] Applied ${appliedCount}/${namingTransformations.length} naming transformations`);

    // PATTERN PROPAGATION: Apply similar transformations to similar services
    // If "MS AquaLift" -> "MS AquaLift - intensywne nawilżenie", apply same pattern to "MS GlowLift", etc.
    propagateTransformationPatterns(proposed, namingTransformations);
  }

  // Build a map of all services for quick lookup (with potentially transformed names)
  const allServicesMap = new Map<string, ScrapedData["categories"][0]["services"][0]>();
  for (const cat of proposed) {
    for (const service of cat.services) {
      allServicesMap.set(normalize(service.name), service);
    }
  }
  // Also add original names to map for lookups
  for (const cat of original) {
    for (const service of cat.services) {
      const normalizedName = normalize(service.name);
      if (!allServicesMap.has(normalizedName)) {
        // Apply transformation if available
        const newName = nameTransformMap.get(normalizedName);
        if (newName) {
          allServicesMap.set(normalizedName, { ...service, name: newName });
        } else {
          allServicesMap.set(normalizedName, service);
        }
      }
    }
  }

  // Apply category rename changes
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

    // Extract naming transformations and audit issues from audit report (if enhanced report exists)
    let namingTransformations: Array<{ before: string; after: string }> = [];
    let auditIssues: Array<{ example?: string; fix?: string; issue?: string }> = [];
    if (audit.reportJson) {
      try {
        const report = JSON.parse(audit.reportJson);
        if (report.transformations) {
          namingTransformations = report.transformations
            .filter((t: { type?: string }) => t.type === "name")
            .map((t: { before: string; after: string }) => ({
              before: t.before,
              after: t.after,
            }));
          console.log(`[CategoryProposal] Found ${namingTransformations.length} naming transformations from audit`);
        }
        // Extract topIssues which contain actionable recommendations
        if (report.topIssues && Array.isArray(report.topIssues)) {
          auditIssues = report.topIssues.map((issue: { example?: string; fix?: string; issue?: string }) => ({
            example: issue.example,
            fix: issue.fix,
            issue: issue.issue,
          }));
          console.log(`[CategoryProposal] Found ${auditIssues.length} audit issues with recommendations`);
        }
      } catch (e) {
        console.log("[CategoryProposal] Could not parse audit report for transformations");
      }
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    console.log("[CategoryProposal] Generating AI proposal...");
    const proposal = await generateCategoryProposalWithAI(apiKey, scrapedData, keywordReport, namingTransformations, auditIssues);

    // Save to database (mutations are in auditAnalysisQueries.ts - separate file for V8 runtime)
    const proposalId: Id<"categoryProposals"> = await ctx.runMutation(
      internal.auditAnalysisQueries.saveCategoryProposal,
      {
        auditId: args.auditId,
        originalStructureJson: JSON.stringify(proposal.originalStructure),
        proposedStructureJson: JSON.stringify(proposal.proposedStructure),
        changes: proposal.changes,
        verificationReportJson: proposal.verificationReport
          ? JSON.stringify(proposal.verificationReport)
          : undefined,
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
