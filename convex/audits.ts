import { v } from "convex/values";
import { query, mutation, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

// Typ statusu audytu - rozbudowane statusy
const auditStatusValidator = v.union(
  v.literal("pending"),         // Oczekuje na podanie URL
  v.literal("processing"),      // LEGACY: dla backwards compatibility (= scraping)
  v.literal("scraping"),        // Pobieranie danych z Booksy (Firecrawl)
  v.literal("scraping_retry"),  // Retry scrapingu po błędzie
  v.literal("analyzing"),       // AI analizuje dane
  v.literal("completed"),       // Zakończony
  v.literal("failed")           // Błąd
);

// Typ wyniku audytu - rozbudowany o nowe pola
const auditValidator = v.object({
  _id: v.id("audits"),
  _creationTime: v.number(),
  userId: v.id("users"),
  purchaseId: v.optional(v.id("purchases")),
  status: auditStatusValidator,
  sourceUrl: v.optional(v.string()),
  sourceType: v.union(v.literal("booksy"), v.literal("manual")),
  // Progress tracking
  progress: v.optional(v.number()),
  progressMessage: v.optional(v.string()),
  // Error handling
  errorMessage: v.optional(v.string()),
  retryCount: v.optional(v.number()),
  lastRetryAt: v.optional(v.number()),
  // Scraped data
  scrapedDataJson: v.optional(v.string()),
  scrapedCategoriesCount: v.optional(v.number()),
  scrapedServicesCount: v.optional(v.number()),
  salonName: v.optional(v.string()),
  salonAddress: v.optional(v.string()),
  salonLogoUrl: v.optional(v.string()),
  // Wyniki audytu
  overallScore: v.optional(v.number()),
  rawData: v.optional(v.string()),
  reportJson: v.optional(v.string()),
  reportPdfUrl: v.optional(v.string()),
  // Linked pricelists
  basePricelistId: v.optional(v.id("pricelists")),
  proPricelistId: v.optional(v.id("pricelists")),
  // Multi-step analysis (Audyt Booksy v2)
  keywordReportId: v.optional(v.id("keywordReports")),
  categoryProposalId: v.optional(v.id("categoryProposals")),
  optimizationOptionsId: v.optional(v.id("optimizationOptions")),
  // Timestamps
  createdAt: v.number(),
  startedAt: v.optional(v.number()),
  scrapingCompletedAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),
});

// Pobierz audyty użytkownika
export const getUserAudits = query({
  args: {},
  returns: v.array(auditValidator),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return [];
    }

    const audits = await ctx.db
      .query("audits")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return audits;
  },
});

// Pobierz aktywny audyt użytkownika (pending, scraping, scraping_retry lub analyzing)
export const getActiveAudit = query({
  args: {},
  returns: v.union(auditValidator, v.null()),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return null;
    }

    // Szukaj audytu w aktywnym statusie
    const audits = await ctx.db
      .query("audits")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    // Include "processing" for backwards compatibility
    const activeStatuses = ["pending", "processing", "scraping", "scraping_retry", "analyzing"];
    const activeAudit = audits.find((a) => activeStatuses.includes(a.status));

    return activeAudit ?? null;
  },
});

// Pobierz pojedynczy audyt
export const getAudit = query({
  args: { auditId: v.id("audits") },
  returns: v.union(auditValidator, v.null()),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const audit = await ctx.db.get(args.auditId);
    if (!audit) {
      return null;
    }

    // Sprawdź czy audyt należy do użytkownika
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || audit.userId !== user._id) {
      return null;
    }

    return audit;
  },
});

