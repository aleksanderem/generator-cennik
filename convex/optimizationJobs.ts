import { v } from "convex/values";
import { query, mutation, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

// Optimization job status type
type JobStatus = "pending" | "processing" | "completed" | "failed";

// Job validator for queries
const jobValidator = v.object({
  _id: v.id("optimizationJobs"),
  _creationTime: v.number(),
  userId: v.id("users"),
  pricelistId: v.id("pricelists"),
  auditId: v.optional(v.id("audits")),
  status: v.union(
    v.literal("pending"),
    v.literal("processing"),
    v.literal("completed"),
    v.literal("failed")
  ),
  progress: v.optional(v.number()),
  progressMessage: v.optional(v.string()),
  currentStep: v.optional(v.number()),
  totalSteps: v.optional(v.number()),
  errorMessage: v.optional(v.string()),
  retryCount: v.optional(v.number()),
  inputPricingDataJson: v.string(),
  auditRecommendationsJson: v.optional(v.string()),
  outputPricingDataJson: v.optional(v.string()),
  optimizationResultJson: v.optional(v.string()),
  createdAt: v.number(),
  startedAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),
});

// ============================================
// PUBLIC QUERIES
// ============================================

// Get active job for a pricelist
export const getJobForPricelist = query({
  args: { pricelistId: v.id("pricelists") },
  returns: v.union(jobValidator, v.null()),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return null;

    // Get most recent job for this pricelist
    const job = await ctx.db
      .query("optimizationJobs")
      .withIndex("by_pricelist", (q) => q.eq("pricelistId", args.pricelistId))
      .order("desc")
      .first();

    if (!job || job.userId !== user._id) return null;
    return job;
  },
});

// Get user's active/recent jobs
export const getUserJobs = query({
  args: {
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    )),
    limit: v.optional(v.number()),
  },
  returns: v.array(jobValidator),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return [];

    let query = ctx.db
      .query("optimizationJobs")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc");

    const jobs = await query.take(args.limit ?? 10);

    // Filter by status if specified
    if (args.status) {
      return jobs.filter(j => j.status === args.status);
    }
    return jobs;
  },
});

// Get job by ID
export const getJob = query({
  args: { jobId: v.id("optimizationJobs") },
  returns: v.union(jobValidator, v.null()),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return null;

    const job = await ctx.db.get(args.jobId);
    if (!job || job.userId !== user._id) return null;

    return job;
  },
});

// ============================================
// PUBLIC MUTATIONS
// ============================================

// Start optimization job (called by UI)
export const startOptimization = mutation({
  args: {
    pricelistId: v.id("pricelists"),
    auditId: v.optional(v.id("audits")),
    auditRecommendations: v.optional(v.array(v.string())),
  },
  returns: v.id("optimizationJobs"),
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

    // Get pricelist
    const pricelist = await ctx.db.get(args.pricelistId);
    if (!pricelist || pricelist.userId !== user._id) {
      throw new Error("Cennik nie znaleziony");
    }

    // Check if there's already an active job for this pricelist
    const existingJob = await ctx.db
      .query("optimizationJobs")
      .withIndex("by_pricelist", (q) => q.eq("pricelistId", args.pricelistId))
      .order("desc")
      .first();

    if (existingJob && (existingJob.status === "pending" || existingJob.status === "processing")) {
      throw new Error("Optymalizacja tego cennika jest już w toku");
    }

    // Calculate total steps (base + recommendations + final steps)
    const recommendationsCount = Math.min(args.auditRecommendations?.length ?? 0, 5);
    const totalSteps = 1 + recommendationsCount + 3; // "Analyzing..." + recommendations + optimize + verify + save

    // Create job
    const jobId = await ctx.db.insert("optimizationJobs", {
      userId: user._id,
      pricelistId: args.pricelistId,
      auditId: args.auditId,
      status: "pending",
      progress: 0,
      progressMessage: "Przygotowuję optymalizację...",
      currentStep: 0,
      totalSteps,
      inputPricingDataJson: pricelist.pricingDataJson,
      auditRecommendationsJson: args.auditRecommendations
        ? JSON.stringify(args.auditRecommendations)
        : undefined,
      createdAt: Date.now(),
    });

    // Update pricelist with job reference
    await ctx.db.patch(args.pricelistId, {
      optimizationJobId: jobId,
      optimizationStatus: "pending",
      updatedAt: Date.now(),
    });

    // Create notification
    await ctx.db.insert("notifications", {
      userId: user._id,
      type: "optimization_started",
      title: "Optymalizacja rozpoczęta",
      message: `Rozpoczęto optymalizację cennika "${pricelist.name}". Poinformujemy Cię gdy będzie gotowe.`,
      link: `/audit-results?audit=${args.auditId}`,
      relatedId: jobId,
      read: false,
      createdAt: Date.now(),
    });

    // Schedule the actual optimization action
    await ctx.scheduler.runAfter(0, internal.optimizationJobsAction.runOptimization, {
      jobId,
    });

    return jobId;
  },
});

// ============================================
// INTERNAL FUNCTIONS
// ============================================

