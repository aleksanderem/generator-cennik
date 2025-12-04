import { GoogleGenAI, Type } from "@google/genai";
import { PricingData } from "../types";

const parsePricingData = async (rawData: string): Promise<PricingData> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Brak klucza API. Upewnij się, że environment variable API_KEY jest ustawiony.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Jesteś ekspertem od strukturyzowania danych dla salonów beauty.
    Twoim zadaniem jest przeanalizowanie poniższego tekstu, który został skopiowany z arkusza kalkulacyjnego (Google Sheets/Excel) zawierającego cennik usług.
    
    Zorganizuj te dane w logiczne kategorie (np. Fryzjerstwo, Kosmetyka, Manicure, Pedicure, Masaże - w zależności od tego, co znajdziesz w tekście).
    Dla każdej usługi wyciągnij:
    - Nazwę usługi
    - Cenę (jako tekst, np. "100 zł", "od 150 zł")
    - Krótki opis (jeśli istnieje w tekście)
    - Czas trwania (jeśli istnieje, np. "60 min")
    - Czy jest to promocja (isPromo)? Jeśli cena jest wyraźnie obniżona, oznaczona jako "promocja", "rabat", "hit" lub "super cena", ustaw true.
    
    Jeśli znajdziesz nazwę salonu na początku, wyciągnij ją. Jeśli nie, zostaw puste lub wymyśl ogólną nazwę pasującą do usług.

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

    return JSON.parse(text) as PricingData;

  } catch (error) {
    console.error("Błąd podczas przetwarzania danych przez Gemini:", error);
    throw error;
  }
};

export { parsePricingData };