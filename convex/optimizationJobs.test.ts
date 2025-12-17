import { convexTest } from "convex-test";
import { expect, test, describe } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.setup";

// Sample test data
const samplePricingData = JSON.stringify({
  salonName: "Salon Beauty",
  categories: [
    {
      categoryName: "Fryzjerstwo",
      services: [
        { name: "Strzyżenie damskie", price: "80 zł", duration: "45 min" },
        { name: "Strzyżenie męskie", price: "50 zł", duration: "30 min" },
      ],
    },
  ],
});

describe("optimizationJobs - startOptimization validation", () => {
  // These tests verify validation logic without triggering the scheduler

  test("powinien rzucić błąd dla niezalogowanego użytkownika", async () => {
    const t = convexTest(schema, modules);

    // Create user and pricelist
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkId: "test_start_opt",
        email: "startopt@example.com",
        credits: 0,
        createdAt: Date.now(),
      });
    });

    const pricelistId = await t.run(async (ctx) => {
      return await ctx.db.insert("pricelists", {
        userId,
        name: "Test",
        source: "manual",
        pricingDataJson: samplePricingData,
        createdAt: Date.now(),
      });
    });

    await expect(
      t.mutation(api.optimizationJobs.startOptimization, { pricelistId })
    ).rejects.toThrow("Musisz być zalogowany");
  });

  test("powinien rzucić błąd gdy job jest już w trakcie", async () => {
    const t = convexTest(schema, modules);

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkId: "dup_job_user",
        email: "dup@example.com",
        credits: 2,
        createdAt: Date.now(),
      });
    });

    const pricelistId = await t.run(async (ctx) => {
      return await ctx.db.insert("pricelists", {
        userId,
        name: "Test",
        source: "manual",
        pricingDataJson: samplePricingData,
        createdAt: Date.now(),
      });
    });

    // Create existing pending job
    await t.run(async (ctx) => {
      await ctx.db.insert("optimizationJobs", {
        userId,
        pricelistId,
        status: "pending",
        inputPricingDataJson: samplePricingData,
        createdAt: Date.now(),
      });
    });

    const asUser = t.withIdentity({
      subject: "dup_job_user",
      issuer: "https://clerk.dev",
    });

    await expect(
      asUser.mutation(api.optimizationJobs.startOptimization, { pricelistId })
    ).rejects.toThrow("Optymalizacja tego cennika jest już w toku");
  });

  test("powinien rzucić błąd dla cudzego cennika", async () => {
    const t = convexTest(schema, modules);

    const userIdA = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkId: "owner_opt",
        email: "owner.opt@example.com",
        credits: 1,
        createdAt: Date.now(),
      });
    });

    await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkId: "intruder_opt",
        email: "intruder.opt@example.com",
        credits: 1,
        createdAt: Date.now(),
      });
    });

    const pricelistId = await t.run(async (ctx) => {
      return await ctx.db.insert("pricelists", {
        userId: userIdA,
        name: "Cennik A",
        source: "manual",
        pricingDataJson: samplePricingData,
        createdAt: Date.now(),
      });
    });

    const asIntruder = t.withIdentity({
      subject: "intruder_opt",
      issuer: "https://clerk.dev",
    });

    await expect(
      asIntruder.mutation(api.optimizationJobs.startOptimization, { pricelistId })
    ).rejects.toThrow("Cennik nie znaleziony");
  });
});

