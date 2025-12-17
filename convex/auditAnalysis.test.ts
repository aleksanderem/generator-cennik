import { describe, it, expect } from "vitest";
import {
  extractKeywords,
  calculateCategoryDistribution,
  buildOptimizationPrompt,
  validateOptimizationOptions,
  BEAUTY_KEYWORDS,
  ScrapedData,
  KeywordData,
  OptimizationOption,
  AuditContext,
} from "./auditAnalysis";

// --- TEST DATA ---

const SAMPLE_SCRAPED_DATA: ScrapedData = {
  salonName: "Beauty Studio Elegance",
  salonAddress: "ul. Kwiatowa 15, Warszawa",
  categories: [
    {
      name: "Zabiegi na twarz",
      services: [
        {
          name: "Mezoterapia igłowa",
          price: "350 zł",
          duration: "45 min",
          description: "Mezoterapia z kwasem hialuronowym dla skóry twarzy",
        },
        {
          name: "Peeling kawitacyjny",
          price: "150 zł",
          duration: "30 min",
          description: "Głębokie oczyszczanie twarzy",
        },
        {
          name: "Lifting ultradźwiękowy HIFU",
          price: "800 zł",
          duration: "60 min",
          description: "Niechirurgiczny lifting twarzy, odmładzanie skóry",
        },
      ],
    },
    {
      name: "Depilacja",
      services: [
        {
          name: "Depilacja laserowa nogi",
          price: "400 zł",
          duration: "45 min",
          description: "Depilacja laserowa obu nóg",
        },
        {
          name: "Depilacja laserowa bikini",
          price: "200 zł",
          duration: "20 min",
        },
        {
          name: "Woskowanie - pachy",
          price: "50 zł",
          duration: "15 min",
        },
      ],
    },
    {
      name: "Manicure",
      services: [
        {
          name: "Manicure hybrydowy",
          price: "120 zł",
          duration: "60 min",
          description: "Trwały lakier hybrydowy",
        },
        {
          name: "Manicure japoński",
          price: "80 zł",
          duration: "45 min",
          description: "Naturalny manicure pielęgnacyjny",
        },
      ],
    },
  ],
  totalServices: 8,
};

const EMPTY_SCRAPED_DATA: ScrapedData = {
  salonName: "Empty Salon",
  categories: [],
  totalServices: 0,
};

const SCRAPED_DATA_NO_KEYWORDS: ScrapedData = {
  salonName: "No Keywords Salon",
  categories: [
    {
      name: "Inne",
      services: [
        {
          name: "Coś nieznanego",
          price: "100 zł",
          description: "Opis bez słów kluczowych beauty",
        },
      ],
    },
  ],
  totalServices: 1,
};

// --- KEYWORD EXTRACTION TESTS ---

describe("BEAUTY_KEYWORDS", () => {
  it("should contain essential beauty industry keywords", () => {
    expect(BEAUTY_KEYWORDS).toContain("mezoterapia");
    expect(BEAUTY_KEYWORDS).toContain("peeling");
    expect(BEAUTY_KEYWORDS).toContain("lifting");
    expect(BEAUTY_KEYWORDS).toContain("manicure");
    expect(BEAUTY_KEYWORDS).toContain("depilacja laserowa");
  });

  it("should have a reasonable number of keywords", () => {
    expect(BEAUTY_KEYWORDS.length).toBeGreaterThan(30);
    expect(BEAUTY_KEYWORDS.length).toBeLessThan(200);
  });

  it("should not have duplicates", () => {
    const uniqueKeywords = new Set(BEAUTY_KEYWORDS);
    expect(uniqueKeywords.size).toBe(BEAUTY_KEYWORDS.length);
  });
});