// Internal: Update job progress
export const updateJobProgress = internalMutation({
  args: {
    jobId: v.id("optimizationJobs"),
    progress: v.optional(v.number()),
    progressMessage: v.optional(v.string()),
    currentStep: v.optional(v.number()),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    )),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = {};

    if (args.progress !== undefined) updates.progress = args.progress;
    if (args.progressMessage !== undefined) updates.progressMessage = args.progressMessage;
    if (args.currentStep !== undefined) updates.currentStep = args.currentStep;
    if (args.status !== undefined) updates.status = args.status;

    if (args.status === "processing") {
      updates.startedAt = Date.now();
    }

    await ctx.db.patch(args.jobId, updates);

    // Also update pricelist status
    const job = await ctx.db.get(args.jobId);
    if (job && args.status) {
      await ctx.db.patch(job.pricelistId, {
        optimizationStatus: args.status,
        updatedAt: Date.now(),
      });
    }

    return null;
  },
});

// Internal: Complete job with results
export const completeJob = internalMutation({
  args: {
    jobId: v.id("optimizationJobs"),
    outputPricingDataJson: v.string(),
    optimizationResultJson: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("Job not found");

    // Update job
    await ctx.db.patch(args.jobId, {
      status: "completed",
      progress: 100,
      progressMessage: "Optymalizacja zakończona!",
      currentStep: job.totalSteps,
      outputPricingDataJson: args.outputPricingDataJson,
      optimizationResultJson: args.optimizationResultJson,
      completedAt: Date.now(),
    });

    // Parse result to get stats (with safe fallback)
    let changesCount = 0;
    try {
      const result = JSON.parse(args.optimizationResultJson);
      changesCount = result.changes?.length ?? 0;
    } catch (parseError) {
      console.error("[completeJob] Failed to parse optimizationResultJson:", parseError);
      // Continue with 0 changes - the raw JSON will still be saved
    }

    // Get pricelist for name
    const pricelist = await ctx.db.get(job.pricelistId);
    const pricelistName = pricelist?.name ?? "Cennik";

    // Update pricelist with optimized data
    await ctx.db.patch(job.pricelistId, {
      pricingDataJson: args.outputPricingDataJson,
      originalPricingDataJson: job.inputPricingDataJson,
      optimizationResultJson: args.optimizationResultJson,
      isOptimized: true,
      optimizedAt: Date.now(),
      optimizationStatus: "completed",
      updatedAt: Date.now(),
    });

    // Create success notification
    await ctx.db.insert("notifications", {
      userId: job.userId,
      type: "optimization_completed",
      title: "Optymalizacja zakończona!",
      message: `Cennik został zoptymalizowany. Wprowadzono ${changesCount} zmian.`,
      link: job.auditId ? `/audit-results?audit=${job.auditId}` : undefined,
      relatedId: args.jobId,
      read: false,
      createdAt: Date.now(),
    });

    // Get user data for email
    const user = await ctx.db.get(job.userId);
    if (user?.email) {
      // Schedule email notification
      await ctx.scheduler.runAfter(0, internal.email.sendOptimizationCompletedEmail, {
        userEmail: user.email,
        userName: user.name,
        pricelistName,
        changesCount,
        auditLink: job.auditId ? `/audit-results?audit=${job.auditId}` : undefined,
      });
    }

    return null;
  },
});

// Internal: Fail job with error
export const failJob = internalMutation({
  args: {
    jobId: v.id("optimizationJobs"),
    errorMessage: v.string(),
    shouldRetry: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("Job not found");

    const retryCount = (job.retryCount ?? 0) + 1;
    const maxRetries = 3;

    // If should retry and under limit, schedule retry
    if (args.shouldRetry && retryCount < maxRetries) {
      await ctx.db.patch(args.jobId, {
        status: "pending",
        retryCount,
        errorMessage: args.errorMessage,
        progressMessage: `Próba ${retryCount + 1}/${maxRetries}...`,
      });

      // Exponential backoff: 30s, 60s, 120s
      const delayMs = 30000 * Math.pow(2, retryCount - 1);
      await ctx.scheduler.runAfter(delayMs, internal.optimizationJobsAction.runOptimization, {
        jobId: args.jobId,
      });

      return null;
    }

    // Final failure - get pricelist name for notification
    const pricelist = await ctx.db.get(job.pricelistId);
    const pricelistName = pricelist?.name ?? "Cennik";

    // Final failure
    await ctx.db.patch(args.jobId, {
      status: "failed",
      errorMessage: args.errorMessage,
      retryCount,
      progressMessage: "Optymalizacja nie powiodła się",
      completedAt: Date.now(),
    });

    // Update pricelist
    await ctx.db.patch(job.pricelistId, {
      optimizationStatus: "failed",
      updatedAt: Date.now(),
    });

    // Create failure notification
    await ctx.db.insert("notifications", {
      userId: job.userId,
      type: "optimization_failed",
      title: "Błąd optymalizacji",
      message: args.errorMessage.includes("overloaded")
        ? "Serwis AI jest chwilowo przeciążony. Spróbuj ponownie później."
        : "Wystąpił błąd podczas optymalizacji cennika. Spróbuj ponownie.",
      link: job.auditId ? `/audit-results?audit=${job.auditId}` : undefined,
      relatedId: args.jobId,
      read: false,
      createdAt: Date.now(),
    });

    // Get user data for email (only send on final failure)
    const user = await ctx.db.get(job.userId);
    if (user?.email) {
      // Schedule email notification
      await ctx.scheduler.runAfter(0, internal.email.sendOptimizationFailedEmail, {
        userEmail: user.email,
        userName: user.name,
        pricelistName,
        errorMessage: args.errorMessage,
        auditLink: job.auditId ? `/audit-results?audit=${job.auditId}` : undefined,
      });
    }

    return null;
  },
});

// Internal: Get job data for action
export const getJobInternal = internalQuery({
  args: { jobId: v.id("optimizationJobs") },
  returns: v.union(jobValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.jobId);
  },
});