describe("optimizationJobs - getJobForPricelist", () => {
  test("powinien zwrócić null dla niezalogowanego użytkownika", async () => {
    const t = convexTest(schema, modules);

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkId: "get_job_owner",
        email: "getjob@example.com",
        credits: 0,
        createdAt: Date.now(),
      });
    });

    const pricelistId = await t.run(async (ctx) => {
      return await ctx.db.insert("pricelists", {
        userId,
        name: "Test",
        source: "manual",
        pricingDataJson: samplePricingData,
        createdAt: Date.now(),
      });
    });

    const job = await t.query(api.optimizationJobs.getJobForPricelist, { pricelistId });
    expect(job).toBeNull();
  });

  test("powinien zwrócić ostatni job dla cennika", async () => {
    const t = convexTest(schema, modules);

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkId: "job_owner",
        email: "jobowner@example.com",
        credits: 0,
        createdAt: Date.now(),
      });
    });

    const pricelistId = await t.run(async (ctx) => {
      return await ctx.db.insert("pricelists", {
        userId,
        name: "Cennik",
        source: "manual",
        pricingDataJson: samplePricingData,
        createdAt: Date.now(),
      });
    });

    // Create two jobs - older and newer
    await t.run(async (ctx) => {
      await ctx.db.insert("optimizationJobs", {
        userId,
        pricelistId,
        status: "completed",
        inputPricingDataJson: samplePricingData,
        createdAt: Date.now() - 10000,
      });
      await ctx.db.insert("optimizationJobs", {
        userId,
        pricelistId,
        status: "processing",
        progress: 50,
        progressMessage: "W trakcie...",
        inputPricingDataJson: samplePricingData,
        createdAt: Date.now(),
      });
    });

    const asUser = t.withIdentity({
      subject: "job_owner",
      issuer: "https://clerk.dev",
    });

    const job = await asUser.query(api.optimizationJobs.getJobForPricelist, { pricelistId });

    expect(job).not.toBeNull();
    expect(job?.status).toBe("processing");
    expect(job?.progress).toBe(50);
  });
});

describe("optimizationJobs - getUserJobs", () => {
  test("powinien zwrócić pustą tablicę dla niezalogowanego", async () => {
    const t = convexTest(schema, modules);

    const jobs = await t.query(api.optimizationJobs.getUserJobs, {});
    expect(jobs).toEqual([]);
  });

  test("powinien zwrócić joby użytkownika posortowane desc", async () => {
    const t = convexTest(schema, modules);

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkId: "multi_job_user",
        email: "multijob@example.com",
        credits: 0,
        createdAt: Date.now(),
      });
    });

    const pricelistId = await t.run(async (ctx) => {
      return await ctx.db.insert("pricelists", {
        userId,
        name: "Test",
        source: "manual",
        pricingDataJson: samplePricingData,
        createdAt: Date.now(),
      });
    });

    await t.run(async (ctx) => {
      await ctx.db.insert("optimizationJobs", {
        userId,
        pricelistId,
        status: "completed",
        inputPricingDataJson: samplePricingData,
        createdAt: Date.now() - 10000,
      });
      await ctx.db.insert("optimizationJobs", {
        userId,
        pricelistId,
        status: "failed",
        inputPricingDataJson: samplePricingData,
        createdAt: Date.now(),
      });
    });

    const asUser = t.withIdentity({
      subject: "multi_job_user",
      issuer: "https://clerk.dev",
    });

    const jobs = await asUser.query(api.optimizationJobs.getUserJobs, {});
    expect(jobs.length).toBe(2);
    expect(jobs[0].status).toBe("failed"); // Newest first
  });

  test("powinien filtrować po statusie", async () => {
    const t = convexTest(schema, modules);

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkId: "filter_job_user",
        email: "filterjob@example.com",
        credits: 0,
        createdAt: Date.now(),
      });
    });

    const pricelistId = await t.run(async (ctx) => {
      return await ctx.db.insert("pricelists", {
        userId,
        name: "Test",
        source: "manual",
        pricingDataJson: samplePricingData,
        createdAt: Date.now(),
      });
    });

    await t.run(async (ctx) => {
      await ctx.db.insert("optimizationJobs", {
        userId,
        pricelistId,
        status: "completed",
        inputPricingDataJson: samplePricingData,
        createdAt: Date.now(),
      });
      await ctx.db.insert("optimizationJobs", {
        userId,
        pricelistId,
        status: "failed",
        inputPricingDataJson: samplePricingData,
        createdAt: Date.now(),
      });
    });

    const asUser = t.withIdentity({
      subject: "filter_job_user",
      issuer: "https://clerk.dev",
    });

    const completedJobs = await asUser.query(api.optimizationJobs.getUserJobs, {
      status: "completed",
    });
    expect(completedJobs.length).toBe(1);
    expect(completedJobs[0].status).toBe("completed");
  });
});

