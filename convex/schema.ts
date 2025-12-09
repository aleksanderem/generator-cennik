import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
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
      v.literal("optimize"),
      v.literal("combo")
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

    sourceUrl: v.string(),
    sourceType: v.union(v.literal("booksy"), v.literal("manual")),

    // Wyniki audytu
    overallScore: v.number(),
    rawData: v.string(),
    reportJson: v.string(), // pełny raport jako JSON string

    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // Optymalizacje
  optimizations: defineTable({
    userId: v.id("users"),
    purchaseId: v.optional(v.id("purchases")),
    auditId: v.optional(v.id("audits")),

    originalData: v.string(),
    optimizedData: v.string(),

    createdAt: v.number(),
  }).index("by_user", ["userId"]),
});
