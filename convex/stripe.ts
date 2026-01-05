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
    amount: 7990, // 79,90 zł w groszach
  },
  audit_consultation: {
    priceId: process.env.STRIPE_PRICE_AUDIT_CONSULTATION!,
    credits: 1, // 1 audyt (konsultacja to osobna usługa)
    amount: 24000, // 240 zł w groszach
  },
  pricelist_optimization: {
    priceId: process.env.STRIPE_PRICE_OPTIMIZATION!,
    credits: 0, // nie daje kredytów, to jednorazowa usługa
    amount: 2990, // 29,90 zł w groszach
  },
} as const;

export type ProductType = keyof typeof PRODUCTS;

// Tworzenie sesji checkout Stripe
export const createCheckoutSession = action({
  args: {
    product: v.union(
      v.literal("audit"),
      v.literal("audit_consultation"),
      v.literal("pricelist_optimization")
    ),
    successUrl: v.string(),
    cancelUrl: v.string(),
    // Opcjonalny pricelistId dla optymalizacji cennika
    pricelistId: v.optional(v.id("pricelists")),
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

    // Pobierz lub utwórz użytkownika
    let user: {
      _id: Id<"users">;
      stripeCustomerId?: string;
      companyName?: string;
      companyNip?: string;
      companyAddress?: string;
      companyCity?: string;
      companyPostalCode?: string;
    } | null = await ctx.runQuery(internal.users.getUserByClerkId, {
      clerkId: identity.subject,
    });

    if (!user) {
      // Auto-utwórz użytkownika jeśli nie istnieje
      const userId = await ctx.runMutation(internal.users.upsertUser, {
        clerkId: identity.subject,
        email: identity.email || "",
        name: identity.name,
        avatarUrl: identity.pictureUrl,
      });
      user = { _id: userId };
    }

    const productConfig = PRODUCTS[args.product];
    const stripe = getStripe();

    // Konfiguracja checkout session
    const checkoutConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card", "p24", "blik"],
      line_items: [
        {
          price: productConfig.priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${args.successUrl}${args.successUrl.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: args.cancelUrl,
      client_reference_id: identity.subject, // clerkId
      metadata: {
        product: args.product,
        userId: user._id,
        clerkId: identity.subject,
        ...(args.pricelistId && { pricelistId: args.pricelistId }),
      },
      locale: "pl",
      // Zbierz dane do faktury podczas checkout
      billing_address_collection: "required",
      // Dodatkowe pola - NIP i nazwa firmy
      custom_fields: [
        {
          key: "company_name",
          label: { type: "custom" as const, custom: "Nazwa firmy (opcjonalnie, do faktury)" },
          type: "text" as const,
          optional: true,
        },
        {
          key: "nip",
          label: { type: "custom" as const, custom: "NIP (opcjonalnie, do faktury)" },
          type: "text" as const,
          optional: true,
        },
      ],
      // Włącz automatyczne faktury
      invoice_creation: {
        enabled: true,
        invoice_data: {
          description: args.product === "audit"
            ? "Audyt AuditorAI® profilu Booksy"
            : args.product === "audit_consultation"
              ? "Audyt AuditorAI® + Konsultacja eksperta"
              : "Optymalizacja AuditorAI® cennika",
        },
      },
    };

    // Jeśli użytkownik ma już stripeCustomerId, użyj go
    if (user.stripeCustomerId) {
      checkoutConfig.customer = user.stripeCustomerId;
      checkoutConfig.customer_update = {
        address: "auto",
        name: "auto",
      };
    } else {
      // Dla nowego klienta - pozwól Stripe utworzyć go automatycznie
      checkoutConfig.customer_email = identity.email || undefined;
      checkoutConfig.customer_creation = "always";
    }

    const session = await stripe.checkout.sessions.create(checkoutConfig);

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
      v.union(v.literal("audit"), v.literal("audit_consultation"), v.literal("pricelist_optimization"))
    ),
    pricelistId: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(args.sessionId);

      if (session.payment_status === "paid") {
        const product = session.metadata?.product as ProductType | undefined;

        // Fallback: jeśli webhook nie zadziałał, utwórz audyt tutaj
        if (product === "audit" || product === "audit_consultation") {
          const identity = await ctx.auth.getUserIdentity();
          if (identity) {
            let user = await ctx.runQuery(internal.users.getUserByClerkId, {
              clerkId: identity.subject,
            });

            // Auto-create user if not exists
            if (!user) {
              const userId = await ctx.runMutation(internal.users.upsertUser, {
                clerkId: identity.subject,
                email: identity.email || "",
                name: identity.name,
                avatarUrl: identity.pictureUrl,
              });
              user = { _id: userId } as any;
            }

            if (user) {
              // Sprawdź czy użytkownik ma już pending audit
              const hasActiveAudit = await ctx.runQuery(internal.audits.hasActiveAuditForUser, {
                userId: user._id,
              });

              if (!hasActiveAudit) {
                // Brak audytu - utwórz purchase (lub pobierz istniejący) i audyt
                const purchaseId = await ctx.runMutation(internal.purchases.createCompletedPurchase, {
                  userId: user._id,
                  stripeSessionId: args.sessionId,
                  stripePaymentIntentId: session.payment_intent as string || "unknown",
                  product: product,
                  amount: session.amount_total || 0,
                  currency: session.currency || "pln",
                });

                // Utwórz pending audit
                await ctx.runMutation(internal.audits.createPendingAudit, {
                  userId: user._id,
                  purchaseId: purchaseId,
                });

                console.log(`Fallback: Created audit for session ${args.sessionId}`);
              }
            }
          }
        }

        return {
          success: true,
          product,
          pricelistId: session.metadata?.pricelistId,
        };
      }

      return { success: false };
    } catch (error) {
      console.error("Error verifying session:", error);
      return { success: false };
    }
  },
});

