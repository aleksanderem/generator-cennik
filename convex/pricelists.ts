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
    auditId: v.optional(v.id("audits")),
  },
  returns: v.id("pricelists"),
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
      servicesCount,
      categoriesCount,
      createdAt: Date.now(),
    });
  },
});

// Aktualizuj cennik
export const updatePricelist = mutation({
  args: {
    pricelistId: v.id("pricelists"),
    name: v.optional(v.string()),
    pricingDataJson: v.optional(v.string()),
    themeConfigJson: v.optional(v.string()),
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

// Internal: List all pricelists (for admin/debugging)
export const listAllPricelists = internalQuery({
  args: {},
  returns: v.array(v.object({
    _id: v.id("pricelists"),
    name: v.string(),
    isOptimized: v.optional(v.boolean()),
    purchaseId: v.optional(v.id("purchases")),
  })),
  handler: async (ctx) => {
    const pricelists = await ctx.db.query("pricelists").collect();
    return pricelists.map(p => ({
      _id: p._id,
      name: p.name,
      isOptimized: p.isOptimized,
      purchaseId: p.purchaseId,
    }));
  },
});
