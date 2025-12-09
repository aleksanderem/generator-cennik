import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

// Pobierz audyty użytkownika
export const getUserAudits = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("audits"),
      _creationTime: v.number(),
      userId: v.id("users"),
      purchaseId: v.optional(v.id("purchases")),
      sourceUrl: v.string(),
      sourceType: v.union(v.literal("booksy"), v.literal("manual")),
      overallScore: v.number(),
      rawData: v.string(),
      reportJson: v.string(),
      createdAt: v.number(),
    })
  ),
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

// Pobierz pojedynczy audyt
export const getAudit = query({
  args: { auditId: v.id("audits") },
  returns: v.union(
    v.object({
      _id: v.id("audits"),
      _creationTime: v.number(),
      userId: v.id("users"),
      purchaseId: v.optional(v.id("purchases")),
      sourceUrl: v.string(),
      sourceType: v.union(v.literal("booksy"), v.literal("manual")),
      overallScore: v.number(),
      rawData: v.string(),
      reportJson: v.string(),
      createdAt: v.number(),
    }),
    v.null()
  ),
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

// Zapisz nowy audyt (wymaga kredytu)
export const saveAudit = mutation({
  args: {
    sourceUrl: v.string(),
    sourceType: v.union(v.literal("booksy"), v.literal("manual")),
    overallScore: v.number(),
    rawData: v.string(),
    reportJson: v.string(),
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

    // Zużyj kredyt
    await ctx.db.patch(user._id, {
      credits: user.credits - 1,
    });

    // Zapisz audyt
    const auditId = await ctx.db.insert("audits", {
      userId: user._id,
      sourceUrl: args.sourceUrl,
      sourceType: args.sourceType,
      overallScore: args.overallScore,
      rawData: args.rawData,
      reportJson: args.reportJson,
      createdAt: Date.now(),
    });

    return auditId;
  },
});

// Zapisz audyt (wersja internal - bez sprawdzania kredytów)
export const saveAuditInternal = internalMutation({
  args: {
    userId: v.id("users"),
    purchaseId: v.optional(v.id("purchases")),
    sourceUrl: v.string(),
    sourceType: v.union(v.literal("booksy"), v.literal("manual")),
    overallScore: v.number(),
    rawData: v.string(),
    reportJson: v.string(),
  },
  returns: v.id("audits"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("audits", {
      userId: args.userId,
      purchaseId: args.purchaseId,
      sourceUrl: args.sourceUrl,
      sourceType: args.sourceType,
      overallScore: args.overallScore,
      rawData: args.rawData,
      reportJson: args.reportJson,
      createdAt: Date.now(),
    });
  },
});
