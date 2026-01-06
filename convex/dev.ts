import { v } from "convex/values";
import { mutation, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

// Debug: Delete pricelist by ID
export const debugDeletePricelist = internalMutation({
  args: { pricelistId: v.id("pricelists") },
  returns: v.object({ success: v.boolean(), message: v.string() }),
  handler: async (ctx, args) => {
    const pricelist = await ctx.db.get(args.pricelistId);
    if (!pricelist) {
      return { success: false, message: "Pricelist not found" };
    }
    await ctx.db.delete(args.pricelistId);
    return { success: true, message: `Deleted pricelist: ${pricelist.name}` };
  },
});

// Debug: Delete duplicate audit and refund credit
export const debugDeleteDuplicateAudit = internalMutation({
  args: {
    auditId: v.id("audits"),
    refundCredit: v.boolean(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const audit = await ctx.db.get(args.auditId);
    if (!audit) {
      return { success: false, message: "Audit not found" };
    }

    // Get user
    const user = await ctx.db.get(audit.userId);
    if (!user) {
      return { success: false, message: "User not found" };
    }

    // Delete the audit
    await ctx.db.delete(args.auditId);

    // Refund credit if requested
    if (args.refundCredit) {
      await ctx.db.patch(user._id, {
        credits: user.credits + 1,
      });
      return {
        success: true,
        message: `Deleted audit and refunded 1 credit to ${user.email}. New balance: ${user.credits + 1}`
      };
    }

    return {
      success: true,
      message: `Deleted audit for ${user.email}. No credit refunded.`
    };
  },
});

// Debug: Mark stuck audit as failed (internal only - for fixing stuck audits)
export const debugFixStuckAudit = internalMutation({
  args: { auditId: v.id("audits") },
  returns: v.object({
    success: v.boolean(),
    previousStatus: v.string(),
    newStatus: v.string(),
  }),
  handler: async (ctx, args) => {
    const audit = await ctx.db.get(args.auditId);
    if (!audit) {
      throw new Error("Audit not found");
    }

    const previousStatus = audit.status;

    // Only fix audits that are stuck in processing states
    const stuckStatuses = ["processing", "scraping", "scraping_retry", "analyzing"];
    if (!stuckStatuses.includes(previousStatus)) {
      return { success: false, previousStatus, newStatus: previousStatus };
    }

    await ctx.db.patch(args.auditId, {
      status: "failed",
      completedAt: Date.now(),
      errorMessage: "Audyt utknął w trakcie przetwarzania i został automatycznie oznaczony jako nieudany. Możesz spróbować ponownie.",
    });

    return { success: true, previousStatus, newStatus: "failed" };
  },
});

// Debug: Query audits for a specific user by email (no auth required, internal only)
export const debugGetUserAudits = internalQuery({
  args: { email: v.string() },
  returns: v.object({
    user: v.union(v.object({
      _id: v.id("users"),
      email: v.string(),
      name: v.optional(v.string()),
      credits: v.number(),
    }), v.null()),
    audits: v.array(v.object({
      _id: v.id("audits"),
      status: v.string(),
      sourceUrl: v.optional(v.string()),
      salonName: v.optional(v.string()),
      createdAt: v.number(),
      startedAt: v.optional(v.number()),
      completedAt: v.optional(v.number()),
      proPricelistId: v.optional(v.id("pricelists")),
      basePricelistId: v.optional(v.id("pricelists")),
    })),
    pricelists: v.array(v.object({
      _id: v.id("pricelists"),
      name: v.optional(v.string()),
      createdAt: v.number(),
      auditId: v.optional(v.id("audits")),
    })),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (!user) {
      return { user: null, audits: [], pricelists: [] };
    }

    const audits = await ctx.db
      .query("audits")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    const pricelists = await ctx.db
      .query("pricelists")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return {
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        credits: user.credits,
      },
      audits: audits.map((a) => ({
        _id: a._id,
        status: a.status,
        sourceUrl: a.sourceUrl,
        salonName: a.salonName,
        createdAt: a.createdAt,
        startedAt: a.startedAt,
        completedAt: a.completedAt,
        proPricelistId: a.proPricelistId,
        basePricelistId: a.basePricelistId,
      })),
      pricelists: pricelists.map((p) => ({
        _id: p._id,
        name: p.name,
        createdAt: p.createdAt,
        auditId: p.auditId,
      })),
    };
  },
});

// Status audytu - rozbudowane statusy
const auditStatusValidator = v.union(
  v.literal("pending"),
  v.literal("processing"),      // LEGACY
  v.literal("scraping"),
  v.literal("scraping_retry"),
  v.literal("analyzing"),
  v.literal("completed"),
  v.literal("failed")
);

// Dodaj kredyty (dev only)
export const addCredits = mutation({
  args: { amount: v.number() },
  returns: v.null(),
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

    await ctx.db.patch(user._id, {
      credits: user.credits + args.amount,
    });

    return null;
  },
});

// DEV: Add credits by userId (internal only, for testing)
export const addCreditsByUserId = internalMutation({
  args: { userId: v.id("users"), amount: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    await ctx.db.patch(args.userId, {
      credits: user.credits + args.amount,
    });
    console.log(`Added ${args.amount} credits to user ${user.email}. New balance: ${user.credits + args.amount}`);
    return null;
  },
});

// Usuń kredyty (dev only)
export const removeCredits = mutation({
  args: { amount: v.number() },
  returns: v.null(),
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

    await ctx.db.patch(user._id, {
      credits: Math.max(0, user.credits - args.amount),
    });

    return null;
  },
});

