
import { GoogleGenAI, Type } from "@google/genai";
import { PricingData } from "../types";

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

export { parsePricingData };