describe("optimizationJobs - internal mutations", () => {
  test("updateJobProgress powinien aktualizować postęp", async () => {
    const t = convexTest(schema, modules);

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkId: "progress_user",
        email: "progress@example.com",
        credits: 0,
        createdAt: Date.now(),
      });
    });

    const pricelistId = await t.run(async (ctx) => {
      return await ctx.db.insert("pricelists", {
        userId,
        name: "Test",
        source: "manual",
        pricingDataJson: samplePricingData,
        createdAt: Date.now(),
      });
    });

    const jobId = await t.run(async (ctx) => {
      return await ctx.db.insert("optimizationJobs", {
        userId,
        pricelistId,
        status: "pending",
        inputPricingDataJson: samplePricingData,
        createdAt: Date.now(),
      });
    });

    await t.mutation(internal.optimizationJobs.updateJobProgress, {
      jobId,
      status: "processing",
      progress: 50,
      progressMessage: "Optymalizuję...",
      currentStep: 3,
    });

    const job = await t.run(async (ctx) => {
      return await ctx.db.get(jobId);
    });

    expect(job?.status).toBe("processing");
    expect(job?.progress).toBe(50);
    expect(job?.progressMessage).toBe("Optymalizuję...");
    expect(job?.currentStep).toBe(3);
    expect(job?.startedAt).toBeDefined();
  });

  test("completeJob powinien oznaczyć jako completed i zaktualizować cennik", async () => {
    const t = convexTest(schema, modules);

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkId: "complete_user",
        email: "complete@example.com",
        credits: 0,
        createdAt: Date.now(),
      });
    });

    const pricelistId = await t.run(async (ctx) => {
      return await ctx.db.insert("pricelists", {
        userId,
        name: "Cennik",
        source: "manual",
        pricingDataJson: samplePricingData,
        createdAt: Date.now(),
      });
    });

    const jobId = await t.run(async (ctx) => {
      return await ctx.db.insert("optimizationJobs", {
        userId,
        pricelistId,
        status: "processing",
        totalSteps: 5,
        inputPricingDataJson: samplePricingData,
        createdAt: Date.now(),
      });
    });

    const optimizedData = JSON.stringify({
      salonName: "Salon Beauty",
      categories: [
        {
          categoryName: "Fryzjerstwo",
          services: [
            { name: "Strzyżenie damskie profesjonalne", price: "80 zł", description: "Kompleksowa usługa" },
          ],
        },
      ],
    });

    const resultJson = JSON.stringify({
      changes: [{ type: "name_improved", service: "Strzyżenie" }],
      qualityScore: 85,
    });

    await t.mutation(internal.optimizationJobs.completeJob, {
      jobId,
      outputPricingDataJson: optimizedData,
      optimizationResultJson: resultJson,
    });

    const job = await t.run(async (ctx) => {
      return await ctx.db.get(jobId);
    });

    expect(job?.status).toBe("completed");
    expect(job?.progress).toBe(100);
    expect(job?.completedAt).toBeDefined();

    // Check pricelist was updated
    const pricelist = await t.run(async (ctx) => {
      return await ctx.db.get(pricelistId);
    });

    expect(pricelist?.isOptimized).toBe(true);
    expect(pricelist?.pricingDataJson).toBe(optimizedData);
    expect(pricelist?.originalPricingDataJson).toBe(samplePricingData);

    // Check notification was created
    const notifications = await t.run(async (ctx) => {
      return await ctx.db
        .query("notifications")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
    });

    const completedNotif = notifications.find(n => n.type === "optimization_completed");
    expect(completedNotif).toBeDefined();
  });

  test("failJob powinien oznaczyć jako failed po wyczerpaniu retry", async () => {
    const t = convexTest(schema, modules);

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkId: "fail_user",
        email: "fail@example.com",
        credits: 0,
        createdAt: Date.now(),
      });
    });

    const pricelistId = await t.run(async (ctx) => {
      return await ctx.db.insert("pricelists", {
        userId,
        name: "Test",
        source: "manual",
        pricingDataJson: samplePricingData,
        createdAt: Date.now(),
      });
    });

    const jobId = await t.run(async (ctx) => {
      return await ctx.db.insert("optimizationJobs", {
        userId,
        pricelistId,
        status: "processing",
        retryCount: 2, // Already tried twice
        inputPricingDataJson: samplePricingData,
        createdAt: Date.now(),
      });
    });

    await t.mutation(internal.optimizationJobs.failJob, {
      jobId,
      errorMessage: "API overloaded",
      shouldRetry: true,
    });

    const job = await t.run(async (ctx) => {
      return await ctx.db.get(jobId);
    });

    // After 3 retries, it should be marked as failed
    expect(job?.status).toBe("failed");
    expect(job?.retryCount).toBe(3);

    // Check failure notification
    const notifications = await t.run(async (ctx) => {
      return await ctx.db
        .query("notifications")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
    });

    const failedNotif = notifications.find(n => n.type === "optimization_failed");
    expect(failedNotif).toBeDefined();
  });

  test("failJob bez shouldRetry powinien od razu oznaczyć jako failed", async () => {
    const t = convexTest(schema, modules);

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkId: "no_retry_user",
        email: "noretry@example.com",
        credits: 0,
        createdAt: Date.now(),
      });
    });

    const pricelistId = await t.run(async (ctx) => {
      return await ctx.db.insert("pricelists", {
        userId,
        name: "Test",
        source: "manual",
        pricingDataJson: samplePricingData,
        createdAt: Date.now(),
      });
    });

    const jobId = await t.run(async (ctx) => {
      return await ctx.db.insert("optimizationJobs", {
        userId,
        pricelistId,
        status: "processing",
        retryCount: 0,
        inputPricingDataJson: samplePricingData,
        createdAt: Date.now(),
      });
    });

    // When shouldRetry is false, it should fail immediately
    await t.mutation(internal.optimizationJobs.failJob, {
      jobId,
      errorMessage: "Permanent failure",
      shouldRetry: false,
    });

    const job = await t.run(async (ctx) => {
      return await ctx.db.get(jobId);
    });

    // Should be marked as failed immediately when shouldRetry=false
    expect(job?.status).toBe("failed");
    expect(job?.retryCount).toBe(1);

    // Notification should be created
    const notifications = await t.run(async (ctx) => {
      return await ctx.db
        .query("notifications")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
    });

    const failedNotif = notifications.find(n => n.type === "optimization_failed");
    expect(failedNotif).toBeDefined();
  });
});