// Tworzenie sesji Stripe Customer Portal (do faktur i historii płatności)
export const createCustomerPortalSession = action({
  args: {
    returnUrl: v.string(),
  },
  returns: v.object({
    url: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Musisz być zalogowany");
    }

    // Pobierz użytkownika
    const user = await ctx.runQuery(internal.users.getUserByClerkId, {
      clerkId: identity.subject,
    });

    if (!user || !user.stripeCustomerId) {
      // Brak klienta Stripe - nie było jeszcze płatności
      return { url: null };
    }

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: args.returnUrl,
    });

    return { url: session.url };
  },
});

// Pobierz faktury użytkownika ze Stripe
export const getInvoices = action({
  args: {},
  returns: v.array(
    v.object({
      id: v.string(),
      number: v.union(v.string(), v.null()),
      status: v.string(),
      amount: v.number(),
      currency: v.string(),
      created: v.number(),
      pdfUrl: v.union(v.string(), v.null()),
      hostedUrl: v.union(v.string(), v.null()),
      description: v.union(v.string(), v.null()),
    })
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user: { stripeCustomerId?: string } | null = await ctx.runQuery(internal.users.getUserByClerkId, {
      clerkId: identity.subject,
    });

    if (!user || !user.stripeCustomerId) {
      return [];
    }

    const stripe = getStripe();

    type InvoiceResult = {
      id: string;
      number: string | null;
      status: string;
      amount: number;
      currency: string;
      created: number;
      pdfUrl: string | null;
      hostedUrl: string | null;
      description: string | null;
    };

    try {
      const invoicesResponse = await stripe.invoices.list({
        customer: user.stripeCustomerId,
        limit: 50,
      });

      const result: InvoiceResult[] = invoicesResponse.data.map((inv) => ({
        id: inv.id,
        number: inv.number,
        status: inv.status || "unknown",
        amount: inv.amount_paid || inv.total || 0,
        currency: inv.currency,
        created: inv.created,
        pdfUrl: inv.invoice_pdf ?? null,
        hostedUrl: inv.hosted_invoice_url ?? null,
        description: inv.description,
      }));
      return result;
    } catch (error) {
      console.error("Error fetching invoices:", error);
      const empty: InvoiceResult[] = [];
      return empty;
    }
  },
});

// Typ zwracany przez syncStripeCustomer
type SyncStripeCustomerResult = {
  success: boolean;
  customerId?: string;
  message?: string;
};

