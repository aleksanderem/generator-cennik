import { v } from "convex/values";
import { query, mutation, internalMutation, internalQuery } from "./_generated/server";

// Validator dla cennika
const pricelistValidator = v.object({
  _id: v.id("pricelists"),
  _creationTime: v.number(),
  userId: v.id("users"),
  auditId: v.optional(v.id("audits")),
  purchaseId: v.optional(v.id("purchases")),
  name: v.string(),
  source: v.union(
    v.literal("manual"),
    v.literal("booksy"),
    v.literal("audit")
  ),
  pricingDataJson: v.string(),
  themeConfigJson: v.optional(v.string()),
  templateId: v.optional(v.string()),
  servicesCount: v.optional(v.number()),
  categoriesCount: v.optional(v.number()),
  isOptimized: v.optional(v.boolean()),
  optimizedFromPricelistId: v.optional(v.id("pricelists")),
  optimizedVersionId: v.optional(v.id("pricelists")),
  originalPricingDataJson: v.optional(v.string()),
  optimizationResultJson: v.optional(v.string()),
  categoryConfigJson: v.optional(v.string()),
  optimizedAt: v.optional(v.number()),
  // Pola dla background job optimization
  optimizationJobId: v.optional(v.id("optimizationJobs")),
  optimizationStatus: v.optional(v.union(
    v.literal("pending"),
    v.literal("processing"),
    v.literal("completed"),
    v.literal("failed")
  )),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
});

// Pobierz wszystkie cenniki użytkownika
export const getUserPricelists = query({
  args: {},
  returns: v.array(pricelistValidator),
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

    const pricelists = await ctx.db
      .query("pricelists")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return pricelists;
  },
});