// Sprawdź czy użytkownik ma aktywny audyt (internal - dla fallback w verifySession)
export const hasActiveAuditForUser = internalQuery({
  args: {
    userId: v.id("users"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const audits = await ctx.db
      .query("audits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const activeStatuses = ["pending", "processing", "scraping", "scraping_retry", "analyzing"];
    return audits.some((a) => activeStatuses.includes(a.status));
  },
});

// Utwórz nowy audyt po płatności (status: pending)
export const createPendingAudit = internalMutation({
  args: {
    userId: v.id("users"),
    purchaseId: v.optional(v.id("purchases")),
  },
  returns: v.id("audits"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("audits", {
      userId: args.userId,
      purchaseId: args.purchaseId,
      status: "pending",
      sourceType: "booksy",
      createdAt: Date.now(),
    });
  },
});

// Rozpocznij audyt (podaj URL i uruchom scraping)
export const startAudit = mutation({
  args: {
    auditId: v.id("audits"),
    sourceUrl: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Musisz być zalogowany");
    }

    const audit = await ctx.db.get(args.auditId);
    if (!audit) {
      throw new Error("Audyt nie znaleziony");
    }

    // Sprawdź czy audyt należy do użytkownika
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || audit.userId !== user._id) {
      throw new Error("Brak dostępu do tego audytu");
    }

    if (audit.status !== "pending") {
      throw new Error("Audyt już został rozpoczęty");
    }

    // Ustaw status na scraping i zapisz URL
    await ctx.db.patch(args.auditId, {
      sourceUrl: args.sourceUrl,
      status: "scraping",
      startedAt: Date.now(),
      progress: 0,
      progressMessage: "Rozpoczynanie audytu...",
      retryCount: 0,
    });

    // Uruchom scraping asynchronicznie
    await ctx.scheduler.runAfter(0, internal.auditActions.scrapeBooksyProfile, {
      auditId: args.auditId,
    });

    return true;
  },
});

// Rozpocznij audyt dla użytkownika z kredytami (bez istniejącego audytu)
export const startNewAudit = mutation({
  args: {
    sourceUrl: v.string(),
  },
  returns: v.union(v.id("audits"), v.null()),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Musisz być zalogowany");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      throw new Error("Użytkownik nie znaleziony");
    }

    // Sprawdź kredyty
    if (user.credits <= 0) {
      throw new Error("Brak kredytów. Kup pakiet aby wykonać audyt.");
    }

    // Sprawdź czy nie ma już aktywnego audytu
    const activeStatuses = ["pending", "scraping", "scraping_retry", "analyzing"];
    const existingAudits = await ctx.db
      .query("audits")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const hasActiveAudit = existingAudits.some((a) => activeStatuses.includes(a.status));
    if (hasActiveAudit) {
      throw new Error("Masz już aktywny audyt w trakcie");
    }

    // Sprawdź czy nie ma audytu dla tego samego URL utworzonego w ciągu ostatnich 5 minut
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const recentSameUrlAudit = existingAudits.find(
      (a) => a.sourceUrl === args.sourceUrl && a.createdAt > fiveMinutesAgo
    );
    if (recentSameUrlAudit) {
      throw new Error("Audyt dla tego profilu został już rozpoczęty. Poczekaj chwilę.");
    }

    // Zużyj kredyt
    await ctx.db.patch(user._id, {
      credits: user.credits - 1,
    });

    // Utwórz audyt w statusie scraping
    const auditId = await ctx.db.insert("audits", {
      userId: user._id,
      status: "scraping",
      sourceUrl: args.sourceUrl,
      sourceType: "booksy",
      createdAt: Date.now(),
      startedAt: Date.now(),
      progress: 0,
      progressMessage: "Rozpoczynanie audytu...",
      retryCount: 0,
    });

    // Uruchom scraping asynchronicznie
    await ctx.scheduler.runAfter(0, internal.auditActions.scrapeBooksyProfile, {
      auditId,
    });

    return auditId;
  },
});

