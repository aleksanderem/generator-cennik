// Queries and mutations for audit analysis data (separate file - no "use node")

import { v } from "convex/values";
import { internalQuery, internalMutation, query, mutation } from "./_generated/server";

// ============================================
// INTERNAL QUERIES (used by actions)
// ============================================

export const getKeywordReport = internalQuery({
  args: { keywordReportId: v.id("keywordReports") },
  returns: v.union(
    v.object({
      _id: v.id("keywordReports"),
      auditId: v.id("audits"),
      keywords: v.array(
        v.object({
          keyword: v.string(),
          count: v.number(),
          categories: v.array(v.string()),
          services: v.array(v.string()),
        })
      ),
      categoryDistribution: v.array(
        v.object({
          categoryName: v.string(),
          keywordCount: v.number(),
          topKeywords: v.array(v.string()),
        })
      ),
      suggestions: v.array(v.string()),
      createdAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.keywordReportId);
    if (!report) return null;
    return {
      _id: report._id,
      auditId: report.auditId,
      keywords: report.keywords,
      categoryDistribution: report.categoryDistribution,
      suggestions: report.suggestions,
      createdAt: report.createdAt,
    };
  },
});

export const getCategoryProposal = internalQuery({
  args: { categoryProposalId: v.id("categoryProposals") },
  returns: v.union(
    v.object({
      _id: v.id("categoryProposals"),
      auditId: v.id("audits"),
      originalStructureJson: v.string(),
      proposedStructureJson: v.string(),
      changes: v.array(
        v.object({
          type: v.union(
            v.literal("move_service"),
            v.literal("merge_categories"),
            v.literal("split_category"),
            v.literal("rename_category"),
            v.literal("reorder_categories"),
            v.literal("create_category")
          ),
          description: v.string(),
          fromCategory: v.optional(v.string()),
          toCategory: v.optional(v.string()),
          services: v.optional(v.array(v.string())),
          reason: v.string(),
        })
      ),
      status: v.union(
        v.literal("pending"),
        v.literal("accepted"),
        v.literal("modified"),
        v.literal("rejected")
      ),
      userModificationsJson: v.optional(v.string()),
      acceptedAt: v.optional(v.number()),
      createdAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const proposal = await ctx.db.get(args.categoryProposalId);
    if (!proposal) return null;
    return {
      _id: proposal._id,
      auditId: proposal.auditId,
      originalStructureJson: proposal.originalStructureJson,
      proposedStructureJson: proposal.proposedStructureJson,
      changes: proposal.changes,
      status: proposal.status,
      userModificationsJson: proposal.userModificationsJson,
      acceptedAt: proposal.acceptedAt,
      createdAt: proposal.createdAt,
    };
  },
});

// ============================================
// PUBLIC QUERIES (for UI)
// ============================================

// Get keyword report for an audit (public API)
export const getKeywordReportForAudit = query({
  args: { auditId: v.id("audits") },
  returns: v.union(
    v.object({
      _id: v.id("keywordReports"),
      auditId: v.id("audits"),
      keywords: v.array(
        v.object({
          keyword: v.string(),
          count: v.number(),
          categories: v.array(v.string()),
          services: v.array(v.string()),
        })
      ),
      categoryDistribution: v.array(
        v.object({
          categoryName: v.string(),
          keywordCount: v.number(),
          topKeywords: v.array(v.string()),
        })
      ),
      suggestions: v.array(v.string()),
      createdAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return null;

    // Get audit and verify ownership
    const audit = await ctx.db.get(args.auditId);
    if (!audit || audit.userId !== user._id) return null;

    if (!audit.keywordReportId) return null;

    const report = await ctx.db.get(audit.keywordReportId);
    if (!report) return null;

    return {
      _id: report._id,
      auditId: report.auditId,
      keywords: report.keywords,
      categoryDistribution: report.categoryDistribution,
      suggestions: report.suggestions,
      createdAt: report.createdAt,
    };
  },
});

// Get category proposal for an audit (public API)
export const getCategoryProposalForAudit = query({
  args: { auditId: v.id("audits") },
  returns: v.union(
    v.object({
      _id: v.id("categoryProposals"),
      auditId: v.id("audits"),
      originalStructureJson: v.string(),
      proposedStructureJson: v.string(),
      changes: v.array(
        v.object({
          type: v.union(
            v.literal("move_service"),
            v.literal("merge_categories"),
            v.literal("split_category"),
            v.literal("rename_category"),
            v.literal("reorder_categories"),
            v.literal("create_category")
          ),
          description: v.string(),
          fromCategory: v.optional(v.string()),
          toCategory: v.optional(v.string()),
          services: v.optional(v.array(v.string())),
          reason: v.string(),
        })
      ),
      status: v.union(
        v.literal("pending"),
        v.literal("accepted"),
        v.literal("modified"),
        v.literal("rejected")
      ),
      userModificationsJson: v.optional(v.string()),
      acceptedAt: v.optional(v.number()),
      createdAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return null;

    // Get audit and verify ownership
    const audit = await ctx.db.get(args.auditId);
    if (!audit || audit.userId !== user._id) return null;

    if (!audit.categoryProposalId) return null;

    const proposal = await ctx.db.get(audit.categoryProposalId);
    if (!proposal) return null;

    return {
      _id: proposal._id,
      auditId: proposal.auditId,
      originalStructureJson: proposal.originalStructureJson,
      proposedStructureJson: proposal.proposedStructureJson,
      changes: proposal.changes,
      status: proposal.status,
      userModificationsJson: proposal.userModificationsJson,
      acceptedAt: proposal.acceptedAt,
      createdAt: proposal.createdAt,
    };
  },
});

// ============================================
// INTERNAL MUTATIONS (used by actions)
// ============================================

export const saveKeywordReport = internalMutation({
  args: {
    auditId: v.id("audits"),
    keywords: v.array(
      v.object({
        keyword: v.string(),
        count: v.number(),
        categories: v.array(v.string()),
        services: v.array(v.string()),
      })
    ),
    categoryDistribution: v.array(
      v.object({
        categoryName: v.string(),
        keywordCount: v.number(),
        topKeywords: v.array(v.string()),
      })
    ),
    suggestions: v.array(v.string()),
  },
  returns: v.id("keywordReports"),
  handler: async (ctx, args) => {
    const reportId = await ctx.db.insert("keywordReports", {
      auditId: args.auditId,
      keywords: args.keywords,
      categoryDistribution: args.categoryDistribution,
      suggestions: args.suggestions,
      createdAt: Date.now(),
    });

    // Link to audit
    await ctx.db.patch(args.auditId, {
      keywordReportId: reportId,
    });

    return reportId;
  },
});

export const saveCategoryProposal = internalMutation({
  args: {
    auditId: v.id("audits"),
    originalStructureJson: v.string(),
    proposedStructureJson: v.string(),
    changes: v.array(
      v.object({
        type: v.union(
          v.literal("move_service"),
          v.literal("merge_categories"),
          v.literal("split_category"),
          v.literal("rename_category"),
          v.literal("reorder_categories"),
          v.literal("create_category")
        ),
        description: v.string(),
        fromCategory: v.optional(v.string()),
        toCategory: v.optional(v.string()),
        services: v.optional(v.array(v.string())),
        reason: v.string(),
      })
    ),
  },
  returns: v.id("categoryProposals"),
  handler: async (ctx, args) => {
    const proposalId = await ctx.db.insert("categoryProposals", {
      auditId: args.auditId,
      originalStructureJson: args.originalStructureJson,
      proposedStructureJson: args.proposedStructureJson,
      changes: args.changes,
      status: "pending",
      createdAt: Date.now(),
    });

    // Link to audit
    await ctx.db.patch(args.auditId, {
      categoryProposalId: proposalId,
    });

    return proposalId;
  },
});

// ============================================
// PUBLIC MUTATIONS (for UI)
// ============================================

// Update category proposal status (accept/reject/modify)
export const updateCategoryProposalStatus = mutation({
  args: {
    auditId: v.id("audits"),
    status: v.union(
      v.literal("accepted"),
      v.literal("modified"),
      v.literal("rejected")
    ),
    userModificationsJson: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return false;

    // Get audit and verify ownership
    const audit = await ctx.db.get(args.auditId);
    if (!audit || audit.userId !== user._id) return false;

    if (!audit.categoryProposalId) return false;

    // Update proposal status
    await ctx.db.patch(audit.categoryProposalId, {
      status: args.status,
      userModificationsJson: args.userModificationsJson,
      acceptedAt: args.status === "accepted" || args.status === "modified" ? Date.now() : undefined,
    });

    return true;
  },
});

// Save optimization options selected by user
export const saveOptimizationOptions = mutation({
  args: {
    auditId: v.id("audits"),
    selectedOptions: v.array(
      v.union(
        v.literal("descriptions"),
        v.literal("seo"),
        v.literal("categories"),
        v.literal("order"),
        v.literal("prices"),
        v.literal("duplicates"),
        v.literal("duration"),
        v.literal("tags")
      )
    ),
    isFullAuto: v.boolean(),
  },
  returns: v.union(v.id("optimizationOptions"), v.null()),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return null;

    // Get audit and verify ownership
    const audit = await ctx.db.get(args.auditId);
    if (!audit || audit.userId !== user._id) return null;

    // Check if optimization options already exist for this audit
    const existingOptions = await ctx.db
      .query("optimizationOptions")
      .withIndex("by_audit", (q) => q.eq("auditId", args.auditId))
      .unique();

    if (existingOptions) {
      // Update existing
      await ctx.db.patch(existingOptions._id, {
        selectedOptions: args.selectedOptions,
        isFullAuto: args.isFullAuto,
      });
      return existingOptions._id;
    }

    // Create new
    const optionsId = await ctx.db.insert("optimizationOptions", {
      auditId: args.auditId,
      selectedOptions: args.selectedOptions,
      isFullAuto: args.isFullAuto,
      createdAt: Date.now(),
    });

    // Link to audit
    await ctx.db.patch(args.auditId, {
      optimizationOptionsId: optionsId,
    });

    return optionsId;
  },
});

// Get optimization options for an audit (public API)
export const getOptimizationOptionsForAudit = query({
  args: { auditId: v.id("audits") },
  returns: v.union(
    v.object({
      _id: v.id("optimizationOptions"),
      auditId: v.id("audits"),
      selectedOptions: v.array(
        v.union(
          v.literal("descriptions"),
          v.literal("seo"),
          v.literal("categories"),
          v.literal("order"),
          v.literal("prices"),
          v.literal("duplicates"),
          v.literal("duration"),
          v.literal("tags")
        )
      ),
      isFullAuto: v.boolean(),
      createdAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // Get user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return null;

    // Get audit and verify ownership
    const audit = await ctx.db.get(args.auditId);
    if (!audit || audit.userId !== user._id) return null;

    if (!audit.optimizationOptionsId) return null;

    const options = await ctx.db.get(audit.optimizationOptionsId);
    if (!options) return null;

    return {
      _id: options._id,
      auditId: options.auditId,
      selectedOptions: options.selectedOptions,
      isFullAuto: options.isFullAuto,
      createdAt: options.createdAt,
    };
  },
});

// Internal query to get optimization options by auditId (for action use)
export const getOptimizationOptionsInternal = internalQuery({
  args: { auditId: v.id("audits") },
  returns: v.union(
    v.object({
      selectedOptions: v.array(
        v.union(
          v.literal("descriptions"),
          v.literal("seo"),
          v.literal("categories"),
          v.literal("order"),
          v.literal("prices"),
          v.literal("duplicates"),
          v.literal("duration"),
          v.literal("tags")
        )
      ),
      isFullAuto: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const audit = await ctx.db.get(args.auditId);
    if (!audit?.optimizationOptionsId) return null;

    const options = await ctx.db.get(audit.optimizationOptionsId);
    if (!options) return null;

    return {
      selectedOptions: options.selectedOptions,
      isFullAuto: options.isFullAuto,
    };
  },
});