// Pobierz pojedynczy cennik po ID (publiczny - do podglądu)
export const getPricelistPublic = query({
  args: { pricelistId: v.id("pricelists") },
  returns: v.union(
    v.object({
      pricingDataJson: v.string(),
      themeConfigJson: v.optional(v.string()),
      templateId: v.optional(v.string()),
      name: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const pricelist = await ctx.db.get(args.pricelistId);
    if (!pricelist) {
      return null;
    }
    // Zwracamy tylko dane potrzebne do wyświetlenia (bez userId itp.)
    return {
      pricingDataJson: pricelist.pricingDataJson,
      themeConfigJson: pricelist.themeConfigJson,
      templateId: pricelist.templateId,
      name: pricelist.name,
    };
  },
});

// Pobierz pojedynczy cennik po ID (wymaga auth)
export const getPricelist = query({
  args: { pricelistId: v.id("pricelists") },
  returns: v.union(pricelistValidator, v.null()),
  handler: async (ctx, args) => {
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

    const pricelist = await ctx.db.get(args.pricelistId);
    if (!pricelist || pricelist.userId !== user._id) {
      return null;
    }

    return pricelist;
  },
});

// Zapisz nowy cennik
export const savePricelist = mutation({
  args: {
    name: v.string(),
    source: v.union(
      v.literal("manual"),
      v.literal("booksy"),
      v.literal("audit")
    ),
    pricingDataJson: v.string(),
    themeConfigJson: v.optional(v.string()),
    templateId: v.optional(v.string()),
    auditId: v.optional(v.id("audits")),
  },
  returns: v.id("pricelists"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Musisz być zalogowany");
    }

    let user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    // Auto-create user if not exists (fallback for missing Clerk webhook)
    if (!user) {
      const userId = await ctx.db.insert("users", {
        clerkId: identity.subject,
        email: identity.email || "unknown@email.com",
        name: identity.name,
        avatarUrl: identity.pictureUrl,
        createdAt: Date.now(),
        credits: 0,
      });
      user = await ctx.db.get(userId);
      if (!user) {
        throw new Error("Nie udało się utworzyć użytkownika");
      }
    }

    // Parsuj JSON aby wyliczyć statystyki
    let servicesCount = 0;
    let categoriesCount = 0;
    try {
      const pricingData = JSON.parse(args.pricingDataJson);
      if (pricingData.categories && Array.isArray(pricingData.categories)) {
        categoriesCount = pricingData.categories.length;
        for (const cat of pricingData.categories) {
          if (cat.services && Array.isArray(cat.services)) {
            servicesCount += cat.services.length;
          }
        }
      }
    } catch (e) {
      // Ignoruj błędy parsowania
    }

    return await ctx.db.insert("pricelists", {
      userId: user._id,
      auditId: args.auditId,
      name: args.name,
      source: args.source,
      pricingDataJson: args.pricingDataJson,
      themeConfigJson: args.themeConfigJson,
      templateId: args.templateId,
      servicesCount,
      categoriesCount,
      createdAt: Date.now(),
    });
  },
});

// Aktualizuj cennik (obsługuje wszystkie pola włącznie z optymalizacją)
export const updatePricelist = mutation({
  args: {
    pricelistId: v.id("pricelists"),
    name: v.optional(v.string()),
    pricingDataJson: v.optional(v.string()),
    themeConfigJson: v.optional(v.string()),
    templateId: v.optional(v.string()),
    // Pola związane z optymalizacją
    isOptimized: v.optional(v.boolean()),
    originalPricingDataJson: v.optional(v.string()),
    optimizationResultJson: v.optional(v.string()),
    categoryConfigJson: v.optional(v.string()),
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

    const pricelist = await ctx.db.get(args.pricelistId);
    if (!pricelist || pricelist.userId !== user._id) {
      throw new Error("Cennik nie znaleziony");
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) {
      updates.name = args.name;
    }

    if (args.pricingDataJson !== undefined) {
      updates.pricingDataJson = args.pricingDataJson;

      // Przelicz statystyki
      try {
        const pricingData = JSON.parse(args.pricingDataJson);
        if (pricingData.categories && Array.isArray(pricingData.categories)) {
          updates.categoriesCount = pricingData.categories.length;
          let servicesCount = 0;
          for (const cat of pricingData.categories) {
            if (cat.services && Array.isArray(cat.services)) {
              servicesCount += cat.services.length;
            }
          }
          updates.servicesCount = servicesCount;
        }
      } catch (e) {
        // Ignoruj błędy parsowania
      }
    }

    if (args.themeConfigJson !== undefined) {
      updates.themeConfigJson = args.themeConfigJson;
    }

    if (args.templateId !== undefined) {
      updates.templateId = args.templateId;
    }

    // Pola optymalizacji
    if (args.isOptimized !== undefined) {
      updates.isOptimized = args.isOptimized;
      if (args.isOptimized) {
        updates.optimizedAt = Date.now();
      }
    }

    if (args.originalPricingDataJson !== undefined) {
      updates.originalPricingDataJson = args.originalPricingDataJson;
    }

    if (args.optimizationResultJson !== undefined) {
      updates.optimizationResultJson = args.optimizationResultJson;
    }

    if (args.categoryConfigJson !== undefined) {
      updates.categoryConfigJson = args.categoryConfigJson;
    }

    if (args.purchaseId !== undefined) {
      updates.purchaseId = args.purchaseId;
    }

    await ctx.db.patch(args.pricelistId, updates);
    return null;
  },
});

// Usuń cennik
export const deletePricelist = mutation({
  args: { pricelistId: v.id("pricelists") },
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

    const pricelist = await ctx.db.get(args.pricelistId);
    if (!pricelist || pricelist.userId !== user._id) {
      throw new Error("Cennik nie znaleziony");
    }

    await ctx.db.delete(args.pricelistId);
    return null;
  },
});

// Aktualizuj theme i templateId cennika (z edytora szablonów)
export const updatePricelistTheme = mutation({
  args: {
    pricelistId: v.id("pricelists"),
    themeConfigJson: v.string(),
    templateId: v.string(),
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

    const pricelist = await ctx.db.get(args.pricelistId);
    if (!pricelist || pricelist.userId !== user._id) {
      throw new Error("Cennik nie znaleziony");
    }

    await ctx.db.patch(args.pricelistId, {
      themeConfigJson: args.themeConfigJson,
      templateId: args.templateId,
      updatedAt: Date.now(),
    });
    return null;
  },
});

