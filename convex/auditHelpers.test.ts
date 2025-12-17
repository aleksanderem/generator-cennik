import { describe, it, expect } from "vitest";
import {
  parseBooksyData,
  parseFromHtml,
  validateScrapedData,
  parseAuditReport,
  sanitizeAiResponse,
  isValidBooksyUrl,
  extractBooksySalonId,
  ScrapedData,
} from "./auditHelpers";

// --- TEST DATA ---

const SAMPLE_MARKDOWN_SIMPLE = `
# Studio Urody Bella

Adres: ul. Kwiatowa 15, Warszawa

## Zabiegi na twarz

Oczyszczanie twarzy - 150 zł 60 min
Profesjonalne oczyszczanie skóry z peelingiem

Mikrodermabrazja - 200 zł 45 min

## Manicure

Manicure klasyczny - 80 zł 30 min
Manicure hybrydowy - 120 zł 45 min
`;

const SAMPLE_MARKDOWN_COMPLEX = `
# Salon Piękności Glamour

Lokalizacja: Al. Jerozolimskie 100, 00-001 Warszawa

## Fryzjerstwo damskie

**Strzyżenie damskie** - 120 zł
Strzyżenie z modelowaniem dla wszystkich typów włosów

1. Koloryzacja całkowita - 250 zł 120 min
2. Balayage - 350 zł 180 min
3. Tonowanie - 100 zł 45 min

## Fryzjerstwo męskie

Strzyżenie męskie klasyczne - 50 zł 30 min
Strzyżenie maszynką - 40 zł 20 min
Strzyżenie z brodą - 80 zł 45 min

## Kosmetyka

Peeling kawitacyjny – 180 zł
Zabieg nawilżający – 220 zł
Mezoterapia igłowa - 400 zł
`;

const SAMPLE_MARKDOWN_MINIMAL = `
Usługi salonu

Strzyżenie - 50 zł
Farbowanie - 100 zł
`;

const SAMPLE_HTML = `
<div class="service-item">
  <h3 class="service-name">Manicure hybrydowy</h3>
  <span class="price">120 zł</span>
  <span class="duration">45 min</span>
</div>
<li class="offer-item">
  <strong>Pedicure spa</strong>
  <span>150 PLN</span>
</li>
<article class="service">
  <p class="title">Depilacja nogi</p>
  <span>200 zł</span>
  <span>60 min</span>
</article>
`;

const SAMPLE_AI_RESPONSE_VALID = JSON.stringify({
  overallScore: 72,
  generalFeedback: "Cennik jest dobrze zorganizowany, ale wymaga poprawy opisów usług.",
  salesPotential: "Średni - brak wyróżników i pakietów",
  strengths: ["Przejrzysta struktura", "Zróżnicowane usługi"],
  weaknesses: [
    { point: "Brak opisów", consequence: "Klient nie wie co dostanie" },
    { point: "Zbyt techniczne nazwy", consequence: "Odpycha laików" }
  ],
  recommendations: ["Dodaj opisy korzyści", "Stwórz pakiety"],
  beforeAfter: {
    before: "Mikrodermabrazja",
    after: "Mikrodermabrazja - Głębokie oczyszczenie i wygładzenie skóry",
    explanation: "Dodanie korzyści zwiększa konwersję"
  },
  growthTips: [
    {
      category: "SEO",
      title: "Optymalizacja nazw usług",
      description: "Używaj słów kluczowych w nazwach",
      impact: "Wysoki"
    },
    {
      category: "Konwersja",
      title: "Dodaj pakiety",
      description: "Pakiety zwiększają średnią wartość zamówienia",
      impact: "Średni"
    }
  ]
});

const SAMPLE_AI_RESPONSE_MALFORMED = JSON.stringify({
  overallScore: 150, // Invalid - over 100
  generalFeedback: 123, // Invalid - not string
  strengths: "single string", // Invalid - not array
  weaknesses: null,
  growthTips: [
    { category: "Invalid", title: "Test", description: "Test", impact: "Invalid" },
    { category: "SEO", title: "Valid", description: "Valid tip", impact: "Wysoki" }
  ]
});

// --- PARSER TESTS ---