// Stwórz testowy audyt (dev only)
export const createTestAudit = mutation({
  args: { status: auditStatusValidator },
  returns: v.id("audits"),
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

    const now = Date.now();

    return await ctx.db.insert("audits", {
      userId: user._id,
      status: args.status,
      sourceType: "booksy",
      sourceUrl: args.status !== "pending" ? "https://booksy.com/pl-pl/test-salon" : undefined,
      createdAt: now,
      startedAt: args.status !== "pending" ? now : undefined,
      completedAt: args.status === "completed" || args.status === "failed" ? now : undefined,
      overallScore: args.status === "completed" ? 78 : undefined,
    });
  },
});

// Zmień status audytu (dev only)
export const updateAuditStatus = mutation({
  args: {
    auditId: v.id("audits"),
    status: auditStatusValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Musisz być zalogowany");
    }

    const audit = await ctx.db.get(args.auditId);
    if (!audit) {
      throw new Error("Audyt nie znaleziony");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || audit.userId !== user._id) {
      throw new Error("Brak dostępu do tego audytu");
    }

    const now = Date.now();
    const updates: Record<string, unknown> = { status: args.status };

    // Active statuses that start the audit
    const activeStatuses = ["scraping", "scraping_retry", "analyzing"];
    if (activeStatuses.includes(args.status) && !audit.startedAt) {
      updates.startedAt = now;
      updates.sourceUrl = audit.sourceUrl || "https://booksy.com/pl-pl/test-salon";
    }

    if ((args.status === "completed" || args.status === "failed") && !audit.completedAt) {
      updates.completedAt = now;
    }

    if (args.status === "completed" && !audit.overallScore) {
      updates.overallScore = 78;
    }

    await ctx.db.patch(args.auditId, updates);

    return null;
  },
});

// Usuń audyt (dev only)
export const deleteAudit = mutation({
  args: { auditId: v.id("audits") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Musisz być zalogowany");
    }

    const audit = await ctx.db.get(args.auditId);
    if (!audit) {
      throw new Error("Audyt nie znaleziony");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || audit.userId !== user._id) {
      throw new Error("Brak dostępu do tego audytu");
    }

    await ctx.db.delete(args.auditId);

    return null;
  },
});

// Stwórz testową płatność (dev only)
export const createTestPurchase = mutation({
  args: {
    product: v.union(v.literal("audit"), v.literal("audit_consultation")),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded")
    ),
  },
  returns: v.id("purchases"),
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

    const now = Date.now();
    const amounts = {
      audit: 7990, // 79,90 zł
      audit_consultation: 24000, // 240 zł
    };

    return await ctx.db.insert("purchases", {
      userId: user._id,
      stripePaymentIntentId: `pi_test_${now}`,
      stripeSessionId: `cs_test_${now}`,
      product: args.product,
      amount: amounts[args.product],
      currency: "pln",
      status: args.status,
      createdAt: now,
      completedAt: args.status === "completed" ? now : undefined,
    });
  },
});

