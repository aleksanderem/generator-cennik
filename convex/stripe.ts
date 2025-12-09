"use node";

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import Stripe from "stripe";
import { Id } from "./_generated/dataModel";

// Lazy initialization - Stripe is created only when needed
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured in Convex environment variables");
  }
  return new Stripe(key, {
    apiVersion: "2025-11-17.clover",
  });
}

// Mapowanie produktów na ceny
const PRODUCTS = {
  audit: {
    priceId: process.env.STRIPE_PRICE_AUDIT!,
    credits: 1,
    amount: 4900, // 49 zł w groszach
  },
  optimize: {
    priceId: process.env.STRIPE_PRICE_OPTIMIZE!,
    credits: 1,
    amount: 2900, // 29 zł w groszach
  },
  combo: {
    priceId: process.env.STRIPE_PRICE_COMBO!,
    credits: 2, // 1 audyt + 1 optymalizacja
    amount: 6900, // 69 zł w groszach
  },
} as const;

export type ProductType = keyof typeof PRODUCTS;

// Tworzenie sesji checkout Stripe
export const createCheckoutSession = action({
  args: {
    product: v.union(
      v.literal("audit"),
      v.literal("optimize"),
      v.literal("combo")
    ),
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  returns: v.object({
    url: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    // Sprawdź czy użytkownik jest zalogowany
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Musisz być zalogowany aby dokonać zakupu");
    }

    // Pobierz użytkownika z bazy
    const user: { _id: Id<"users"> } | null = await ctx.runQuery(internal.users.getUserByClerkId, {
      clerkId: identity.subject,
    });

    if (!user) {
      throw new Error("Użytkownik nie znaleziony");
    }

    const productConfig = PRODUCTS[args.product];

    // Stwórz sesję Stripe Checkout
    const stripe = getStripe();
    const session: Stripe.Checkout.Session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "p24", "blik"],
      line_items: [
        {
          price: productConfig.priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${args.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: args.cancelUrl,
      client_reference_id: identity.subject, // clerkId
      customer_email: identity.email || undefined,
      metadata: {
        product: args.product,
        userId: user._id,
        clerkId: identity.subject,
      },
      locale: "pl",
    });

    // Zapisz pending purchase
    await ctx.runMutation(internal.purchases.createPendingPurchase, {
      userId: user._id,
      stripeSessionId: session.id,
      product: args.product,
      amount: productConfig.amount,
      currency: "pln",
    });

    return { url: session.url };
  },
});

// Weryfikacja sesji po powrocie z płatności
export const verifySession = action({
  args: {
    sessionId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    product: v.optional(
      v.union(v.literal("audit"), v.literal("optimize"), v.literal("combo"))
    ),
  }),
  handler: async (ctx, args) => {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(args.sessionId);

      if (session.payment_status === "paid") {
        return {
          success: true,
          product: session.metadata?.product as ProductType | undefined,
        };
      }

      return { success: false };
    } catch (error) {
      console.error("Error verifying session:", error);
      return { success: false };
    }
  },
});

// Obsługa webhook Stripe (wywoływana przez http.ts)
export const handleWebhook = internalAction({
  args: {
    body: v.string(),
    signature: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const stripe = getStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return { success: false, error: "STRIPE_WEBHOOK_SECRET not configured" };
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        args.body,
        args.signature,
        webhookSecret
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Webhook signature verification failed:", message);
      return { success: false, error: `Webhook Error: ${message}` };
    }

    // Obsługa eventów
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.payment_status === "paid") {
          // Zaktualizuj purchase jako completed
          const purchaseId = await ctx.runMutation(
            internal.purchases.completePurchase,
            {
              stripeSessionId: session.id,
              stripePaymentIntentId: session.payment_intent as string,
            }
          );

          if (purchaseId) {
            // Pobierz purchase żeby wiedzieć ile kredytów dodać
            const purchase: { product: ProductType; userId: Id<"users"> } | null =
              await ctx.runQuery(internal.purchases.getPurchaseBySessionId, {
                stripeSessionId: session.id,
              });

            if (purchase) {
              // Mapowanie produktu na kredyty
              const creditsMap: Record<ProductType, number> = {
                audit: 1,
                optimize: 1,
                combo: 2,
              };

              const creditsToAdd = creditsMap[purchase.product] || 1;

              // Dodaj kredyty użytkownikowi
              await ctx.runMutation(internal.users.addCredits, {
                userId: purchase.userId,
                amount: creditsToAdd,
              });

              console.log(
                `Added ${creditsToAdd} credits to user ${purchase.userId}`
              );
            }
          }
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Oznacz purchase jako failed
        await ctx.runMutation(internal.purchases.failPurchase, {
          stripeSessionId: session.id,
        });
        break;
      }

      case "payment_intent.payment_failed": {
        // Opcjonalnie: obsłuż nieudaną płatność
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("Payment failed:", paymentIntent.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { success: true };
  },
});
