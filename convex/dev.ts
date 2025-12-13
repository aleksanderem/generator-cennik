import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Status audytu
const auditStatusValidator = v.union(
  v.literal("pending"),
  v.literal("processing"),
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

    if (args.status === "processing" && !audit.startedAt) {
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