describe("optimizationJobs - getJob", () => {
  test("powinien zwrócić null dla niezalogowanego użytkownika", async () => {
    const t = convexTest(schema, modules);

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkId: "get_single_job_owner",
        email: "singlejob@example.com",
        credits: 0,
        createdAt: Date.now(),
      });
    });

    const pricelistId = await t.run(async (ctx) => {
      return await ctx.db.insert("pricelists", {
        userId,
        name: "Test",
        source: "manual",
        pricingDataJson: samplePricingData,
        createdAt: Date.now(),
      });
    });

    const jobId = await t.run(async (ctx) => {
      return await ctx.db.insert("optimizationJobs", {
        userId,
        pricelistId,
        status: "processing",
        inputPricingDataJson: samplePricingData,
        createdAt: Date.now(),
      });
    });

    const job = await t.query(api.optimizationJobs.getJob, { jobId });
    expect(job).toBeNull();
  });

  test("powinien zwrócić job dla właściciela", async () => {
    const t = convexTest(schema, modules);

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkId: "job_getter",
        email: "jobgetter@example.com",
        credits: 0,
        createdAt: Date.now(),
      });
    });

    const pricelistId = await t.run(async (ctx) => {
      return await ctx.db.insert("pricelists", {
        userId,
        name: "Test",
        source: "manual",
        pricingDataJson: samplePricingData,
        createdAt: Date.now(),
      });
    });

    const jobId = await t.run(async (ctx) => {
      return await ctx.db.insert("optimizationJobs", {
        userId,
        pricelistId,
        status: "processing",
        progress: 75,
        progressMessage: "Prawie gotowe...",
        inputPricingDataJson: samplePricingData,
        createdAt: Date.now(),
      });
    });

    const asUser = t.withIdentity({
      subject: "job_getter",
      issuer: "https://clerk.dev",
    });

    const job = await asUser.query(api.optimizationJobs.getJob, { jobId });

    expect(job).not.toBeNull();
    expect(job?.progress).toBe(75);
    expect(job?.progressMessage).toBe("Prawie gotowe...");
  });
});