describe("parseBooksyData", () => {
  it("should extract salon name from markdown header", () => {
    const result = parseBooksyData(SAMPLE_MARKDOWN_SIMPLE);
    expect(result.salonName).toBe("Studio Urody Bella");
  });

  it("should extract salon address", () => {
    const result = parseBooksyData(SAMPLE_MARKDOWN_SIMPLE);
    expect(result.salonAddress).toBe("ul. Kwiatowa 15, Warszawa");
  });

  it("should extract categories correctly", () => {
    const result = parseBooksyData(SAMPLE_MARKDOWN_SIMPLE);
    expect(result.categories.length).toBe(2);
    expect(result.categories[0].name).toBe("Zabiegi na twarz");
    expect(result.categories[1].name).toBe("Manicure");
  });

  it("should extract services with prices", () => {
    const result = parseBooksyData(SAMPLE_MARKDOWN_SIMPLE);
    const faceServices = result.categories[0].services;

    expect(faceServices.length).toBe(2);
    expect(faceServices[0].name).toBe("Oczyszczanie twarzy");
    expect(faceServices[0].price).toBe("150 zł");
  });

  it("should extract duration when present", () => {
    const result = parseBooksyData(SAMPLE_MARKDOWN_SIMPLE);
    const faceServices = result.categories[0].services;

    expect(faceServices[0].duration).toBe("60 min");
  });

  it("should extract descriptions when present", () => {
    const result = parseBooksyData(SAMPLE_MARKDOWN_SIMPLE);
    const faceServices = result.categories[0].services;

    expect(faceServices[0].description).toBe("Profesjonalne oczyszczanie skóry z peelingiem");
  });

  it("should handle complex markdown with bold text", () => {
    const result = parseBooksyData(SAMPLE_MARKDOWN_COMPLEX);
    expect(result.salonName).toBe("Salon Piękności Glamour");
    expect(result.categories.length).toBe(3);
  });

  it("should handle numbered lists in markdown", () => {
    const result = parseBooksyData(SAMPLE_MARKDOWN_COMPLEX);
    const hairServices = result.categories[0].services;

    // Should include numbered items
    const colorService = hairServices.find(s => s.name.includes("Koloryzacja"));
    expect(colorService).toBeDefined();
    expect(colorService?.price).toBe("250 zł");
  });

  it("should count total services correctly", () => {
    const result = parseBooksyData(SAMPLE_MARKDOWN_COMPLEX);
    expect(result.totalServices).toBeGreaterThan(5);
  });

  it("should handle minimal markdown without categories", () => {
    const result = parseBooksyData(SAMPLE_MARKDOWN_MINIMAL);
    expect(result.categories.length).toBeGreaterThanOrEqual(1);
    expect(result.totalServices).toBe(2);
  });

  it("should handle PLN price format", () => {
    const markdown = "Usługa testowa - 100 PLN";
    const result = parseBooksyData(markdown);
    expect(result.categories[0].services[0].price).toBe("100 PLN");
  });

  it("should handle decimal prices", () => {
    const markdown = "Usługa - 99,90 zł";
    const result = parseBooksyData(markdown);
    expect(result.categories[0].services[0].price).toBe("99,90 zł");
  });

  it("should fall back to HTML parsing when markdown has too few services", () => {
    const poorMarkdown = "Jedna usługa - 50 zł";
    const result = parseBooksyData(poorMarkdown, SAMPLE_HTML);

    // Should use HTML result since markdown has only 1 service
    expect(result.totalServices).toBeGreaterThanOrEqual(1);
  });

  it("should preserve raw markdown in result", () => {
    const result = parseBooksyData(SAMPLE_MARKDOWN_SIMPLE);
    expect(result.rawMarkdown).toBe(SAMPLE_MARKDOWN_SIMPLE);
  });
});

describe("parseFromHtml", () => {
  it("should extract services from HTML with service-item class", () => {
    const result = parseFromHtml(SAMPLE_HTML);
    expect(result.categories.length).toBeGreaterThanOrEqual(1);
  });

  it("should extract service names from various HTML structures", () => {
    const result = parseFromHtml(SAMPLE_HTML);
    const serviceNames = result.categories[0].services.map(s => s.name);

    expect(serviceNames).toContain("Manicure hybrydowy");
  });

  it("should extract prices in different formats", () => {
    const result = parseFromHtml(SAMPLE_HTML);
    const prices = result.categories[0].services.map(s => s.price);

    expect(prices.some(p => p.includes("zł") || p.includes("PLN"))).toBe(true);
  });

  it("should handle empty HTML gracefully", () => {
    const result = parseFromHtml("");
    expect(result.categories).toEqual([]);
    expect(result.totalServices).toBe(0);
  });

  it("should handle HTML without matching patterns", () => {
    const result = parseFromHtml("<div>No services here</div>");
    expect(result.totalServices).toBe(0);
  });
});

