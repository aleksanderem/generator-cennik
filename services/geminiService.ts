
import { GoogleGenAI, Type } from "@google/genai";
import { PricingData, AuditResult } from "../types";

// Simple string hash function for cache keys
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
};

const CACHE_PREFIX = 'bp_cache_v2_'; // Incremented version
const AUDIT_CACHE_PREFIX = 'bp_audit_cache_v1_'; // Separate cache for audits
const FIRECRAWL_API_KEY = "fc-6a543492d8b84218882f9aeeb7b5f29b"; // Firecrawl API Key

// Recursive function to clean up AI hallucinations (like "null" strings)
const sanitizePricingData = (obj: any): any => {
  if (typeof obj !== 'object' || obj === null) {
    // If a value is the string "null", return undefined to prune it
    if (typeof obj === 'string' && (obj.toLowerCase() === 'null' || obj.toLowerCase() === 'undefined')) {
      return undefined;
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizePricingData).filter(item => item !== undefined);
  }

  const result: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = sanitizePricingData(obj[key]);
      
      // specific check for imageUrl
      if (key === 'imageUrl' && typeof value === 'string') {
        // If it doesn't look like a real URL, drop it
        if (!value.startsWith('http')) {
          continue; 
        }
      }

      if (value !== undefined) {
        result[key] = value;
      }
    }
  }
  return result;
};

const parsePricingData = async (rawData: string): Promise<PricingData> => {
  // 1. Check Cache
  const cacheKey = CACHE_PREFIX + simpleHash(rawData.trim());
  const cachedData = localStorage.getItem(cacheKey);
  
  if (cachedData) {
    console.log("Returning cached result");
    try {
      return JSON.parse(cachedData) as PricingData;
    } catch (e) {
      console.warn("Cache parse error, proceeding to API");
      localStorage.removeItem(cacheKey);
    }
  }

  // 2. Prepare API Call
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Brak klucza API. Upewnij się, że environment variable API_KEY jest ustawiony.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Jesteś ekspertem od strukturyzowania danych dla salonów beauty.
    Twoim zadaniem jest przeanalizowanie poniższego tekstu, który został skopiowany z arkusza kalkulacyjnego (Google Sheets/Excel).
    
    Zorganizuj te dane w logiczne kategorie.
    
    ZASADY KRYTYCZNE:
    1. Jeśli nie znajdziesz URL obrazka w tekście, NIE WYMYŚLAJ GO. Zostaw pole puste.
    2. Jeśli nie ma nazwy salonu, zostaw pole puste. Nie wpisuj "null" ani "brak".
    3. Wyciągnij tagi jak "Bestseller" czy "Nowość" tylko jeśli występują w tekście.

    Dla każdej usługi wyciągnij:
    - Nazwę usługi
    - Cenę (jako tekst)
    - Krótki opis
    - Czas trwania
    - isPromo (true jeśli cena jest obniżona/promocyjna)
    - imageUrl (Tylko jeśli w tekście jest link zaczynający się od http/https)
    - tags (Lista tekstowa)

    Dane surowe:
    """
    ${rawData}
    """
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            salonName: { type: Type.STRING, description: "Nazwa salonu, jeśli wykryta" },
            categories: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  categoryName: { type: Type.STRING },
                  services: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        price: { type: Type.STRING },
                        description: { type: Type.STRING },
                        duration: { type: Type.STRING },
                        isPromo: { type: Type.BOOLEAN },
                        imageUrl: { type: Type.STRING, description: "Link URL do zdjęcia" },
                        tags: { type: Type.ARRAY, items: { type: Type.STRING } }
                      },
                      required: ["name", "price", "isPromo"],
                    },
                  },
                },
                required: ["categoryName", "services"],
              },
            },
          },
          required: ["categories"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Otrzymano pustą odpowiedź od AI.");
    }

    let parsedData = JSON.parse(text) as PricingData;

    // Apply strict sanitization
    parsedData = sanitizePricingData(parsedData);

    // 3. Save to Cache
    try {
      localStorage.setItem(cacheKey, JSON.stringify(parsedData));
    } catch (e) {
      console.warn("Could not save to cache", e);
    }

    return parsedData;

  } catch (error) {
    console.error("Błąd podczas przetwarzania danych przez Gemini:", error);
    throw error;
  }
};

/**
 * Helper to fetch page content using Firecrawl API with RETRY logic.
 * Uses the /scrape endpoint to get clean Markdown.
 */
