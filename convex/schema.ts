import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Użytkownicy (synchronizowane z Clerk)
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),

    // Stripe
    stripeCustomerId: v.optional(v.string()),

    // Kredyty
    credits: v.number(), // zakupione kredyty (1 kredyt = 1 audyt lub 1 optymalizacja)

    // Dane firmy (do faktur)
    companyName: v.optional(v.string()),
    companyNip: v.optional(v.string()),
    companyAddress: v.optional(v.string()),
    companyCity: v.optional(v.string()),
    companyPostalCode: v.optional(v.string()),

    // Dane salonu (z Booksy)
    salonName: v.optional(v.string()),
    salonLogoUrl: v.optional(v.string()),
    salonAddress: v.optional(v.string()),
    salonCity: v.optional(v.string()),
    salonPhone: v.optional(v.string()),
    booksyProfileUrl: v.optional(v.string()),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_stripe", ["stripeCustomerId"]),

  // Zakupy / Transakcje
  purchases: defineTable({
    userId: v.id("users"),
    stripePaymentIntentId: v.string(),
    stripeSessionId: v.optional(v.string()),

    product: v.union(
      v.literal("audit"),
      v.literal("audit_consultation"),
      v.literal("pricelist_optimization")
    ),

    amount: v.number(), // w groszach (PLN)
    currency: v.string(), // "pln"
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded")
    ),

    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_stripe_session", ["stripeSessionId"])
    .index("by_status", ["status"]),

  // Audyty (historia)
  audits: defineTable({
    userId: v.id("users"),
    purchaseId: v.optional(v.id("purchases")),

    // Status audytu
    status: v.union(
      v.literal("pending"),      // Oczekuje na podanie URL (zapłacono, ale nie rozpoczęto)
      v.literal("processing"),   // W trakcie realizacji
      v.literal("completed"),    // Zakończony
      v.literal("failed")        // Błąd
    ),

    sourceUrl: v.optional(v.string()),
    sourceType: v.union(v.literal("booksy"), v.literal("manual")),

    // Wyniki audytu (wypełniane po zakończeniu)
    overallScore: v.optional(v.number()),
    rawData: v.optional(v.string()),
    reportJson: v.optional(v.string()), // pełny raport jako JSON string
    reportPdfUrl: v.optional(v.string()), // URL do PDF

    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"]),

  // Optymalizacje
  optimizations: defineTable({
    userId: v.id("users"),
    purchaseId: v.optional(v.id("purchases")),
    auditId: v.optional(v.id("audits")),

    originalData: v.string(),
    optimizedData: v.string(),

    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // Kopie robocze cenników (dla wszystkich użytkowników, także niezalogowanych)
  pricelistDrafts: defineTable({
    // Unikalny identyfikator draftu (UUID) - używany w URL
    draftId: v.string(),

    // Opcjonalne powiązanie z użytkownikiem (jeśli zalogowany)
    userId: v.optional(v.id("users")),

    // Opcjonalne powiązanie z źródłowym cennikiem (jeśli edytujemy istniejący)
    sourcePricelistId: v.optional(v.id("pricelists")),

    // Dane cennika jako JSON string (PricingData)
    pricingDataJson: v.string(),

    // Ustawienia wyświetlania jako JSON string (ThemeConfig)
    themeConfigJson: v.optional(v.string()),

    // Wybrany szablon
    templateId: v.optional(v.string()),

    // Oryginalne dane wejściowe (do ponownego generowania)
    rawInputData: v.optional(v.string()),

    // Statystyki
    servicesCount: v.optional(v.number()),
    categoriesCount: v.optional(v.number()),

    // Czy draft został zoptymalizowany przez AI
    isOptimized: v.optional(v.boolean()),

    // Oryginalne dane przed optymalizacją (do porównania)
    originalPricingDataJson: v.optional(v.string()),

    // Wyniki optymalizacji AI (jako JSON string z OptimizationResult)
    optimizationResultJson: v.optional(v.string()),

    createdAt: v.number(),
    updatedAt: v.optional(v.number()),

    // TTL - drafty bez userId są usuwane po 7 dniach
    expiresAt: v.optional(v.number()),
  })
    .index("by_draft_id", ["draftId"])
    .index("by_user", ["userId"])
    .index("by_expires", ["expiresAt"]),

  // Cenniki (zapisane przez użytkowników)
  pricelists: defineTable({
    userId: v.id("users"),
    auditId: v.optional(v.id("audits")), // Jeśli cennik pochodzi z audytu

    // Metadane
    name: v.string(), // Nazwa cennika (np. "Cennik główny", "Cennik z audytu 12.12.2024")
    source: v.union(
      v.literal("manual"),      // Ręcznie wklejony przez generator
      v.literal("booksy"),      // Z audytu Booksy
      v.literal("audit")        // Z audytu (optymalizowany)
    ),

    // Dane cennika jako JSON string (PricingData)
    pricingDataJson: v.string(),

    // Ustawienia wyświetlania jako JSON string (ThemeConfig)
    themeConfigJson: v.optional(v.string()),

    // Wybrany szablon (modern, classic, minimal, professional, elegant)
    templateId: v.optional(v.string()),

    // Statystyki
    servicesCount: v.optional(v.number()),
    categoriesCount: v.optional(v.number()),

    // Czy cennik był już optymalizowany przez AI
    isOptimized: v.optional(v.boolean()),

    // Referencja do oryginalnego cennika (jeśli to zoptymalizowana wersja)
    optimizedFromPricelistId: v.optional(v.id("pricelists")),

    // Referencja do zoptymalizowanej wersji (jeśli to oryginalny cennik)
    optimizedVersionId: v.optional(v.id("pricelists")),

    // Oryginalne dane przed optymalizacją (do porównania)
    originalPricingDataJson: v.optional(v.string()),

    // Wyniki optymalizacji AI (jako JSON string z OptimizationResult)
    optimizationResultJson: v.optional(v.string()),

    // Data optymalizacji
    optimizedAt: v.optional(v.number()),

    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_source", ["userId", "source"])
    .index("by_audit", ["auditId"])
    .index("by_optimized_from", ["optimizedFromPricelistId"]),
});
