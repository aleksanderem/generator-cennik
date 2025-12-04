
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

const CACHE_PREFIX = 'bp_cache_v1_';

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
    Twoim zadaniem jest przeanalizowanie poniższego tekstu, który został skopiowany z arkusza kalkulacyjnego (Google Sheets/Excel) zawierającego cennik usług.
    
    Zorganizuj te dane w logiczne kategorie (np. Fryzjerstwo, Kosmetyka, Manicure).
    Dla każdej usługi wyciągnij:
    - Nazwę usługi
    - Cenę (jako tekst, np. "100 zł", "od 150 zł")
    - Krótki opis (jeśli istnieje w tekście)
    - Czas trwania (jeśli istnieje, np. "60 min")
    - Czy jest to promocja (isPromo)? Jeśli cena jest wyraźnie obniżona, oznaczona jako "promocja", "rabat", "hit" lub "super cena", ustaw true.
    - URL obrazka (imageUrl): Jeśli w tekście znajdziesz link URL kończący się na jpg, png, webp lub jpeg, przypisz go tutaj.
    - Tagi (tags): Jeśli w tekście znajdziesz słowa kluczowe typu "Bestseller", "Nowość", "Hit", "Polecane", dodaj je jako listę tekstową.

    Jeśli znajdziesz nazwę salonu na początku, wyciągnij ją.

    Oto dane surowe:
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
                  categoryName: { type: Type.STRING, description: "Nazwa kategorii, np. Stylizacja Paznokci" },
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
                        imageUrl: { type: Type.STRING, description: "Link do zdjęcia usługi jeśli znaleziono" },
                        tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Np. Bestseller, Nowość" }
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

    const parsedData = JSON.parse(text) as PricingData;

    // Sanitize 'null' string if present
    if (parsedData.salonName === 'null') {
      parsedData.salonName = undefined;
    }

    // 3. Save to Cache
    try {
      localStorage.setItem(cacheKey, JSON.stringify(parsedData));
    } catch (e) {
      console.warn("Could not save to cache (quota exceeded?)", e);
    }

    return parsedData;

  } catch (error) {
    console.error("Błąd podczas przetwarzania danych przez Gemini:", error);
    throw error;
  }
};

export { parsePricingData };
