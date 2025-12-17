import { v } from "convex/values";
import { query, internalMutation, internalQuery } from "./_generated/server";

// Pobierz historię zakupów użytkownika
export const getUserPurchases = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("purchases"),
      _creationTime: v.number(),
      userId: v.id("users"),
      stripePaymentIntentId: v.string(),
      stripeSessionId: v.optional(v.string()),
      product: v.union(
        v.literal("audit"),
        v.literal("audit_consultation"),
        v.literal("pricelist_optimization")
      ),
      amount: v.number(),
      currency: v.string(),
      status: v.union(
        v.literal("pending"),
        v.literal("completed"),
        v.literal("failed"),
        v.literal("refunded")
      ),
      createdAt: v.number(),
      completedAt: v.optional(v.number()),
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

    const purchases = await ctx.db
      .query("purchases")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return purchases;
  },
});

// Utwórz pending purchase (przed płatnością)
export const createPendingPurchase = internalMutation({
  args: {
    userId: v.id("users"),
    stripeSessionId: v.string(),
    product: v.union(
      v.literal("audit"),
      v.literal("audit_consultation"),
      v.literal("pricelist_optimization")
    ),
    amount: v.number(),
    currency: v.string(),
  },
  returns: v.id("purchases"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("purchases", {
      userId: args.userId,
      stripePaymentIntentId: "", // będzie uzupełnione przez webhook
      stripeSessionId: args.stripeSessionId,
      product: args.product,
      amount: args.amount,
      currency: args.currency,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

// Zakończ zakup (po płatności - wywoływane przez webhook)
export const completePurchase = internalMutation({
  args: {
    stripeSessionId: v.string(),
    stripePaymentIntentId: v.string(),
  },
  returns: v.union(v.id("purchases"), v.null()),
  handler: async (ctx, args) => {
    const purchase = await ctx.db
      .query("purchases")
      .withIndex("by_stripe_session", (q) =>
        q.eq("stripeSessionId", args.stripeSessionId)
      )
      .unique();

    if (!purchase) {
      console.error("Purchase not found for session:", args.stripeSessionId);
      return null;
    }

    await ctx.db.patch(purchase._id, {
      stripePaymentIntentId: args.stripePaymentIntentId,
      status: "completed",
      completedAt: Date.now(),
    });

    return purchase._id;
  },
});

// Pobierz purchase po stripeSessionId (internal)
export const getPurchaseBySessionId = internalQuery({
  args: { stripeSessionId: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("purchases"),
      _creationTime: v.number(),
      userId: v.id("users"),
      stripePaymentIntentId: v.string(),
      stripeSessionId: v.optional(v.string()),
      product: v.union(
        v.literal("audit"),
        v.literal("audit_consultation"),
        v.literal("pricelist_optimization")
      ),
      amount: v.number(),
      currency: v.string(),
      status: v.union(
        v.literal("pending"),
        v.literal("completed"),
        v.literal("failed"),
        v.literal("refunded")
      ),
      createdAt: v.number(),
      completedAt: v.optional(v.number()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("purchases")
      .withIndex("by_stripe_session", (q) =>
        q.eq("stripeSessionId", args.stripeSessionId)
      )
      .unique();
  },
});

// Oznacz zakup jako nieudany
export const failPurchase = internalMutation({
  args: {
    stripeSessionId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const purchase = await ctx.db
      .query("purchases")
      .withIndex("by_stripe_session", (q) =>
        q.eq("stripeSessionId", args.stripeSessionId)
      )
      .unique();

    if (purchase) {
      await ctx.db.patch(purchase._id, {
        status: "failed",
      });
    }

    return null;
  },
});

// Internal: List all purchases (for admin/debugging)
export const listAllPurchases = internalQuery({
  args: {},
  returns: v.array(v.object({
    _id: v.id("purchases"),
    product: v.union(
      v.literal("audit"),
      v.literal("audit_consultation"),
      v.literal("pricelist_optimization")
    ),
    status: v.string(),
    amount: v.number(),
  })),
  handler: async (ctx) => {
    const purchases = await ctx.db.query("purchases").collect();
    return purchases.map(p => ({
      _id: p._id,
      product: p.product,
      status: p.status,
      amount: p.amount,
    }));
  },
});
