import { v } from "convex/values";
import {
  query,
  mutation,
  internalQuery,
  internalMutation,
} from "./_generated/server";

// ============================================
// BOOKSY CREDENTIALS MANAGEMENT
// ============================================

/**
 * Get active credentials for Booksy API calls.
 * Returns the most recent active credentials or null if none available.
 */
export const getActiveCredentials = internalQuery({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("booksyCredentials"),
      accessToken: v.string(),
      apiKey: v.string(),
      fingerprint: v.string(),
      extractedAt: v.number(),
      status: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    // First try to find active credentials
    const active = await ctx.db
      .query("booksyCredentials")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .order("desc")
      .first();

    if (active) {
      return {
        _id: active._id,
        accessToken: active.accessToken,
        apiKey: active.apiKey,
        fingerprint: active.fingerprint,
        extractedAt: active.extractedAt,
        status: active.status,
      };
    }

    return null;
  },
});

/**
 * Save new credentials extracted from Booksy.
 * Marks any existing active credentials as expired.
 */
export const saveCredentials = internalMutation({
  args: {
    accessToken: v.string(),
    apiKey: v.string(),
    fingerprint: v.string(),
    extractedBy: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  returns: v.id("booksyCredentials"),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Mark all existing active credentials as expired
    const activeCredentials = await ctx.db
      .query("booksyCredentials")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    for (const cred of activeCredentials) {
      await ctx.db.patch(cred._id, {
        status: "expired",
        updatedAt: now,
      });
    }

    // Insert new credentials
    const credId = await ctx.db.insert("booksyCredentials", {
      accessToken: args.accessToken,
      apiKey: args.apiKey,
      fingerprint: args.fingerprint,
      extractedAt: now,
      failureCount: 0,
      status: "active",
      extractedBy: args.extractedBy,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });

    console.log(`[BooksyCredentials] New credentials saved: ${credId}`);
    return credId;
  },
});

/**
 * Mark credentials as used successfully.
 * Resets failure count and updates lastUsedAt.
 */
export const markCredentialsUsed = internalMutation({
  args: { credentialsId: v.id("booksyCredentials") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.credentialsId, {
      lastUsedAt: Date.now(),
      failureCount: 0,
      updatedAt: Date.now(),
    });
    return null;
  },
});

/**
 * Mark credentials as failed.
 * Increments failure count. After 3 failures, marks as expired.
 */
export const markCredentialsFailed = internalMutation({
  args: {
    credentialsId: v.id("booksyCredentials"),
    reason: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const cred = await ctx.db.get(args.credentialsId);
    if (!cred) return null;

    const newFailureCount = cred.failureCount + 1;
    const now = Date.now();

    if (newFailureCount >= 3) {
      // Too many failures - mark as expired
      await ctx.db.patch(args.credentialsId, {
        status: "expired",
        failureCount: newFailureCount,
        lastFailedAt: now,
        notes: args.reason ? `${cred.notes || ""} | Failed: ${args.reason}` : cred.notes,
        updatedAt: now,
      });
      console.log(`[BooksyCredentials] Credentials ${args.credentialsId} marked as expired after ${newFailureCount} failures`);
    } else {
      // Increment failure count
      await ctx.db.patch(args.credentialsId, {
        failureCount: newFailureCount,
        lastFailedAt: now,
        updatedAt: now,
      });
      console.log(`[BooksyCredentials] Credentials ${args.credentialsId} failure count: ${newFailureCount}`);
    }

    return null;
  },
});

/**
 * Get credentials status for admin dashboard.
 */
export const getCredentialsStatus = query({
  args: {},
  returns: v.object({
    hasActiveCredentials: v.boolean(),
    lastExtractedAt: v.union(v.number(), v.null()),
    lastUsedAt: v.union(v.number(), v.null()),
    status: v.union(v.string(), v.null()),
    failureCount: v.number(),
    needsRefresh: v.boolean(),
  }),
  handler: async (ctx) => {
    // Get most recent credentials of any status
    const allCreds = await ctx.db
      .query("booksyCredentials")
      .order("desc")
      .take(1);

    const latest = allCreds[0];

    if (!latest) {
      return {
        hasActiveCredentials: false,
        lastExtractedAt: null,
        lastUsedAt: null,
        status: null,
        failureCount: 0,
        needsRefresh: true,
      };
    }

    // Check if credentials are older than 24 hours
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const isStale = latest.extractedAt < oneDayAgo;

    return {
      hasActiveCredentials: latest.status === "active",
      lastExtractedAt: latest.extractedAt,
      lastUsedAt: latest.lastUsedAt ?? null,
      status: latest.status,
      failureCount: latest.failureCount,
      needsRefresh: latest.status !== "active" || isStale,
    };
  },
});

/**
 * Manual update of credentials (for admin use).
 */
export const updateCredentialsManually = mutation({
  args: {
    accessToken: v.string(),
    apiKey: v.string(),
    fingerprint: v.string(),
    notes: v.optional(v.string()),
  },
  returns: v.id("booksyCredentials"),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Mark existing active as expired
    const activeCredentials = await ctx.db
      .query("booksyCredentials")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    for (const cred of activeCredentials) {
      await ctx.db.patch(cred._id, {
        status: "expired",
        updatedAt: now,
      });
    }

    // Insert new
    const credId = await ctx.db.insert("booksyCredentials", {
      accessToken: args.accessToken,
      apiKey: args.apiKey,
      fingerprint: args.fingerprint,
      extractedAt: now,
      failureCount: 0,
      status: "active",
      extractedBy: "manual",
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });

    console.log(`[BooksyCredentials] Manual credentials saved: ${credId}`);
    return credId;
  },
});

/**
 * Get fallback credentials (hardcoded) when no credentials in DB.
 * These are the original hardcoded credentials as a last resort.
 */
export const getFallbackCredentials = internalQuery({
  args: {},
  returns: v.object({
    accessToken: v.string(),
    apiKey: v.string(),
    fingerprint: v.string(),
  }),
  handler: async () => {
    // Fallback to working credentials (updated 2026-01-06)
    return {
      accessToken: "qc1ywuMrQycKA4bQbbuemOE4IBklNKYN",
      apiKey: "web-e3d812bf-d7a2-445d-ab38-55589ae6a121",
      fingerprint: "ed2065e7-ee7d-4290-95ae-795dfaf4402f",
    };
  },
});