// Usuń płatność (dev only)
export const deletePurchase = mutation({
  args: { purchaseId: v.id("purchases") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Musisz być zalogowany");
    }

    const purchase = await ctx.db.get(args.purchaseId);
    if (!purchase) {
      throw new Error("Płatność nie znaleziona");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || purchase.userId !== user._id) {
      throw new Error("Brak dostępu do tej płatności");
    }

    await ctx.db.delete(args.purchaseId);

    return null;
  },
});

// Symuluj zakończenie płatności - utwórz audyt pending (dev only, gdy webhook nie zadziałał)
export const simulatePaymentComplete = mutation({
  args: {
    purchaseId: v.optional(v.id("purchases")),
  },
  returns: v.null(),
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

    // Jeśli podano purchaseId, oznacz jako completed
    if (args.purchaseId) {
      const purchase = await ctx.db.get(args.purchaseId);
      if (purchase && purchase.userId === user._id) {
        await ctx.db.patch(args.purchaseId, {
          status: "completed",
          completedAt: Date.now(),
        });
      }
    }

    // Sprawdź czy user ma już pending audit
    const existingPendingAudit = await ctx.db
      .query("audits")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", user._id).eq("status", "pending")
      )
      .first();

    if (existingPendingAudit) {
      console.log("User already has pending audit");
      return null;
    }

    // Utwórz pending audit
    await ctx.db.insert("audits", {
      userId: user._id,
      purchaseId: args.purchaseId,
      status: "pending",
      sourceType: "booksy",
      createdAt: Date.now(),
    });

    console.log("Created pending audit for user (manual simulation)");
    return null;
  },
});

// Zmień status płatności (dev only)
export const updatePurchaseStatus = mutation({
  args: {
    purchaseId: v.id("purchases"),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded")
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Musisz być zalogowany");
    }

    const purchase = await ctx.db.get(args.purchaseId);
    if (!purchase) {
      throw new Error("Płatność nie znaleziona");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || purchase.userId !== user._id) {
      throw new Error("Brak dostępu do tej płatności");
    }

    const updates: Record<string, unknown> = { status: args.status };
    if (args.status === "completed" && !purchase.completedAt) {
      updates.completedAt = Date.now();
    }

    await ctx.db.patch(args.purchaseId, updates);

    return null;
  },
});

