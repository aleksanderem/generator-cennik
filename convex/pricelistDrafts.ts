import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// 7 dni w milisekundach
const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Validator dla draftu
const draftValidator = v.object({
  _id: v.id("pricelistDrafts"),
  _creationTime: v.number(),
  draftId: v.string(),
  userId: v.optional(v.id("users")),
  sourcePricelistId: v.optional(v.id("pricelists")),
  pricingDataJson: v.string(),
  themeConfigJson: v.optional(v.string()),
  templateId: v.optional(v.string()),
  rawInputData: v.optional(v.string()),
  servicesCount: v.optional(v.number()),
  categoriesCount: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
  expiresAt: v.optional(v.number()),
});

// Pobierz draft po draftId (publiczny - nie wymaga logowania)
export const getDraft = query({
  args: { draftId: v.string() },
  returns: v.union(draftValidator, v.null()),
  handler: async (ctx, args) => {
    const draft = await ctx.db
      .query("pricelistDrafts")
      .withIndex("by_draft_id", (q) => q.eq("draftId", args.draftId))
      .unique();

    if (!draft) {
      return null;
    }

    // Sprawdź czy draft nie wygasł
    if (draft.expiresAt && draft.expiresAt < Date.now()) {
      return null;
    }

    return draft;
  },
});

// Zapisz nowy draft (publiczny - nie wymaga logowania)
export const saveDraft = mutation({
  args: {
    draftId: v.string(),
    pricingDataJson: v.string(),
    themeConfigJson: v.optional(v.string()),
    templateId: v.optional(v.string()),
    rawInputData: v.optional(v.string()),
  },
  returns: v.string(), // Zwraca draftId
  handler: async (ctx, args) => {
    // Sprawdź czy użytkownik jest zalogowany
    const identity = await ctx.auth.getUserIdentity();
    let userId = undefined;

    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .unique();
      if (user) {
        userId = user._id;
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

    // Sprawdź czy draft już istnieje
    const existingDraft = await ctx.db
      .query("pricelistDrafts")
      .withIndex("by_draft_id", (q) => q.eq("draftId", args.draftId))
      .unique();

    const now = Date.now();
    const expiresAt = userId ? undefined : now + DRAFT_TTL_MS;

    if (existingDraft) {
      // Aktualizuj istniejący draft
      await ctx.db.patch(existingDraft._id, {
        pricingDataJson: args.pricingDataJson,
        themeConfigJson: args.themeConfigJson,
        templateId: args.templateId,
        rawInputData: args.rawInputData,
        servicesCount,
        categoriesCount,
        updatedAt: now,
        // Aktualizuj userId jeśli użytkownik się zalogował
        ...(userId && { userId }),
        // Przedłuż TTL
        expiresAt,
      });
    } else {
      // Utwórz nowy draft
      await ctx.db.insert("pricelistDrafts", {
        draftId: args.draftId,
        userId,
        pricingDataJson: args.pricingDataJson,
        themeConfigJson: args.themeConfigJson,
        templateId: args.templateId,
        rawInputData: args.rawInputData,
        servicesCount,
        categoriesCount,
        createdAt: now,
        expiresAt,
      });
    }

    return args.draftId;
  },
});

// Aktualizuj draft (theme, templateId)
export const updateDraft = mutation({
  args: {
    draftId: v.string(),
    themeConfigJson: v.optional(v.string()),
    templateId: v.optional(v.string()),
    pricingDataJson: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const draft = await ctx.db
      .query("pricelistDrafts")
      .withIndex("by_draft_id", (q) => q.eq("draftId", args.draftId))
      .unique();

    if (!draft) {
      throw new Error("Draft nie znaleziony");
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.themeConfigJson !== undefined) {
      updates.themeConfigJson = args.themeConfigJson;
    }

    if (args.templateId !== undefined) {
      updates.templateId = args.templateId;
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

    // Sprawdź czy użytkownik jest zalogowany i przypisz draft
    const identity = await ctx.auth.getUserIdentity();
    if (identity && !draft.userId) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .unique();
      if (user) {
        updates.userId = user._id;
        updates.expiresAt = undefined; // Usuń TTL dla zalogowanych
      }
    }

    await ctx.db.patch(draft._id, updates);
    return null;
  },
});

// Pobierz drafty użytkownika (wymaga logowania)
export const getUserDrafts = query({
  args: {},
  returns: v.array(draftValidator),
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

    const drafts = await ctx.db
      .query("pricelistDrafts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return drafts;
  },
});

// Usuń draft
export const deleteDraft = mutation({
  args: { draftId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const draft = await ctx.db
      .query("pricelistDrafts")
      .withIndex("by_draft_id", (q) => q.eq("draftId", args.draftId))
      .unique();

    if (!draft) {
      return null;
    }

    // Sprawdź uprawnienia - tylko właściciel lub anonimowy
    const identity = await ctx.auth.getUserIdentity();
    if (draft.userId && identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .unique();
      if (!user || draft.userId !== user._id) {
        throw new Error("Brak uprawnień do usunięcia draftu");
      }
    }

    await ctx.db.delete(draft._id);
    return null;
  },
});

// Utwórz draft z istniejącego cennika (do edycji)
export const createDraftFromPricelist = mutation({
  args: {
    pricelistId: v.id("pricelists"),
  },
  returns: v.string(), // Zwraca draftId
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

    // Wygeneruj nowy draftId
    const draftId = `draft_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Utwórz draft z danych cennika
    await ctx.db.insert("pricelistDrafts", {
      draftId,
      userId: user._id,
      sourcePricelistId: args.pricelistId, // Zachowaj referencję do źródłowego cennika
      pricingDataJson: pricelist.pricingDataJson,
      themeConfigJson: pricelist.themeConfigJson,
      templateId: pricelist.templateId,
      servicesCount: pricelist.servicesCount,
      categoriesCount: pricelist.categoriesCount,
      createdAt: Date.now(),
      // Brak expiresAt dla zalogowanych użytkowników
    });

    return draftId;
  },
});

// Konwertuj draft na zapisany cennik (wymaga logowania)
export const convertDraftToPricelist = mutation({
  args: {
    draftId: v.string(),
    name: v.string(),
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

    const draft = await ctx.db
      .query("pricelistDrafts")
      .withIndex("by_draft_id", (q) => q.eq("draftId", args.draftId))
      .unique();

    if (!draft) {
      throw new Error("Draft nie znaleziony");
    }

    // Utwórz cennik z draftu
    const pricelistId = await ctx.db.insert("pricelists", {
      userId: user._id,
      name: args.name,
      source: "manual",
      pricingDataJson: draft.pricingDataJson,
      themeConfigJson: draft.themeConfigJson,
      templateId: draft.templateId,
      servicesCount: draft.servicesCount,
      categoriesCount: draft.categoriesCount,
      createdAt: Date.now(),
    });

    // Usuń draft po konwersji
    await ctx.db.delete(draft._id);

    return pricelistId;
  },
});
