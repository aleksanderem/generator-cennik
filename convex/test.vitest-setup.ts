/**
 * Vitest setup file for Convex tests
 *
 * Suppresses expected unhandled rejections from convex-test scheduler.
 * These occur when testing mutations that use ctx.scheduler.runAfter
 * because the scheduled actions run after the test transaction completes.
 */

// Suppress specific unhandled rejections from convex-test scheduler
process.on("unhandledRejection", (reason: unknown) => {
  if (reason instanceof Error) {
    if (
      reason.message?.includes("Write outside of transaction") &&
      reason.message?.includes("_scheduled_functions")
    ) {
      // This is expected when testing mutations that schedule actions
      // The convex-test library doesn't fully support scheduled functions
      return;
    }
  }
  // Re-throw other unhandled rejections
  throw reason;
});