const fetchPageContent = async (url: string): Promise<string> => {
  const MAX_RETRIES = 3;
  let attempt = 0;
  
  while (attempt < MAX_RETRIES) {
    try {
      attempt++;
      console.log(`Fetching attempt ${attempt}/${MAX_RETRIES} for ${url}`);
      
      const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          url: url,
          formats: ["markdown"],
          // Critical for SPAs like Booksy: Wait for hydration
          waitFor: 3000 
        })
      });

      if (!response.ok) {
         const errText = await response.text();
         // If server error, throw to retry
         if (response.status >= 500 || response.status === 429) {
            throw new Error(`Server Error ${response.status}: ${errText}`);
         }
         // If client error (400, 404), do not retry
         console.error("Firecrawl Client Error:", errText);
         throw new Error(`Błąd pobierania strony: ${response.status}`);
      }

      const json = await response.json();
      
      if (!json.success || !json.data || !json.data.markdown) {
         console.warn("Firecrawl output structure unexpected:", json);
         throw new Error("Nie udało się uzyskać treści (Markdown) z odpowiedzi Firecrawl.");
      }

      return json.data.markdown;

    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      if (attempt === MAX_RETRIES) {
        throw new Error("Nie udało się pobrać zawartości strony po 3 próbach. Sprawdź łącze internetowe lub poprawność linku.");
      }
      // Exponential backoff: 1s, 2s, 4s...
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
    }
  }
  
  throw new Error("Unexpected error in fetch loop");
};

/**
 * Fetches pricing data from a given URL (using Firecrawl) AND performs a comprehensive Audit.
 * Includes Caching.
 */
const optimizeBooksyContent = async (url: string): Promise<AuditResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("Brak klucza API Gemini.");

  // 1. Check Cache
  const cacheKey = AUDIT_CACHE_PREFIX + simpleHash(url.trim());
  const cachedAudit = localStorage.getItem(cacheKey);

  if (cachedAudit) {
    console.log("Returning cached AUDIT result");
    try {
      const parsed = JSON.parse(cachedAudit);
      // Simple validation to ensure it's not a stale/bad cache
      if (parsed && parsed.overallScore !== undefined) {
        return parsed as AuditResult;
      }
    } catch (e) {
      console.warn("Audit cache parse error, proceeding to fetch");
      localStorage.removeItem(cacheKey);
    }
  }

  // 2. Fetch content (Markdown)
  console.log("Fetching Markdown content for:", url);
  const markdownContent = await fetchPageContent(url);
  const truncatedContent = markdownContent.substring(0, 80000);

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Jesteś Audytorem Cenników Salonów Beauty z 15-letnim doświadczeniem w marketingu.
    
    Twoim zadaniem jest przeanalizowanie surowej treści strony salonu (Markdown) i wykonanie trzech zadań:
    
    ZADANIE 1: EKSTRAKCJA (rawCsv)
    Wyciągnij wszystkie usługi w formacie surowym CSV (Nazwa, Cena, Opis, Czas). Bez żadnych zmian.
    
    ZADANIE 2: AUDYT (audit)
    Oceń cennik pod kątem 5 kluczowych kryteriów:
    1. Struktura (czy są kategorie?)
    2. Transparentność (czy wiadomo co zawiera cena?)
    3. Czas (czy podano czas trwania?)
    4. Język korzyści (czy opis sprzedaje?)
    5. Strategia (czy są warianty cenowe/promocje?)
    
    ZADANIE 3: OPTYMALIZACJA (optimizedText)
    Stwórz nową, ulepszoną wersję cennika gotową do wklejenia do generatora.
    - Dodaj język korzyści do opisów.
    - Dodaj tagi (Bestseller, Hit) tam gdzie to ma sens.
    
    Treść strony:
    """
    ${truncatedContent}
    """
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.NUMBER, description: "Ogólna ocena cennika 0-100" },
            generalFeedback: { type: Type.STRING, description: "Krótkie podsumowanie audytu" },
            stats: {
                type: Type.OBJECT,
                properties: {
                    serviceCount: { type: Type.NUMBER },
                    missingDescriptions: { type: Type.NUMBER },
                    missingDurations: { type: Type.NUMBER }
                }
            },
            categories: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  score: { type: Type.NUMBER },
                  status: { type: Type.STRING, enum: ["ok", "warning", "error"] },
                  message: { type: Type.STRING },
                  suggestion: { type: Type.STRING },
                }
              }
            },
            rawCsv: { type: Type.STRING, description: "Surowe dane w formacie CSV z nagłówkami" },
            optimizedText: { type: Type.STRING, description: "Gotowy tekst do wklejenia: Nazwa [TAB] Cena [TAB] Opis [TAB] Czas [TAB] Tagi" }
          },
          required: ["overallScore", "categories", "rawCsv", "optimizedText", "stats"]
        }
      },
    });

    const result = JSON.parse(response.text!) as AuditResult;
    
    // 3. Save to Cache on success
    try {
      localStorage.setItem(cacheKey, JSON.stringify(result));
    } catch (e) {
      console.warn("Could not save audit to cache", e);
    }

    return result;

  } catch (error) {
    console.error("Audit error:", error);
    throw error;
  }
};

export { parsePricingData, optimizeBooksyContent };