// Internal: Zapisz cennik z audytu (wywoływane po zakończeniu audytu)
export const savePricelistFromAudit = internalMutation({
  args: {
    userId: v.id("users"),
    auditId: v.id("audits"),
    name: v.string(),
    source: v.union(v.literal("booksy"), v.literal("audit")),
    pricingDataJson: v.string(),
  },
  returns: v.id("pricelists"),
  handler: async (ctx, args) => {
    // Parsuj JSON aby wyliczyć statystyki
    let servicesCount = 0;
    let categoriesCount = 0;
    try {
      const pricingData = JSON.parse(args.pricingDataJson);
      if (pricingData.categories && Array.isArray(pricingData.categories)) {
        categoriesCount = pricingData.categories.length;
        for (const cat of pricingData.categories) {
          if (cat.services && Array.isArray(cat.services)) {
            servicesCount += cat.services.length;
          }
        }
      }
    } catch (e) {
      // Ignoruj błędy parsowania
    }

    return await ctx.db.insert("pricelists", {
      userId: args.userId,
      auditId: args.auditId,
      name: args.name,
      source: args.source,
      pricingDataJson: args.pricingDataJson,
      servicesCount,
      categoriesCount,
      createdAt: Date.now(),
    });
  },
});

// Internal: Link purchase to pricelist (for testing/admin)
export const linkPurchaseToPricelist = internalMutation({
  args: {
    pricelistId: v.id("pricelists"),
    purchaseId: v.id("purchases"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.pricelistId, { purchaseId: args.purchaseId });
    return null;
  },
});

// Check pricelist access without returning full data
// Used to detect auth race conditions where getPricelist returns null before auth is ready
export const checkPricelistAccess = query({
  args: { pricelistId: v.id("pricelists") },
  returns: v.object({
    hasIdentity: v.boolean(),
    identityEmail: v.optional(v.string()),
    userFound: v.boolean(),
    userId: v.optional(v.string()),
    pricelistExists: v.boolean(),
    pricelistOwnerId: v.optional(v.string()),
    ownerEmail: v.optional(v.string()),
    hasAccess: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        hasIdentity: false,
        userFound: false,
        pricelistExists: false,
        hasAccess: false,
      };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    const pricelist = await ctx.db.get(args.pricelistId);
    const owner = pricelist ? await ctx.db.get(pricelist.userId) : null;

    return {
      hasIdentity: true,
      identityEmail: identity.email,
      userFound: !!user,
      userId: user?._id,
      pricelistExists: !!pricelist,
      pricelistOwnerId: pricelist?.userId,
      ownerEmail: owner?.email,
      hasAccess: !!user && !!pricelist && pricelist.userId === user._id,
    };
  },
});

// Internal: List all pricelists (for admin/debugging)
export const listAllPricelists = internalQuery({
  args: {},
  returns: v.array(v.object({
    _id: v.id("pricelists"),
    name: v.string(),
    userId: v.id("users"),
    isOptimized: v.optional(v.boolean()),
    purchaseId: v.optional(v.id("purchases")),
  })),
  handler: async (ctx) => {
    const pricelists = await ctx.db.query("pricelists").collect();
    return pricelists.map(p => ({
      _id: p._id,
      name: p.name,
      userId: p.userId,
      isOptimized: p.isOptimized,
      purchaseId: p.purchaseId,
    }));
  },
});

// Internal: Debug - get full pricelist data
export const debugGetPricelist = internalQuery({
  args: { pricelistId: v.id("pricelists") },
  returns: v.union(v.object({
    _id: v.id("pricelists"),
    name: v.string(),
    pricingDataJson: v.string(),
    pricingDataParsed: v.any(),
    categoriesCount: v.number(),
    servicesCount: v.number(),
  }), v.null()),
  handler: async (ctx, args) => {
    const pricelist = await ctx.db.get(args.pricelistId);
    if (!pricelist) return null;

    let parsed = null;
    let categoriesCount = 0;
    let servicesCount = 0;

    try {
      parsed = JSON.parse(pricelist.pricingDataJson);
      categoriesCount = parsed.categories?.length ?? 0;
      for (const cat of parsed.categories ?? []) {
        servicesCount += cat.services?.length ?? 0;
      }
    } catch (e) {
      parsed = { error: "Failed to parse" };
    }

    return {
      _id: pricelist._id,
      name: pricelist.name,
      pricingDataJson: pricelist.pricingDataJson.substring(0, 500),
      pricingDataParsed: parsed,
      categoriesCount,
      servicesCount,
    };
  },
});