describe("extractKeywords", () => {
  it("should extract keywords from service names and descriptions", () => {
    const keywords = extractKeywords(SAMPLE_SCRAPED_DATA);

    expect(keywords.length).toBeGreaterThan(0);

    // Check that mezoterapia was found
    const mezoterapia = keywords.find((k) => k.keyword === "mezoterapia");
    expect(mezoterapia).toBeDefined();
    expect(mezoterapia?.count).toBeGreaterThanOrEqual(1);
  });

  it("should track which categories contain each keyword", () => {
    const keywords = extractKeywords(SAMPLE_SCRAPED_DATA);

    const depilacja = keywords.find((k) => k.keyword === "depilacja laserowa");
    expect(depilacja).toBeDefined();
    expect(depilacja?.categories).toContain("Depilacja");
  });

  it("should track which services contain each keyword", () => {
    const keywords = extractKeywords(SAMPLE_SCRAPED_DATA);

    const peeling = keywords.find((k) => k.keyword === "peeling");
    expect(peeling).toBeDefined();
    expect(peeling?.services.some((s) => s.includes("Peeling"))).toBe(true);
  });

  it("should return keywords sorted by count (descending)", () => {
    const keywords = extractKeywords(SAMPLE_SCRAPED_DATA);

    for (let i = 0; i < keywords.length - 1; i++) {
      expect(keywords[i].count).toBeGreaterThanOrEqual(keywords[i + 1].count);
    }
  });

  it("should limit results to 50 keywords", () => {
    // Create large dataset
    const manyServices: ScrapedData = {
      salonName: "Big Salon",
      categories: Array.from({ length: 10 }, (_, catIdx) => ({
        name: `Category ${catIdx}`,
        services: Array.from({ length: 20 }, (_, svcIdx) => ({
          name: `${BEAUTY_KEYWORDS[svcIdx % BEAUTY_KEYWORDS.length]} service ${svcIdx}`,
          price: "100 zł",
          description: `Description with ${BEAUTY_KEYWORDS[(svcIdx + 5) % BEAUTY_KEYWORDS.length]}`,
        })),
      })),
      totalServices: 200,
    };

    const keywords = extractKeywords(manyServices);
    expect(keywords.length).toBeLessThanOrEqual(50);
  });

  it("should handle empty data gracefully", () => {
    const keywords = extractKeywords(EMPTY_SCRAPED_DATA);
    expect(keywords).toEqual([]);
  });

  it("should return empty array when no keywords match", () => {
    const keywords = extractKeywords(SCRAPED_DATA_NO_KEYWORDS);
    expect(keywords).toEqual([]);
  });

  it("should be case-insensitive", () => {
    const dataWithCaps: ScrapedData = {
      salonName: "Caps Salon",
      categories: [
        {
          name: "Test",
          services: [
            { name: "MEZOTERAPIA igłowa", price: "100 zł" },
            { name: "Peeling KAWITACYJNY", price: "100 zł" },
          ],
        },
      ],
      totalServices: 2,
    };

    const keywords = extractKeywords(dataWithCaps);
    expect(keywords.find((k) => k.keyword === "mezoterapia")).toBeDefined();
    expect(keywords.find((k) => k.keyword === "peeling")).toBeDefined();
  });

  it("should count occurrences correctly when keyword appears multiple times", () => {
    const dataWithDuplicates: ScrapedData = {
      salonName: "Duplicate Salon",
      categories: [
        {
          name: "Cat1",
          services: [
            { name: "Peeling enzymatyczny", price: "100 zł" },
            { name: "Peeling kawitacyjny", price: "150 zł" },
          ],
        },
        {
          name: "Cat2",
          services: [
            { name: "Peeling chemiczny", price: "200 zł" },
          ],
        },
      ],
      totalServices: 3,
    };

    const keywords = extractKeywords(dataWithDuplicates);
    const peeling = keywords.find((k) => k.keyword === "peeling");
    expect(peeling?.count).toBe(3);
    expect(peeling?.categories).toContain("Cat1");
    expect(peeling?.categories).toContain("Cat2");
  });
});

