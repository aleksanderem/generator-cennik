import { v } from "convex/values";
import {
  query,
  mutation,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";

// Validator dla użytkownika
const userValidator = v.object({
  _id: v.id("users"),
  _creationTime: v.number(),
  clerkId: v.string(),
  email: v.string(),
  name: v.optional(v.string()),
  avatarUrl: v.optional(v.string()),
  createdAt: v.number(),
  stripeCustomerId: v.optional(v.string()),
  credits: v.number(),
  companyName: v.optional(v.string()),
  companyNip: v.optional(v.string()),
  companyAddress: v.optional(v.string()),
  companyCity: v.optional(v.string()),
  companyPostalCode: v.optional(v.string()),
  // Dane salonu (z Booksy)
  salonName: v.optional(v.string()),
  salonLogoUrl: v.optional(v.string()),
  salonAddress: v.optional(v.string()),
  salonCity: v.optional(v.string()),
  salonPhone: v.optional(v.string()),
  booksyProfileUrl: v.optional(v.string()),
});

// Pobierz aktualnego użytkownika na podstawie Clerk identity
export const getCurrentUser = query({
  args: {},
  returns: v.union(userValidator, v.null()),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    return user;
  },
});

// Utwórz lub zaktualizuj użytkownika (wywoływane przez webhook Clerk)
export const upsertUser = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        name: args.name,
        avatarUrl: args.avatarUrl,
      });
      return existingUser._id;
    }

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      avatarUrl: args.avatarUrl,
      createdAt: Date.now(),
      credits: 0,
    });
  },
});

// Pobierz użytkownika po clerkId (internal)
export const getUserByClerkId = internalQuery({
  args: { clerkId: v.string() },
  returns: v.union(userValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

// Dodaj kredyty użytkownikowi (po udanej płatności)
export const addCredits = internalMutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(args.userId, {
      credits: user.credits + args.amount,
    });

    return null;
  },
});

// Zużyj kredyt (przed wykonaniem audytu/optymalizacji)
export const useCredit = internalMutation({
  args: {
    userId: v.id("users"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || user.credits <= 0) {
      return false;
    }

    await ctx.db.patch(args.userId, {
      credits: user.credits - 1,
    });

    return true;
  },
});

// Sprawdź czy użytkownik ma kredyty
export const hasCredits = query({
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

    return user ? user.credits > 0 : false;
  },
});

// Zapisz stripeCustomerId dla użytkownika
export const setStripeCustomerId = internalMutation({
  args: {
    userId: v.id("users"),
    stripeCustomerId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      stripeCustomerId: args.stripeCustomerId,
    });
    return null;
  },
});

// Aktualizuj dane firmy
export const updateCompanyData = mutation({
  args: {
    companyName: v.optional(v.string()),
    companyNip: v.optional(v.string()),
    companyAddress: v.optional(v.string()),
    companyCity: v.optional(v.string()),
    companyPostalCode: v.optional(v.string()),
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

    await ctx.db.patch(user._id, {
      companyName: args.companyName,
      companyNip: args.companyNip,
      companyAddress: args.companyAddress,
      companyCity: args.companyCity,
      companyPostalCode: args.companyPostalCode,
    });

    return null;
  },
});

// Synchronizuj dane firmy ze Stripe (wywoływane przez webhook)
export const syncCompanyDataFromStripe = internalMutation({
  args: {
    userId: v.id("users"),
    companyName: v.optional(v.string()),
    companyNip: v.optional(v.string()),
    companyAddress: v.optional(v.string()),
    companyCity: v.optional(v.string()),
    companyPostalCode: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      console.error("User not found for sync:", args.userId);
      return null;
    }

    // Tylko aktualizuj jeśli mamy nowe dane i użytkownik nie ma jeszcze tych danych
    const updates: Record<string, string | undefined> = {};

    if (args.companyName && !user.companyName) {
      updates.companyName = args.companyName;
    }
    if (args.companyNip && !user.companyNip) {
      updates.companyNip = args.companyNip;
    }
    if (args.companyAddress && !user.companyAddress) {
      updates.companyAddress = args.companyAddress;
    }
    if (args.companyCity && !user.companyCity) {
      updates.companyCity = args.companyCity;
    }
    if (args.companyPostalCode && !user.companyPostalCode) {
      updates.companyPostalCode = args.companyPostalCode;
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.userId, updates);
      console.log("Synced company data from Stripe for user:", args.userId);
    }

    return null;
  },
});

// Aktualizuj dane salonu
export const updateSalonData = mutation({
  args: {
    salonName: v.optional(v.string()),
    salonLogoUrl: v.optional(v.string()),
    salonAddress: v.optional(v.string()),
    salonCity: v.optional(v.string()),
    salonPhone: v.optional(v.string()),
    booksyProfileUrl: v.optional(v.string()),
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

    await ctx.db.patch(user._id, {
      salonName: args.salonName,
      salonLogoUrl: args.salonLogoUrl,
      salonAddress: args.salonAddress,
      salonCity: args.salonCity,
      salonPhone: args.salonPhone,
      booksyProfileUrl: args.booksyProfileUrl,
    });

    return null;
  },
});

// Synchronizuj dane salonu z audytu (wywoływane po zakończeniu audytu)
export const syncSalonDataFromAudit = internalMutation({
  args: {
    userId: v.id("users"),
    salonName: v.optional(v.string()),
    salonLogoUrl: v.optional(v.string()),
    salonAddress: v.optional(v.string()),
    salonCity: v.optional(v.string()),
    salonPhone: v.optional(v.string()),
    booksyProfileUrl: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      console.error("User not found for salon sync:", args.userId);
      return null;
    }

    // Aktualizuj dane salonu z audytu (nadpisz jeśli są nowe)
    const updates: Record<string, string | undefined> = {};

    if (args.salonName) updates.salonName = args.salonName;
    if (args.salonLogoUrl) updates.salonLogoUrl = args.salonLogoUrl;
    if (args.salonAddress) updates.salonAddress = args.salonAddress;
    if (args.salonCity) updates.salonCity = args.salonCity;
    if (args.salonPhone) updates.salonPhone = args.salonPhone;
    if (args.booksyProfileUrl) updates.booksyProfileUrl = args.booksyProfileUrl;

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.userId, updates);
      console.log("Synced salon data from audit for user:", args.userId);
    }

    return null;
  },
});