// Zakończ audyt (internal - wywoływane po przetworzeniu)
export const completeAudit = internalMutation({
  args: {
    auditId: v.id("audits"),
    overallScore: v.number(),
    rawData: v.string(),
    reportJson: v.string(),
    reportPdfUrl: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get audit to retrieve userId and base pricelist
    const audit = await ctx.db.get(args.auditId);
    if (!audit) {
      throw new Error("Audit not found");
    }

    // Parse audit report for optimization data (with safe fallback)
    let reportRecommendations: string[] = [];
    try {
      const report = JSON.parse(args.reportJson);
      reportRecommendations = Array.isArray(report?.recommendations) ? report.recommendations : [];
    } catch (parseError) {
      console.error("[completeAudit] Failed to parse reportJson:", parseError);
      // Continue with empty recommendations - the raw JSON will still be saved
    }

    // Get base pricelist data if available
    let proPricelistId: typeof audit.basePricelistId = undefined;

    if (audit.basePricelistId) {
      const basePricelist = await ctx.db.get(audit.basePricelistId);
      if (basePricelist) {
        // Create PRO pricelist based on base pricelist with optimization metadata
        // The PRO pricelist starts with the same data as base, ready for AI optimization

        // Create optimization result from audit report
        const optimizationResult = {
          qualityScore: args.overallScore,
          summary: {
            totalChanges: 0,
            duplicatesFound: 0,
            descriptionsAdded: 0,
            namesImproved: 0,
            categoriesOptimized: 0,
          },
          recommendations: reportRecommendations,
          changes: [],
        };

        proPricelistId = await ctx.db.insert("pricelists", {
          userId: audit.userId,
          auditId: args.auditId,
          name: audit.salonName ? `Cennik PRO - ${audit.salonName}` : "Cennik PRO (zoptymalizowany)",
          source: "audit",
          pricingDataJson: basePricelist.pricingDataJson, // Start with base data
          originalPricingDataJson: basePricelist.pricingDataJson, // Keep original for comparison
          servicesCount: basePricelist.servicesCount,
          categoriesCount: basePricelist.categoriesCount,
          isOptimized: true,
          optimizedFromPricelistId: audit.basePricelistId,
          optimizationResultJson: JSON.stringify(optimizationResult),
          optimizedAt: Date.now(),
          createdAt: Date.now(),
        });

        // Link base pricelist to its optimized version
        await ctx.db.patch(audit.basePricelistId, {
          optimizedVersionId: proPricelistId,
        });
      }
    }

    // Update audit with completion status and PRO pricelist link
    await ctx.db.patch(args.auditId, {
      status: "completed",
      overallScore: args.overallScore,
      rawData: args.rawData,
      reportJson: args.reportJson,
      reportPdfUrl: args.reportPdfUrl,
      completedAt: Date.now(),
      proPricelistId: proPricelistId,
    });
    return null;
  },
});

// Oznacz audyt jako failed (internal)
export const failAudit = internalMutation({
  args: {
    auditId: v.id("audits"),
    errorMessage: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.auditId, {
      status: "failed",
      errorMessage: args.errorMessage,
      completedAt: Date.now(),
    });
    return null;
  },
});

// --- HELPER FUNCTIONS DLA AUDIT ACTIONS ---

// Pobierz audyt bez autentykacji (dla internal actions)
export const getAuditInternal = internalQuery({
  args: { auditId: v.id("audits") },
  returns: v.union(auditValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.auditId);
  },
});

// Aktualizuj postęp audytu
export const updateProgress = internalMutation({
  args: {
    auditId: v.id("audits"),
    status: v.optional(auditStatusValidator),
    progress: v.optional(v.number()),
    progressMessage: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = {};
    if (args.status !== undefined) updates.status = args.status;
    if (args.progress !== undefined) updates.progress = args.progress;
    if (args.progressMessage !== undefined) updates.progressMessage = args.progressMessage;

    await ctx.db.patch(args.auditId, updates);
    return null;
  },
});

// Zapisz dane po scraping
export const saveScrapedData = internalMutation({
  args: {
    auditId: v.id("audits"),
    scrapedDataJson: v.string(),
    categoriesCount: v.number(),
    servicesCount: v.number(),
    salonName: v.optional(v.string()),
    salonAddress: v.optional(v.string()),
    salonLogoUrl: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get audit to retrieve userId
    const audit = await ctx.db.get(args.auditId);
    if (!audit) {
      throw new Error("Audit not found");
    }

    // Convert scraped data to PricingData format for base pricelist
    // IMPORTANT: Preserve variants from Booksy API - they are nested price options
    const scrapedData = JSON.parse(args.scrapedDataJson);
    const pricingData = {
      salonName: scrapedData.salonName,
      categories: scrapedData.categories.map((cat: {
        name: string;
        services: Array<{
          name: string;
          price: string;
          description?: string;
          duration?: string;
          variants?: Array<{ label: string; price: string; duration?: string }>;
        }>
      }) => ({
        categoryName: cat.name,
        services: cat.services.map((service) => ({
          name: service.name,
          price: service.price,
          description: service.description,
          duration: service.duration,
          isPromo: false,
          // PRESERVE VARIANTS - nested price options from Booksy
          variants: service.variants,
        })),
      })),
    };

    // Create base pricelist (original structure from Booksy)
    const basePricelistId = await ctx.db.insert("pricelists", {
      userId: audit.userId,
      auditId: args.auditId,
      name: args.salonName ? `Cennik bazowy - ${args.salonName}` : "Cennik bazowy z Booksy",
      source: "booksy",
      pricingDataJson: JSON.stringify(pricingData),
      servicesCount: args.servicesCount,
      categoriesCount: args.categoriesCount,
      isOptimized: false,
      createdAt: Date.now(),
    });

    // Update audit with scraped data and link to base pricelist
    await ctx.db.patch(args.auditId, {
      scrapedDataJson: args.scrapedDataJson,
      scrapedCategoriesCount: args.categoriesCount,
      scrapedServicesCount: args.servicesCount,
      salonName: args.salonName,
      salonAddress: args.salonAddress,
      salonLogoUrl: args.salonLogoUrl,
      scrapingCompletedAt: Date.now(),
      status: "analyzing",
      progress: 50,
      progressMessage: "Dane pobrane. AI analizuje cennik...",
      basePricelistId: basePricelistId,
    });
    return null;
  },
});