// --- VALIDATION TESTS ---

describe("validateScrapedData", () => {
  it("should return null for valid data", () => {
    const validData: ScrapedData = {
      categories: [
        { name: "Test", services: [
          { name: "S1", price: "100 zł" },
          { name: "S2", price: "200 zł" },
          { name: "S3", price: "300 zł" },
        ]}
      ],
      totalServices: 3,
      rawMarkdown: "",
    };

    expect(validateScrapedData(validData)).toBeNull();
  });

  it("should return error for no categories", () => {
    const data: ScrapedData = {
      categories: [],
      totalServices: 0,
      rawMarkdown: "",
    };

    const error = validateScrapedData(data);
    expect(error).not.toBeNull();
    expect(error?.code).toBe("NO_CATEGORIES");
  });

  it("should return error for too few services", () => {
    const data: ScrapedData = {
      categories: [
        { name: "Test", services: [
          { name: "S1", price: "100 zł" },
          { name: "S2", price: "200 zł" },
        ]}
      ],
      totalServices: 2,
      rawMarkdown: "",
    };

    const error = validateScrapedData(data);
    expect(error).not.toBeNull();
    expect(error?.code).toBe("TOO_FEW_SERVICES");
    expect(error?.details?.found).toBe(2);
    expect(error?.details?.minimum).toBe(3);
  });

  it("should return error for too many empty categories", () => {
    const data: ScrapedData = {
      categories: [
        { name: "Empty1", services: [] },
        { name: "Empty2", services: [] },
        { name: "Empty3", services: [] },
        { name: "HasServices", services: [
          { name: "S1", price: "100 zł" },
          { name: "S2", price: "200 zł" },
          { name: "S3", price: "300 zł" },
        ]}
      ],
      totalServices: 3,
      rawMarkdown: "",
    };

    const error = validateScrapedData(data);
    expect(error).not.toBeNull();
    expect(error?.code).toBe("TOO_MANY_EMPTY_CATEGORIES");
  });

  it("should accept data with some empty categories (under 50%)", () => {
    const data: ScrapedData = {
      categories: [
        { name: "Empty1", services: [] },
        { name: "HasServices1", services: [
          { name: "S1", price: "100 zł" },
          { name: "S2", price: "200 zł" },
        ]},
        { name: "HasServices2", services: [
          { name: "S3", price: "300 zł" },
        ]}
      ],
      totalServices: 3,
      rawMarkdown: "",
    };

    expect(validateScrapedData(data)).toBeNull();
  });
});

// --- AI RESPONSE PARSING TESTS ---

describe("parseAuditReport", () => {
  it("should parse valid AI response correctly", () => {
    const report = parseAuditReport(SAMPLE_AI_RESPONSE_VALID);

    expect(report.overallScore).toBe(72);
    expect(report.generalFeedback).toContain("dobrze zorganizowany");
    expect(report.strengths.length).toBe(2);
    expect(report.weaknesses.length).toBe(2);
    expect(report.recommendations.length).toBe(2);
    expect(report.growthTips.length).toBe(2);
  });

  it("should fix invalid overallScore (too high)", () => {
    const report = parseAuditReport(SAMPLE_AI_RESPONSE_MALFORMED);
    expect(report.overallScore).toBe(50); // Default fallback
  });

  it("should fix invalid overallScore (negative)", () => {
    const malformed = JSON.stringify({ overallScore: -10 });
    const report = parseAuditReport(malformed);
    expect(report.overallScore).toBe(50);
  });

  it("should handle missing arrays by providing defaults", () => {
    const minimal = JSON.stringify({ overallScore: 60 });
    const report = parseAuditReport(minimal);

    expect(Array.isArray(report.strengths)).toBe(true);
    expect(Array.isArray(report.weaknesses)).toBe(true);
    expect(Array.isArray(report.recommendations)).toBe(true);
    expect(Array.isArray(report.growthTips)).toBe(true);
  });

  it("should filter invalid growthTips", () => {
    const report = parseAuditReport(SAMPLE_AI_RESPONSE_MALFORMED);

    // Should only keep the valid tip (SEO category, Wysoki impact)
    expect(report.growthTips.length).toBe(1);
    expect(report.growthTips[0].category).toBe("SEO");
  });

  it("should handle non-string generalFeedback", () => {
    const report = parseAuditReport(SAMPLE_AI_RESPONSE_MALFORMED);
    expect(typeof report.generalFeedback).toBe("string");
  });

  it("should preserve beforeAfter when present", () => {
    const report = parseAuditReport(SAMPLE_AI_RESPONSE_VALID);

    expect(report.beforeAfter).toBeDefined();
    expect(report.beforeAfter?.before).toBe("Mikrodermabrazja");
  });

  it("should throw on invalid JSON", () => {
    expect(() => parseAuditReport("not json")).toThrow();
  });
});