// Internal: Reset optimization for a pricelist (for testing/fixing broken data)
export const resetOptimization = internalMutation({
  args: { pricelistId: v.id("pricelists") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const pricelist = await ctx.db.get(args.pricelistId);
    if (!pricelist) throw new Error("Pricelist not found");

    // If we have original data, restore it
    if (pricelist.originalPricingDataJson) {
      await ctx.db.patch(args.pricelistId, {
        pricingDataJson: pricelist.originalPricingDataJson,
        isOptimized: false,
        optimizationStatus: undefined,
        optimizationJobId: undefined,
        optimizationResultJson: undefined,
        optimizedAt: undefined,
        updatedAt: Date.now(),
      });
      console.log("Reset pricelist to original data:", args.pricelistId);
    } else {
      // Just reset flags
      await ctx.db.patch(args.pricelistId, {
        isOptimized: false,
        optimizationStatus: undefined,
        optimizationJobId: undefined,
        optimizationResultJson: undefined,
        optimizedAt: undefined,
        updatedAt: Date.now(),
      });
      console.log("Reset optimization flags for:", args.pricelistId);
    }

    return null;
  },
});

// Force re-fetch pricelist data from Booksy source
// This is useful when cached/stored data is corrupted or empty
export const refetchFromBooksy = mutation({
  args: { pricelistId: v.id("pricelists") },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    auditId: v.optional(v.id("audits")),
  }),
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

    const pricelist = await ctx.db.get(args.pricelistId);
    if (!pricelist || pricelist.userId !== user._id) {
      throw new Error("Cennik nie znaleziony");
    }

    // Get the linked audit to find source URL
    if (!pricelist.auditId) {
      return {
        success: false,
        message: "Ten cennik nie jest powiązany z audytem Booksy. Brak źródłowego URL.",
        auditId: undefined,
      };
    }

    const audit = await ctx.db.get(pricelist.auditId);
    if (!audit || !audit.sourceUrl) {
      return {
        success: false,
        message: "Nie znaleziono źródłowego URL Booksy dla tego cennika.",
        auditId: pricelist.auditId,
      };
    }

    // Reset the audit to re-scrape
    await ctx.db.patch(pricelist.auditId, {
      status: "scraping",
      progress: 0,
      progressMessage: "Ponowne pobieranie danych z Booksy...",
      errorMessage: undefined,
      retryCount: 0,
      scrapedDataJson: undefined,
      scrapedCategoriesCount: undefined,
      scrapedServicesCount: undefined,
      scrapingCompletedAt: undefined,
      completedAt: undefined,
    });

    // Reset the pricelist data
    await ctx.db.patch(args.pricelistId, {
      pricingDataJson: JSON.stringify({ salonName: audit.salonName || "Ładowanie...", categories: [] }),
      servicesCount: 0,
      categoriesCount: 0,
      isOptimized: false,
      optimizationStatus: undefined,
      optimizationJobId: undefined,
      optimizationResultJson: undefined,
      optimizedAt: undefined,
      updatedAt: Date.now(),
    });

    // Schedule the scraping action
    const { internal } = await import("./_generated/api");
    await ctx.scheduler.runAfter(0, internal.auditActions.scrapeBooksyProfile, {
      auditId: pricelist.auditId,
    });

    return {
      success: true,
      message: `Rozpoczęto ponowne pobieranie danych z Booksy dla: ${audit.sourceUrl}`,
      auditId: pricelist.auditId,
    };
  },
});

// Get the Booksy source URL for a pricelist (for UI display)
export const getPricelistSourceUrl = query({
  args: { pricelistId: v.id("pricelists") },
  returns: v.union(
    v.object({
      hasSourceUrl: v.literal(true),
      sourceUrl: v.string(),
      salonName: v.optional(v.string()),
      auditId: v.id("audits"),
    }),
    v.object({
      hasSourceUrl: v.literal(false),
      reason: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { hasSourceUrl: false as const, reason: "Musisz być zalogowany" };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) {
      return { hasSourceUrl: false as const, reason: "Użytkownik nie znaleziony" };
    }

    const pricelist = await ctx.db.get(args.pricelistId);
    if (!pricelist || pricelist.userId !== user._id) {
      return { hasSourceUrl: false as const, reason: "Cennik nie znaleziony" };
    }

    if (!pricelist.auditId) {
      return { hasSourceUrl: false as const, reason: "Cennik nie jest powiązany z audytem" };
    }

    const audit = await ctx.db.get(pricelist.auditId);
    if (!audit || !audit.sourceUrl) {
      return { hasSourceUrl: false as const, reason: "Brak źródłowego URL" };
    }

    return {
      hasSourceUrl: true as const,
      sourceUrl: audit.sourceUrl,
      salonName: audit.salonName,
      auditId: pricelist.auditId,
    };
  },
});