// Obsłuż błąd scrapingu z retry logic
export const handleScrapingError = internalMutation({
  args: {
    auditId: v.id("audits"),
    errorMessage: v.string(),
    shouldRetry: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const audit = await ctx.db.get(args.auditId);
    if (!audit) return null;

    const newRetryCount = (audit.retryCount || 0) + 1;

    if (args.shouldRetry && newRetryCount <= 3) {
      // Ustaw status na retry i zaplanuj ponowną próbę
      await ctx.db.patch(args.auditId, {
        status: "scraping_retry",
        retryCount: newRetryCount,
        lastRetryAt: Date.now(),
        progressMessage: `Próba ${newRetryCount}/3 - ponawiam pobieranie...`,
        errorMessage: args.errorMessage,
      });

      // Exponential backoff: 30s, 2min, 5min
      const delays = [30000, 120000, 300000];
      const delay = delays[newRetryCount - 1] || delays[2];

      await ctx.scheduler.runAfter(delay, internal.auditActions.scrapeBooksyProfile, {
        auditId: args.auditId,
      });
    } else {
      // Wszystkie próby wyczerpane - fail
      await ctx.db.patch(args.auditId, {
        status: "failed",
        errorMessage: args.errorMessage,
        retryCount: newRetryCount,
        completedAt: Date.now(),
      });
    }

    return null;
  },
});

// Sprawdź czy użytkownik ma oczekujący audyt (pending)
export const hasPendingAudit = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return false;
    }

    const pendingAudit = await ctx.db
      .query("audits")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    return pendingAudit !== null;
  },
});

// DEBUG: Lista wszystkich audytów (internal only)
export const listAllAudits = internalQuery({
  args: {},
  returns: v.array(auditValidator),
  handler: async (ctx) => {
    return await ctx.db
      .query("audits")
      .order("desc")
      .collect();
  },
});

// DEBUG: Ręczne wznowienie zablokowanego audytu
export const retryStuckAudit = internalMutation({
  args: { auditId: v.id("audits") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const audit = await ctx.db.get(args.auditId);
    if (!audit) return false;

    // Reset status to scraping and clear error state
    await ctx.db.patch(args.auditId, {
      status: "scraping",
      progress: 0,
      progressMessage: "Ponowne rozpoczynanie audytu...",
      errorMessage: undefined,
      retryCount: 0,
    });

    // Schedule the scraping action
    await ctx.scheduler.runAfter(0, internal.auditActions.scrapeBooksyProfile, {
      auditId: args.auditId,
    });

    return true;
  },
});

// DEBUG: Ponów tylko analizę AI (gdy scraping już zakończony)
export const retryAIAnalysis = internalMutation({
  args: { auditId: v.id("audits") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const audit = await ctx.db.get(args.auditId);
    if (!audit || !audit.scrapedDataJson) return false;

    // Reset status to analyzing
    await ctx.db.patch(args.auditId, {
      status: "analyzing",
      progress: 50,
      progressMessage: "Ponowna analiza AI...",
      errorMessage: undefined,
      completedAt: undefined,
    });

    // Schedule the AI analysis
    await ctx.scheduler.runAfter(0, internal.auditActions.analyzeWithAI, {
      auditId: args.auditId,
    });

    return true;
  },
});

// Sprawdź czy użytkownik ma audyt w trakcie (processing)
export const hasProcessingAudit = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return false;
    }

    const processingAudit = await ctx.db
      .query("audits")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("status"), "processing"))
      .first();

    return processingAudit !== null;
  },
});