describe("calculateCategoryDistribution", () => {
  it("should calculate keyword count per category", () => {
    const keywords = extractKeywords(SAMPLE_SCRAPED_DATA);
    const distribution = calculateCategoryDistribution(SAMPLE_SCRAPED_DATA, keywords);

    expect(distribution.length).toBe(3); // 3 categories

    // Each category should have distribution data
    for (const cat of distribution) {
      expect(cat.categoryName).toBeDefined();
      expect(typeof cat.keywordCount).toBe("number");
      expect(Array.isArray(cat.topKeywords)).toBe(true);
    }
  });

  it("should sort categories by keyword count (descending)", () => {
    const keywords = extractKeywords(SAMPLE_SCRAPED_DATA);
    const distribution = calculateCategoryDistribution(SAMPLE_SCRAPED_DATA, keywords);

    for (let i = 0; i < distribution.length - 1; i++) {
      expect(distribution[i].keywordCount).toBeGreaterThanOrEqual(
        distribution[i + 1].keywordCount
      );
    }
  });

  it("should limit topKeywords to 5 per category", () => {
    const keywords = extractKeywords(SAMPLE_SCRAPED_DATA);
    const distribution = calculateCategoryDistribution(SAMPLE_SCRAPED_DATA, keywords);

    for (const cat of distribution) {
      expect(cat.topKeywords.length).toBeLessThanOrEqual(5);
    }
  });

  it("should handle empty keywords array", () => {
    const distribution = calculateCategoryDistribution(SAMPLE_SCRAPED_DATA, []);

    expect(distribution.length).toBe(3);
    for (const cat of distribution) {
      expect(cat.keywordCount).toBe(0);
      expect(cat.topKeywords).toEqual([]);
    }
  });

  it("should handle empty categories", () => {
    const keywords = extractKeywords(SAMPLE_SCRAPED_DATA);
    const distribution = calculateCategoryDistribution(EMPTY_SCRAPED_DATA, keywords);

    expect(distribution).toEqual([]);
  });
});

// --- OPTIMIZATION PROMPT BUILDER TESTS ---

