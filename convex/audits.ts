import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";

// Typ statusu audytu
const auditStatusValidator = v.union(
  v.literal("pending"),
  v.literal("processing"),
  v.literal("completed"),
  v.literal("failed")
);

// Typ wyniku audytu
const auditValidator = v.object({
  _id: v.id("audits"),
  _creationTime: v.number(),
  userId: v.id("users"),
  purchaseId: v.optional(v.id("purchases")),
  status: auditStatusValidator,
  sourceUrl: v.optional(v.string()),
  sourceType: v.union(v.literal("booksy"), v.literal("manual")),
  overallScore: v.optional(v.number()),
  rawData: v.optional(v.string()),
  reportJson: v.optional(v.string()),
  reportPdfUrl: v.optional(v.string()),
  createdAt: v.number(),
  startedAt: v.optional(v.number()),
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

// Pobierz aktywny audyt użytkownika (pending lub processing)
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

    // Szukaj audytu w statusie pending lub processing
    const audits = await ctx.db
      .query("audits")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    const activeAudit = audits.find(
      (a) => a.status === "pending" || a.status === "processing"
    );

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

// Rozpocznij audyt (podaj URL i zmień status na processing)
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

    await ctx.db.patch(args.auditId, {
      sourceUrl: args.sourceUrl,
      status: "processing",
      startedAt: Date.now(),
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
    const existingAudit = await ctx.db
      .query("audits")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "pending"),
          q.eq(q.field("status"), "processing")
        )
      )
      .first();

    if (existingAudit) {
      throw new Error("Masz już aktywny audyt w trakcie");
    }

    // Zużyj kredyt
    await ctx.db.patch(user._id, {
      credits: user.credits - 1,
    });

    // Utwórz audyt od razu w statusie processing
    const auditId = await ctx.db.insert("audits", {
      userId: user._id,
      status: "processing",
      sourceUrl: args.sourceUrl,
      sourceType: "booksy",
      createdAt: Date.now(),
      startedAt: Date.now(),
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
    await ctx.db.patch(args.auditId, {
      status: "completed",
      overallScore: args.overallScore,
      rawData: args.rawData,
      reportJson: args.reportJson,
      reportPdfUrl: args.reportPdfUrl,
      completedAt: Date.now(),
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
      completedAt: Date.now(),
    });
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
