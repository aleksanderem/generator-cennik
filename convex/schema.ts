import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ============================================
  // AUDYT BOOKSY - Multi-step analysis tables
  // ============================================

  // Raport słów kluczowych (generowany automatycznie po scrapingu)
  keywordReports: defineTable({
    auditId: v.id("audits"),

    // Znalezione słowa kluczowe z ich analizą
    keywords: v.array(v.object({
      keyword: v.string(),
      count: v.number(),
      categories: v.array(v.string()),   // Kategorie gdzie występuje
      services: v.array(v.string()),     // Usługi gdzie występuje
    })),

    // Rozkład słów kluczowych per kategoria (do wykresów)
    categoryDistribution: v.array(v.object({
      categoryName: v.string(),
      keywordCount: v.number(),
      topKeywords: v.array(v.string()),
    })),

    // Sugestie AI dot. brakujących słów kluczowych SEO
    suggestions: v.array(v.string()),

    createdAt: v.number(),
  }).index("by_audit", ["auditId"]),

  // Propozycja układu kategorii (do akceptacji przez użytkownika)
  categoryProposals: defineTable({
    auditId: v.id("audits"),

    // Struktury jako JSON string (dla elastyczności)
    originalStructureJson: v.string(),   // Obecna struktura z Booksy
    proposedStructureJson: v.string(),   // Proponowana przez AI

    // Lista zmian z uzasadnieniami
    changes: v.array(v.object({
      type: v.union(
        v.literal("move_service"),       // Przeniesienie usługi między kategoriami
        v.literal("merge_categories"),   // Połączenie kategorii
        v.literal("split_category"),     // Podział kategorii
        v.literal("rename_category"),    // Zmiana nazwy kategorii
        v.literal("reorder_categories"), // Zmiana kolejności kategorii
        v.literal("create_category")     // Utworzenie nowej kategorii (np. Bestsellery)
      ),
      description: v.string(),
      fromCategory: v.optional(v.string()),
      toCategory: v.optional(v.string()),
      services: v.optional(v.array(v.string())),
      reason: v.string(),                // Uzasadnienie zmiany
    })),

    // Status propozycji
    status: v.union(
      v.literal("pending"),    // Oczekuje na decyzję użytkownika
      v.literal("accepted"),   // Zaakceptowana bez zmian
      v.literal("modified"),   // Zaakceptowana z modyfikacjami
      v.literal("rejected")    // Odrzucona (użytkownik zostaje przy oryginale)
    ),

    // Modyfikacje użytkownika (jeśli status = modified)
    userModificationsJson: v.optional(v.string()),

    acceptedAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_audit", ["auditId"]),

  // Opcje optymalizacji wybrane przez użytkownika
  optimizationOptions: defineTable({
    auditId: v.id("audits"),

    // Wybrane elementy do optymalizacji (toggle'y z UI)
    selectedOptions: v.array(v.union(
      v.literal("descriptions"),  // Opisy usług (język korzyści)
      v.literal("seo"),           // Słowa kluczowe SEO
      v.literal("categories"),    // Struktura kategorii (wymaga accepted proposal)
      v.literal("order"),         // Kolejność usług
      v.literal("prices"),        // Formatowanie cen
      v.literal("duplicates"),    // Wykrywanie duplikatów
      v.literal("duration"),      // Szacowanie czasu trwania
      v.literal("tags")           // Tagi (Bestseller/Nowość/Premium)
    )),

    // Czy użytkownik wybrał tryb "full auto" (wszystkie opcje)
    isFullAuto: v.boolean(),

    createdAt: v.number(),
  }).index("by_audit", ["auditId"]),

  // ============================================
  // EXISTING TABLES
  // ============================================

  // Background optimization jobs
  optimizationJobs: defineTable({
    userId: v.id("users"),
    pricelistId: v.id("pricelists"),
    auditId: v.optional(v.id("audits")),

    // Job status
    status: v.union(
      v.literal("pending"),      // Job created, waiting to start
      v.literal("processing"),   // AI is working on optimization
      v.literal("completed"),    // Successfully completed
      v.literal("failed")        // Failed with error
    ),

    // Progress tracking
    progress: v.optional(v.number()),        // 0-100
    progressMessage: v.optional(v.string()), // "Optymalizuję nazwy usług..."
    currentStep: v.optional(v.number()),     // Current step index
    totalSteps: v.optional(v.number()),      // Total steps count

    // Error handling
    errorMessage: v.optional(v.string()),
    retryCount: v.optional(v.number()),

    // Input data (stored to allow retry)
    inputPricingDataJson: v.string(),
    auditRecommendationsJson: v.optional(v.string()), // Recommendations from audit to apply

    // Output data (filled on completion)
    outputPricingDataJson: v.optional(v.string()),
    optimizationResultJson: v.optional(v.string()),

    // Timestamps
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_pricelist", ["pricelistId"])
    .index("by_status", ["status"])
    .index("by_user_status", ["userId", "status"]),

  // In-app notifications
  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("optimization_started"),
      v.literal("optimization_completed"),
      v.literal("optimization_failed"),
      v.literal("audit_completed"),
      v.literal("system")
    ),
    title: v.string(),
    message: v.string(),
    link: v.optional(v.string()),     // URL to navigate to on click
    relatedId: v.optional(v.string()), // Related entity ID (job, audit, etc)
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_read", ["userId", "read"])
    .index("by_user_created", ["userId", "createdAt"]),

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

    // Status audytu - rozbudowane statusy dla lepszego trackingu
    status: v.union(
      v.literal("pending"),         // Oczekuje na podanie URL (zapłacono, ale nie rozpoczęto)
      v.literal("processing"),      // LEGACY: dla backwards compatibility (= scraping)
      v.literal("scraping"),        // Pobieranie danych z Booksy (Firecrawl)
      v.literal("scraping_retry"),  // Retry scrapingu po błędzie
      v.literal("analyzing"),       // AI analizuje dane
      v.literal("completed"),       // Zakończony
      v.literal("failed")           // Błąd (z errorMessage)
    ),

    sourceUrl: v.optional(v.string()),
    sourceType: v.union(v.literal("booksy"), v.literal("manual")),

    // Progress tracking (dla UI)
    progress: v.optional(v.number()),           // 0-100
    progressMessage: v.optional(v.string()),    // "Pobieranie kategorii..."

    // Error handling
    errorMessage: v.optional(v.string()),
    retryCount: v.optional(v.number()),         // Ile razy próbowano retry
    lastRetryAt: v.optional(v.number()),

    // Scraped data (surowe dane z Booksy - przed analizą)
    scrapedDataJson: v.optional(v.string()),    // JSON z kategoriami i usługami
    scrapedCategoriesCount: v.optional(v.number()),
    scrapedServicesCount: v.optional(v.number()),
    salonName: v.optional(v.string()),          // Nazwa salonu z Booksy
    salonAddress: v.optional(v.string()),       // Adres salonu
    salonLogoUrl: v.optional(v.string()),       // URL do logo/zdjęcia salonu z Booksy

    // Wyniki audytu (wypełniane po zakończeniu analizy AI)
    overallScore: v.optional(v.number()),
    rawData: v.optional(v.string()),            // Legacy - dla kompatybilności
    reportJson: v.optional(v.string()),         // Pełny raport jako JSON string
    reportPdfUrl: v.optional(v.string()),       // URL do PDF

    // Powiązane cenniki (generowane automatycznie)
    basePricelistId: v.optional(v.id("pricelists")),  // Cennik bazowy (struktura z Booksy)
    proPricelistId: v.optional(v.id("pricelists")),   // Cennik PRO (zoptymalizowany przez AI)

    // Powiązania z nowymi tabelami multi-step analysis (Audyt Booksy v2)
    keywordReportId: v.optional(v.id("keywordReports")),
    categoryProposalId: v.optional(v.id("categoryProposals")),
    optimizationOptionsId: v.optional(v.id("optimizationOptions")),

    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    scrapingCompletedAt: v.optional(v.number()), // Kiedy zakończono scraping
    completedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_status", ["status"]),

  // Optymalizacje
  optimizations: defineTable({
    userId: v.id("users"),
    purchaseId: v.optional(v.id("purchases")),
    auditId: v.optional(v.id("audits")),

    originalData: v.string(),
    optimizedData: v.string(),

    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // Cenniki (zapisane przez użytkowników)
  pricelists: defineTable({
    userId: v.id("users"),
    auditId: v.optional(v.id("audits")), // Jeśli cennik pochodzi z audytu
    purchaseId: v.optional(v.id("purchases")), // Powiązanie z zakupem (dla zoptymalizowanych cenników)

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

    // Konfiguracja kategorii (jako JSON string z PricelistCategoryConfig)
    // Zawiera kolejność kategorii, agregacje (Promocje/Bestsellery) i przypisania usług
    categoryConfigJson: v.optional(v.string()),

    // Data optymalizacji
    optimizedAt: v.optional(v.number()),

    // Background optimization job reference
    optimizationJobId: v.optional(v.id("optimizationJobs")),
    optimizationStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    )),

    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_source", ["userId", "source"])
    .index("by_optimization_job", ["optimizationJobId"])
    .index("by_audit", ["auditId"])
    .index("by_optimized_from", ["optimizedFromPricelistId"]),
});
