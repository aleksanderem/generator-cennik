
import { GoogleGenAI, Type } from "@google/genai";
import { PricingData, AuditResult, StructuredAudit } from "../types";

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
const AUDIT_CACHE_PREFIX = 'bp_audit_cache_v2_'; // Incremented for new n8n format
const N8N_WEBHOOK_URL = "https://n8n.kolabogroup.pl/webhook/36fc010f-9dd1-4554-b027-3497525babe9";

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

const parsePricingData = async (rawData: string, auditContext?: string): Promise<PricingData> => {
  // 1. Check Cache
  const cacheKey = CACHE_PREFIX + simpleHash(rawData.trim() + (auditContext || ''));
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

  let instructions = `
    Jesteś ekspertem od strukturyzowania danych dla salonów beauty.
    Twoim zadaniem jest przeanalizowanie poniższego tekstu, który został skopiowany z arkusza kalkulacyjnego lub wygenerowany automatycznie.
    
    Zorganizuj te dane w logiczne kategorie.
    
    ZASADY KRYTYCZNE:
    1. Jeśli nie znajdziesz URL obrazka w tekście, NIE WYMYŚLAJ GO. Zostaw pole puste.
    2. Jeśli nie ma nazwy salonu, zostaw pole puste. Nie wpisuj "null" ani "brak".
    3. Wyciągnij tagi jak "Bestseller" czy "Nowość" tylko jeśli występują w tekście.
    4. Zachowaj ceny BEZ ZMIAN.
  `;

  if (auditContext) {
    instructions += `
    DODATKOWE ZADANIE (COPYWRITING):
    Otrzymałeś następujące wytyczne z audytu jakościowego:
    """${auditContext}"""
    
    Twoim zadaniem jest nie tylko sformatowanie danych, ale także ULEPSZENIE opisów usług zgodnie z tymi wytycznymi.
    - Dodaj język korzyści.
    - Jeśli brakuje opisu, stwórz krótki, zachęcający opis na podstawie nazwy usługi.
    - Popraw literówki i błędy stylistyczne.
    - Nie zmieniaj cen ani czasu trwania.
    `;
  }

  const prompt = `
    ${instructions}

    Dane surowe do przetworzenia:
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

    let parsedData: PricingData;
    try {
      parsedData = JSON.parse(text) as PricingData;
    } catch (e: any) {
      console.error("JSON Parse Error in parsePricingData:", e);
      // Re-throw with detailed message so UI shows "Unterminated string..."
      throw new Error(`Błąd parsowania JSON (Gemini): ${e.message}`);
    }

    // Apply strict sanitization
    parsedData = sanitizePricingData(parsedData);

    // 3. Save to Cache
    try {
      localStorage.setItem(cacheKey, JSON.stringify(parsedData));
    } catch (e) {
      console.warn("Could not save to cache", e);
    }

    return parsedData;

  } catch (error: any) {
    console.error("Błąd krytyczny (parsePricingData):", error);
    // Ensure we throw the specific message
    throw new Error(error.message || "Wystąpił nieznany błąd podczas generowania cennika.");
  }
};

/**
 * Takes raw audit text and structures it into a JSON object using Gemini
 */
const structureAuditReport = async (rawAuditText: string): Promise<StructuredAudit> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return { executiveSummary: rawAuditText, strengths: [], weaknesses: [], marketingScore: 50, toneVoice: "Standardowy" };

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Przeanalizuj poniższy tekst audytu cennika salonu beauty.
    Wyciągnij z niego kluczowe informacje i sformatuj je w strukturę JSON.
    
    Tekst audytu:
    """
    ${rawAuditText}
    """
    
    Wymagania:
    1. executiveSummary: Krótkie podsumowanie dla właściciela (max 3 zdania).
    2. strengths: Lista 3-5 mocnych stron wymienionych w audycie.
    3. weaknesses: Lista 3-5 błędów/braków do poprawy.
    4. marketingScore: Ocena ogólna (liczba 0-100) na podstawie tonu audytu.
    5. toneVoice: Określ ton obecnego cennika (np. "Chaotyczny", "Profesjonalny", "Surowy").
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
            executiveSummary: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            marketingScore: { type: Type.NUMBER },
            toneVoice: { type: Type.STRING }
          },
          required: ["executiveSummary", "strengths", "weaknesses", "marketingScore"]
        }
      }
    });
    
    return JSON.parse(response.text!) as StructuredAudit;
  } catch (e) {
    console.error("Failed to structure audit report", e);
    // Fallback
    return {
      executiveSummary: rawAuditText.substring(0, 200) + "...",
      strengths: ["Brak danych"],
      weaknesses: ["Brak danych"],
      marketingScore: 50,
      toneVoice: "Nieznany"
    };
  }
};

/**
 * Sends the URL to n8n workflow for processing and audit.
 */
const optimizeBooksyContent = async (url: string, onProgress?: (msg: string) => void): Promise<AuditResult> => {
  // 1. Check Cache
  const cacheKey = AUDIT_CACHE_PREFIX + simpleHash(url.trim());
  const cachedAudit = localStorage.getItem(cacheKey);

  if (cachedAudit) {
    console.log("Returning cached AUDIT result");
    if (onProgress) onProgress("Wczytano wynik z pamięci podręcznej.");
    try {
      const parsed = JSON.parse(cachedAudit);
      if (parsed && parsed.overallScore !== undefined) {
        return parsed as AuditResult;
      }
    } catch (e) {
      console.warn("Audit cache parse error, proceeding to fetch");
      localStorage.removeItem(cacheKey);
    }
  }

  // 2. Call n8n Webhook
  if (onProgress) onProgress("Wysyłanie zlecenia do n8n...");
  console.log("Calling n8n webhook:", N8N_WEBHOOK_URL);

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url: url })
    });

    if (!response.ok) {
      throw new Error(`Błąd połączenia z n8n: ${response.status} ${response.statusText}`);
    }

    if (onProgress) onProgress("Odbieranie wyników audytu...");
    
    // We get the text first to handle JSON parsing manually for better error reporting
    const responseText = await response.text();
    let result: any;
    
    try {
       result = JSON.parse(responseText);
    } catch (e: any) {
       console.error("n8n JSON Parse Error. Raw response:", responseText);
       // Throw specific error for UI
       throw new Error(`Błąd parsowania odpowiedzi n8n (JSON): ${e.message}. Sprawdź logi konsoli.`);
    }

    if (result.success === false) {
       throw new Error("Workflow n8n zwrócił informację o błędzie (success: false).");
    }

    // Handle pricing content (could be string or object)
    let pricingText = "";
    if (typeof result.pricing === 'string') {
      pricingText = result.pricing;
    } else if (result.pricing) {
      // If it's an object, we format it roughly as text/json for the input box
      pricingText = JSON.stringify(result.pricing, null, 2);
    }

    // Handle audit content
    let auditText = "";
    if (typeof result.audit === 'string') {
      auditText = result.audit;
    } else if (result.audit) {
      auditText = JSON.stringify(result.audit, null, 2);
    }

    // Basic Validation
    if (!pricingText && !auditText) {
      throw new Error("Otrzymano pustą odpowiedź z n8n (brak pól pricing/audit).");
    }

    // --- NEW STEP: Structure the audit report with Gemini ---
    if (onProgress) onProgress("AI formatuje raport...");
    const structuredReport = await structureAuditReport(auditText);

    // Create a synthesized AuditResult compatible with the UI
    const lines = pricingText.split('\n').filter(l => l.trim().length > 0);
    
    const finalResult: AuditResult = {
      overallScore: structuredReport.marketingScore,
      categories: [
        {
          name: "Analiza UX i Sprzedażowa",
          score: structuredReport.marketingScore,
          status: structuredReport.marketingScore > 75 ? 'ok' : 'warning',
          message: "Analiza AI zakończona.",
          suggestion: "Szczegółowe wnioski znajdują się w raporcie."
        }
      ],
      stats: {
        serviceCount: lines.length || 0,
        missingDescriptions: 0, 
        missingDurations: 0
      },
      rawCsv: "", 
      optimizedText: pricingText,
      generalFeedback: auditText, // Keep raw for backup
      recommendations: structuredReport.weaknesses, // Map weaknesses to recommendations for PDF
      structuredReport: structuredReport // Attach the structured data
    };

    // 3. Save to Cache
    try {
      localStorage.setItem(cacheKey, JSON.stringify(finalResult));
    } catch (e) {
      console.warn("Could not save audit to cache", e);
    }

    return finalResult;

  } catch (error: any) {
    console.error("n8n Audit Error:", error);
    // Explicitly rethrow the message so UI sees it
    throw new Error(error.message || "Wystąpił błąd podczas komunikacji z workflow n8n.");
  }
};

export { parsePricingData, optimizeBooksyContent };