describe("buildOptimizationPrompt", () => {
  const sampleServices = [
    { name: "Mezoterapia", price: "300 zł", description: "Zabieg odmładzający", duration: "45 min" },
    { name: "Peeling", price: "150 zł" },
  ];

  const sampleContext: AuditContext = {
    salonName: "Test Salon",
    overallScore: 65,
    weaknesses: ["Brak opisów", "Zbyt ogólne nazwy"],
    suggestedKeywords: ["kwas hialuronowy", "nawilżanie", "odmładzanie"],
  };

  it("should include salon name in context", () => {
    const prompt = buildOptimizationPrompt(["descriptions"], sampleContext, sampleServices);
    expect(prompt).toContain("Test Salon");
  });

  it("should include overall score when provided", () => {
    const prompt = buildOptimizationPrompt(["descriptions"], sampleContext, sampleServices);
    expect(prompt).toContain("65/100");
  });

  it("should include weaknesses when provided", () => {
    const prompt = buildOptimizationPrompt(["descriptions"], sampleContext, sampleServices);
    expect(prompt).toContain("Brak opisów");
    expect(prompt).toContain("Zbyt ogólne nazwy");
  });

  it("should add descriptions section when selected", () => {
    const prompt = buildOptimizationPrompt(["descriptions"], sampleContext, sampleServices);
    expect(prompt).toContain("[OPISY USŁUG]");
    expect(prompt).toContain("język korzyści");
  });

  it("should add SEO section with keywords when selected", () => {
    const prompt = buildOptimizationPrompt(["seo"], sampleContext, sampleServices);
    expect(prompt).toContain("[SŁOWA KLUCZOWE SEO]");
    expect(prompt).toContain("kwas hialuronowy");
    expect(prompt).toContain("nawilżanie");
  });

  it("should add categories section when selected and proposal exists", () => {
    const contextWithProposal: AuditContext = {
      ...sampleContext,
      categoryProposalJson: JSON.stringify({ proposedCategories: [] }),
    };
    const prompt = buildOptimizationPrompt(["categories"], contextWithProposal, sampleServices);
    expect(prompt).toContain("[STRUKTURA KATEGORII]");
  });

  it("should not add categories section when proposal is missing", () => {
    const prompt = buildOptimizationPrompt(["categories"], sampleContext, sampleServices);
    expect(prompt).not.toContain("[STRUKTURA KATEGORII]");
  });

  it("should add order section when selected", () => {
    const prompt = buildOptimizationPrompt(["order"], sampleContext, sampleServices);
    expect(prompt).toContain("[KOLEJNOŚĆ USŁUG]");
    expect(prompt).toContain("bestseller");
  });

  it("should add prices section when selected", () => {
    const prompt = buildOptimizationPrompt(["prices"], sampleContext, sampleServices);
    expect(prompt).toContain("[FORMATOWANIE CEN]");
  });

  it("should add duplicates section when selected", () => {
    const prompt = buildOptimizationPrompt(["duplicates"], sampleContext, sampleServices);
    expect(prompt).toContain("[DUPLIKATY I BŁĘDY]");
  });

  it("should add duration section when selected", () => {
    const prompt = buildOptimizationPrompt(["duration"], sampleContext, sampleServices);
    expect(prompt).toContain("[CZAS TRWANIA]");
  });

  it("should add tags section when selected", () => {
    const prompt = buildOptimizationPrompt(["tags"], sampleContext, sampleServices);
    expect(prompt).toContain("[TAGI I OZNACZENIA]");
    expect(prompt).toContain("Bestseller");
    expect(prompt).toContain("Nowość");
    expect(prompt).toContain("Premium");
  });

  it("should include all services in prompt", () => {
    const prompt = buildOptimizationPrompt(["descriptions"], sampleContext, sampleServices);
    expect(prompt).toContain("Mezoterapia");
    expect(prompt).toContain("Peeling");
    expect(prompt).toContain("300 zł");
    expect(prompt).toContain("150 zł");
  });

  it("should specify exact service count in rules", () => {
    const prompt = buildOptimizationPrompt(["descriptions"], sampleContext, sampleServices);
    expect(prompt).toContain("DOKŁADNIE 2 usług");
  });

  it("should combine multiple options correctly", () => {
    const options: OptimizationOption[] = ["descriptions", "seo", "tags"];
    const prompt = buildOptimizationPrompt(options, sampleContext, sampleServices);

    expect(prompt).toContain("[OPISY USŁUG]");
    expect(prompt).toContain("[SŁOWA KLUCZOWE SEO]");
    expect(prompt).toContain("[TAGI I OZNACZENIA]");
    expect(prompt).not.toContain("[KOLEJNOŚĆ USŁUG]");
    expect(prompt).not.toContain("[FORMATOWANIE CEN]");
  });

  it("should handle missing optional context fields", () => {
    const minimalContext: AuditContext = {};
    const prompt = buildOptimizationPrompt(["descriptions"], minimalContext, sampleServices);

    expect(prompt).toContain("Salon: Nieznany");
    expect(prompt).not.toContain("undefined");
  });

  it("should handle empty services array", () => {
    const prompt = buildOptimizationPrompt(["descriptions"], sampleContext, []);
    expect(prompt).toContain("DOKŁADNIE 0 usług");
  });
});

// --- VALIDATION TESTS ---

describe("validateOptimizationOptions", () => {
  it("should return valid for non-category options", () => {
    const result = validateOptimizationOptions(["descriptions", "seo", "tags"], false);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should return valid for categories option with proposal", () => {
    const result = validateOptimizationOptions(["categories"], true);
    expect(result.valid).toBe(true);
  });

  it("should return invalid for categories option without proposal", () => {
    const result = validateOptimizationOptions(["categories"], false);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("propozycji reorganizacji");
  });

  it("should return invalid for empty options array", () => {
    const result = validateOptimizationOptions([], true);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("co najmniej jeden obszar");
  });

  it("should allow categories combined with other options when proposal exists", () => {
    const result = validateOptimizationOptions(
      ["descriptions", "categories", "tags"],
      true
    );
    expect(result.valid).toBe(true);
  });

  it("should reject when categories is in mixed options but no proposal", () => {
    const result = validateOptimizationOptions(
      ["descriptions", "categories", "tags"],
      false
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain("propozycji reorganizacji");
  });

  it("should validate all option types individually", () => {
    const allOptions: OptimizationOption[] = [
      "descriptions",
      "seo",
      "order",
      "prices",
      "duplicates",
      "duration",
      "tags",
    ];

    for (const option of allOptions) {
      const result = validateOptimizationOptions([option], false);
      expect(result.valid).toBe(true);
    }
  });
});