// Dodaj dane analizy AI do audytu (dev only)
export const addAnalysisData = mutation({
  args: { auditId: v.id("audits") },
  returns: v.object({
    keywordReportId: v.id("keywordReports"),
    categoryProposalId: v.id("categoryProposals"),
  }),
  handler: async (ctx, args) => {
    const audit = await ctx.db.get(args.auditId);
    if (!audit) {
      throw new Error("Audyt nie znaleziony");
    }

    // Jeśli dane już istnieją, zwróć je
    if (audit.keywordReportId && audit.categoryProposalId) {
      return {
        keywordReportId: audit.keywordReportId,
        categoryProposalId: audit.categoryProposalId,
      };
    }

    const now = Date.now();

    // Utwórz keyword report z przykładowymi danymi dla salonu beauty
    const keywordReportId = await ctx.db.insert("keywordReports", {
      auditId: args.auditId,
      keywords: [
        { keyword: "depilacja laserowa", count: 45, categories: ["Depilacja Laserowa Thunder"], services: ["Bikini brazylijskie", "Całe ciało", "Nogi"] },
        { keyword: "thunder", count: 38, categories: ["Depilacja Laserowa Thunder"], services: ["Thunder - Bikini", "Thunder - Całe nogi", "Thunder - Pachy"] },
        { keyword: "kobieta", count: 32, categories: ["Depilacja Laserowa Thunder"], services: ["Bikini - Kobieta", "Całe nogi - Kobieta"] },
        { keyword: "mężczyzna", count: 18, categories: ["Depilacja Laserowa Thunder"], services: ["Bikini - Mężczyzna", "Klatka piersiowa"] },
        { keyword: "bikini", count: 24, categories: ["Depilacja Laserowa Thunder"], services: ["Bikini brazylijskie", "Bikini pełne", "Bikini podstawowe"] },
        { keyword: "zabieg", count: 56, categories: ["Depilacja Laserowa Thunder", "Promocje"], services: ["4 zabiegi", "6 zabiegów"] },
        { keyword: "promocja", count: 8, categories: ["Promocje Grudzień"], services: ["-30% na pierwszy zabieg", "-50% na drugi zabieg"] },
        { keyword: "laser", count: 42, categories: ["Depilacja Laserowa Thunder"], services: ["Laser Thunder", "Depilacja laserowa"] },
      ],
      categoryDistribution: [
        { categoryName: "Depilacja Laserowa Thunder - Kobieta", keywordCount: 45, topKeywords: ["depilacja", "thunder", "kobieta", "bikini"] },
        { categoryName: "Depilacja Laserowa Thunder - Mężczyzna", keywordCount: 28, topKeywords: ["depilacja", "thunder", "mężczyzna", "klatka"] },
        { categoryName: "Promocje Grudzień", keywordCount: 12, topKeywords: ["promocja", "gratis", "rabat", "-50%"] },
      ],
      suggestions: [
        "Dodaj słowo 'bezbolesna' do opisów - to jeden z najczęściej wyszukiwanych terminów dla depilacji laserowej",
        "Rozważ dodanie słów 'skuteczna' i 'trwałe usunięcie owłosienia' w opisach usług",
        "Brakuje słów kluczowych związanych z technologią - dodaj 'aleksandryt' i 'Nd:YAG'",
        "Dodaj informacje o typach skóry - 'wszystkie fototypy' to ważne słowo kluczowe",
        "Rozważ dodanie 'certyfikowany' lub 'profesjonalny' dla budowania zaufania",
      ],
      createdAt: now,
    });

    // Pobierz rawData z audytu do stworzenia struktury
    const originalStructure = {
      categories: [
        { name: "✦ PROMOCJE GRUDZIEŃ✦", services: ["promo1", "promo2", "promo3", "promo4", "promo5", "promo6"] },
        { name: "🔲 DEPILACJA LASEROWA THUNDER KOBIETA", services: Array(70).fill("service") },
        { name: "🔲 DEPILACJA LASEROWA THUNDER MĘŻCZYZNA", services: Array(45).fill("service") },
      ],
    };

    const proposedStructure = {
      categories: [
        { name: "⭐ BESTSELLERY", services: ["Całe ciało - Kobieta", "Bikini brazylijskie - Kobieta", "Nogi całe - Kobieta"] },
        { name: "🎁 PROMOCJE ŚWIĄTECZNE", services: ["promo1", "promo2", "promo3", "promo4", "promo5", "promo6"] },
        { name: "👩 DEPILACJA LASEROWA - KOBIETA", services: Array(70).fill("service") },
        { name: "👨 DEPILACJA LASEROWA - MĘŻCZYZNA", services: Array(45).fill("service") },
        { name: "📦 PAKIETY ZABIEGÓW", services: ["Pakiet 4 zabiegi", "Pakiet 6 zabiegów"] },
      ],
    };

    // Utwórz category proposal
    const categoryProposalId = await ctx.db.insert("categoryProposals", {
      auditId: args.auditId,
      originalStructureJson: JSON.stringify(originalStructure),
      proposedStructureJson: JSON.stringify(proposedStructure),
      changes: [
        {
          type: "create_category" as const,
          description: "Utworzenie kategorii 'Bestsellery' z najpopularniejszymi usługami",
          toCategory: "⭐ BESTSELLERY",
          services: ["Całe ciało - Kobieta", "Bikini brazylijskie - Kobieta", "Nogi całe - Kobieta"],
          reason: "Bestsellery na górze cennika zwiększają konwersję nawet o 23% - klienci szybciej znajdują najpopularniejsze usługi",
        },
        {
          type: "rename_category" as const,
          description: "Zmiana nazwy z '✦ PROMOCJE GRUDZIEŃ✦' na '🎁 PROMOCJE ŚWIĄTECZNE'",
          fromCategory: "✦ PROMOCJE GRUDZIEŃ✦",
          toCategory: "🎁 PROMOCJE ŚWIĄTECZNE",
          reason: "Bardziej uniwersalna nazwa pozwoli używać kategorii dłużej bez konieczności zmian",
        },
        {
          type: "rename_category" as const,
          description: "Uproszczenie nazwy kategorii dla kobiet",
          fromCategory: "🔲 DEPILACJA LASEROWA THUNDER KOBIETA",
          toCategory: "👩 DEPILACJA LASEROWA - KOBIETA",
          reason: "Krótsze, czytelniejsze nazwy kategorii ułatwiają nawigację w cenniku",
        },
        {
          type: "rename_category" as const,
          description: "Uproszczenie nazwy kategorii dla mężczyzn",
          fromCategory: "🔲 DEPILACJA LASEROWA THUNDER MĘŻCZYZNA",
          toCategory: "👨 DEPILACJA LASEROWA - MĘŻCZYZNA",
          reason: "Spójna konwencja nazewnictwa z kategorią dla kobiet",
        },
        {
          type: "create_category" as const,
          description: "Utworzenie kategorii z pakietami zabiegów",
          toCategory: "📦 PAKIETY ZABIEGÓW",
          services: ["Pakiet 4 zabiegi", "Pakiet 6 zabiegów"],
          reason: "Wydzielenie pakietów ułatwia klientom znalezienie opcji oszczędności przy seriach zabiegów",
        },
        {
          type: "reorder_categories" as const,
          description: "Zmiana kolejności: Bestsellery → Promocje → Kobieta → Mężczyzna → Pakiety",
          reason: "Optymalna kolejność: najpierw to co przyciąga uwagę (bestsellery, promocje), potem szczegółowa oferta",
        },
      ],
      status: "pending",
      createdAt: now,
    });

    // Zaktualizuj audyt z nowymi ID
    await ctx.db.patch(args.auditId, {
      keywordReportId,
      categoryProposalId,
    });

    return { keywordReportId, categoryProposalId };
  },
});

