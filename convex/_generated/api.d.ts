/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auditActions from "../auditActions.js";
import type * as auditAnalysis from "../auditAnalysis.js";
import type * as auditAnalysisQueries from "../auditAnalysisQueries.js";
import type * as auditHelpers from "../auditHelpers.js";
import type * as audits from "../audits.js";
import type * as dev from "../dev.js";
import type * as email from "../email.js";
import type * as http from "../http.js";
import type * as notifications from "../notifications.js";
import type * as optimizationJobs from "../optimizationJobs.js";
import type * as optimizationJobsAction from "../optimizationJobsAction.js";
import type * as pricelists from "../pricelists.js";
import type * as purchases from "../purchases.js";
import type * as stripe from "../stripe.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auditActions: typeof auditActions;
  auditAnalysis: typeof auditAnalysis;
  auditAnalysisQueries: typeof auditAnalysisQueries;
  auditHelpers: typeof auditHelpers;
  audits: typeof audits;
  dev: typeof dev;
  email: typeof email;
  http: typeof http;
  notifications: typeof notifications;
  optimizationJobs: typeof optimizationJobs;
  optimizationJobsAction: typeof optimizationJobsAction;
  pricelists: typeof pricelists;
  purchases: typeof purchases;
  stripe: typeof stripe;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