// Synchronizuj stripeCustomerId z Stripe (znajdź klienta po emailu)
export const syncStripeCustomer = action({
  args: {},
  returns: v.object({
    success: v.boolean(),
    customerId: v.optional(v.string()),
    message: v.optional(v.string()),
  }),
  handler: async (ctx): Promise<SyncStripeCustomerResult> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { success: false, message: "Musisz być zalogowany" };
    }

    const user: { _id: Id<"users">; email?: string; stripeCustomerId?: string } | null = await ctx.runQuery(internal.users.getUserByClerkId, {
      clerkId: identity.subject,
    });

    if (!user) {
      return { success: false, message: "Użytkownik nie znaleziony" };
    }

    // Jeśli już ma stripeCustomerId, zwróć sukces
    if (user.stripeCustomerId) {
      return { success: true, customerId: user.stripeCustomerId, message: "Już zsynchronizowany" };
    }

    const stripe = getStripe();

    // Szukaj klienta po emailu
    const customers = await stripe.customers.list({
      email: identity.email || user.email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return { success: false, message: "Nie znaleziono klienta w Stripe" };
    }

    const customerId = customers.data[0].id;

    // Zapisz stripeCustomerId
    await ctx.runMutation(internal.users.setStripeCustomerId, {
      userId: user._id,
      stripeCustomerId: customerId,
    });

    return { success: true, customerId, message: "Zsynchronizowano pomyślnie" };
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
              // Dla optymalizacji cennika - połącz pricelist z purchaseId
              if (purchase.product === "pricelist_optimization" && session.metadata?.pricelistId) {
                await ctx.runMutation(internal.pricelists.linkPurchaseToPricelist, {
                  pricelistId: session.metadata.pricelistId as Id<"pricelists">,
                  purchaseId: purchaseId,
                });
                console.log(
                  `Linked pricelist ${session.metadata.pricelistId} to purchase ${purchaseId}`
                );
              } else if (purchase.product !== "pricelist_optimization") {
                // Dla audytów - utwórz audyt w statusie pending
                await ctx.runMutation(internal.audits.createPendingAudit, {
                  userId: purchase.userId,
                  purchaseId: purchaseId,
                });
              }

              // Pobierz dane z custom_fields (NIP i nazwa firmy)
              let customCompanyName: string | undefined;
              let customNip: string | undefined;

              if (session.custom_fields) {
                for (const field of session.custom_fields) {
                  if (field.key === "company_name" && field.text?.value) {
                    customCompanyName = field.text.value;
                  }
                  if (field.key === "nip" && field.text?.value) {
                    // Wyczyść NIP z myślników i spacji
                    customNip = field.text.value.replace(/[-\s]/g, "");
                  }
                }
              }

              // Pobierz dane klienta ze Stripe i zsynchronizuj do bazy
              if (session.customer) {
                const customerId = typeof session.customer === "string"
                  ? session.customer
                  : session.customer.id;

                // Zapisz stripeCustomerId jeśli jeszcze nie mamy
                await ctx.runMutation(internal.users.setStripeCustomerId, {
                  userId: purchase.userId,
                  stripeCustomerId: customerId,
                });

                try {
                  const customer = await stripe.customers.retrieve(customerId, {
                    expand: ["tax_ids"],
                  });

                  if (customer && !customer.deleted) {
                    // Wyciągnij NIP z tax_ids (jeśli nie ma z custom field)
                    let companyNip = customNip;
                    if (!companyNip && "tax_ids" in customer && customer.tax_ids?.data) {
                      const euVat = customer.tax_ids.data.find(
                        (t) => t.type === "eu_vat" && t.value?.startsWith("PL")
                      );
                      if (euVat?.value) {
                        companyNip = euVat.value.replace(/^PL/, "");
                      }
                    }

                    // Synchronizuj dane do bazy
                    await ctx.runMutation(internal.users.syncCompanyDataFromStripe, {
                      userId: purchase.userId,
                      companyName: customCompanyName || customer.name || undefined,
                      companyNip,
                      companyAddress: customer.address?.line1 || undefined,
                      companyCity: customer.address?.city || undefined,
                      companyPostalCode: customer.address?.postal_code || undefined,
                    });

                    // Zaktualizuj klienta w Stripe jeśli mamy NIP z custom field
                    if (customNip || customCompanyName) {
                      try {
                        const updateData: Stripe.CustomerUpdateParams = {
                          metadata: {},
                        };
                        if (customCompanyName) {
                          updateData.name = customCompanyName;
                        }
                        if (customNip) {
                          updateData.metadata = { nip: customNip };
                        }
                        await stripe.customers.update(customerId, updateData);

                        // Dodaj tax_id jeśli mamy NIP i jeszcze nie ma
                        if (customNip) {
                          const existingTaxIds = "tax_ids" in customer ? customer.tax_ids?.data : [];
                          const hasPolishVat = existingTaxIds?.some(
                            (t) => t.type === "eu_vat" && t.value?.startsWith("PL")
                          );
                          if (!hasPolishVat) {
                            await stripe.customers.createTaxId(customerId, {
                              type: "eu_vat",
                              value: `PL${customNip}`,
                            });
                          }
                        }
                      } catch (updateErr) {
                        console.error("Error updating customer with NIP:", updateErr);
                      }
                    }
                  }
                } catch (err) {
                  console.error("Error fetching customer data:", err);
                }
              } else if (customNip || customCompanyName) {
                // Jeśli nie ma customera, ale mamy dane z custom_fields
                await ctx.runMutation(internal.users.syncCompanyDataFromStripe, {
                  userId: purchase.userId,
                  companyName: customCompanyName,
                  companyNip: customNip,
                });
              }

              console.log(
                `Created pending audit for user ${purchase.userId}`
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