describe("sanitizeAiResponse", () => {
  it("should remove emojis from text", () => {
    const text = "Super wynik! 🎉 Gratulacje 👏";
    const result = sanitizeAiResponse(text);
    expect(result).toBe("Super wynik!  Gratulacje");
  });

  it("should preserve regular text", () => {
    const text = "Normalny tekst bez emotikonów";
    const result = sanitizeAiResponse(text);
    expect(result).toBe("Normalny tekst bez emotikonów");
  });

  it("should trim whitespace", () => {
    const text = "  Tekst z spacjami  ";
    const result = sanitizeAiResponse(text);
    expect(result).toBe("Tekst z spacjami");
  });

  it("should handle multiple emojis", () => {
    const text = "😀😁😂 Test 🎯🎲🎮";
    const result = sanitizeAiResponse(text);
    expect(result).toBe("Test");
  });
});

// --- URL VALIDATION TESTS ---

describe("isValidBooksyUrl", () => {
  it("should accept valid Booksy URLs", () => {
    expect(isValidBooksyUrl("https://booksy.com/pl-pl/12345")).toBe(true);
    expect(isValidBooksyUrl("https://www.booksy.com/pl-pl/salon/123")).toBe(true);
    expect(isValidBooksyUrl("http://booksy.com/en-us/test")).toBe(true);
  });

  it("should reject non-Booksy URLs", () => {
    expect(isValidBooksyUrl("https://google.com")).toBe(false);
    expect(isValidBooksyUrl("https://example.com/booksy")).toBe(false);
  });

  it("should reject invalid URLs", () => {
    expect(isValidBooksyUrl("not-a-url")).toBe(false);
    expect(isValidBooksyUrl("")).toBe(false);
    expect(isValidBooksyUrl("booksy.com")).toBe(false); // Missing protocol
  });
});

describe("extractBooksySalonId", () => {
  it("should extract salon ID from standard URL", () => {
    const url = "https://booksy.com/pl-pl/123456/salon-name/789012";
    expect(extractBooksySalonId(url)).toBe("789012");
  });

  it("should return null for URLs without salon ID", () => {
    const url = "https://booksy.com/pl-pl/";
    expect(extractBooksySalonId(url)).toBeNull();
  });

  it("should handle different locale formats", () => {
    const url = "https://booksy.com/en-us/business/salon/123456";
    expect(extractBooksySalonId(url)).toBe("123456");
  });
});

// --- EDGE CASES ---

describe("Edge cases", () => {
  it("should handle markdown with Unicode characters", () => {
    const markdown = "## Usługi świąteczne\nMasaż relaksacyjny - 200 zł";
    const result = parseBooksyData(markdown);
    expect(result.categories[0].name).toBe("Usługi świąteczne");
  });

  it("should handle very long service names (truncation)", () => {
    const longName = "A".repeat(250);
    const markdown = `${longName} - 100 zł`;
    const result = parseBooksyData(markdown);
    // Should not include services with names > 200 chars
    expect(result.totalServices).toBe(0);
  });

  it("should handle markdown with only headers (no services)", () => {
    const markdown = "# Salon\n## Kategoria 1\n## Kategoria 2";
    const result = parseBooksyData(markdown);
    expect(result.totalServices).toBe(0);
  });

  it("should handle prices with different separators", () => {
    const markdown = `
Usługa 1 - 100.50 zł
Usługa 2 - 200,99 zł
Usługa 3 - 300 PLN
`;
    const result = parseBooksyData(markdown);
    expect(result.totalServices).toBe(3);
  });
});