// Re-run audit from scratch (dev only)
// This will re-scrape and re-analyze the audit, preserving variants
export const rerunAudit = mutation({
  args: { auditId: v.id("audits") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const audit = await ctx.db.get(args.auditId);
    if (!audit) {
      throw new Error("Audyt nie znaleziony");
    }

    if (!audit.sourceUrl) {
      throw new Error("Audyt nie ma URL źródłowego");
    }

    // Reset audit status and clear old data
    await ctx.db.patch(args.auditId, {
      status: "scraping",
      progress: 0,
      progressMessage: "Re-running audit...",
      errorMessage: undefined,
      retryCount: 0,
      // Clear old analysis data to force regeneration
      scrapedDataJson: undefined,
      rawData: undefined,
      reportJson: undefined,
      overallScore: undefined,
      keywordReportId: undefined,
      categoryProposalId: undefined,
    });

    // Schedule the scraping action
    await ctx.scheduler.runAfter(0, internal.auditActions.scrapeBooksyProfile, {
      auditId: args.auditId,
    });

    return null;
  },
});

// DEV ONLY: Create and run audit without auth (for testing)
export const createAndRunAuditDev = mutation({
  args: { sourceUrl: v.string() },
  returns: v.id("audits"),
  handler: async (ctx, args) => {
    // Validate URL
    if (!args.sourceUrl.includes('booksy.com')) {
      throw new Error("URL musi być linkiem do profilu Booksy");
    }

    // Get or create a test user
    let testUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), "dev-test@booksyauditor.pl"))
      .first();

    if (!testUser) {
      const userId = await ctx.db.insert("users", {
        email: "dev-test@booksyauditor.pl",
        clerkId: "dev-test-clerk-id",
        credits: 100,
        createdAt: Date.now(),
      });
      testUser = await ctx.db.get(userId);
    }

    if (!testUser) {
      throw new Error("Failed to create test user");
    }

    const now = Date.now();

    // Create audit
    const auditId = await ctx.db.insert("audits", {
      userId: testUser._id,
      status: "scraping",
      sourceType: "booksy",
      sourceUrl: args.sourceUrl,
      createdAt: now,
      startedAt: now,
      progress: 0,
      progressMessage: "Rozpoczynam audyt (dev mode)...",
    });

    // Schedule the scraping action
    await ctx.scheduler.runAfter(0, internal.auditActions.scrapeBooksyProfile, {
      auditId,
    });

    return auditId;
  },
});
