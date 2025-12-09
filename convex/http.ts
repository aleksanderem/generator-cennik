import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

// Stripe Webhook endpoint
http.route({
  path: "/stripe-webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return new Response("Missing stripe-signature header", { status: 400 });
    }

    const body = await req.text();

    // Wywołaj akcję Node do weryfikacji i obsługi webhooka
    const result = await ctx.runAction(internal.stripe.handleWebhook, {
      body,
      signature,
    });

    if (!result.success) {
      return new Response(result.error || "Webhook error", { status: 400 });
    }

    return new Response("OK", { status: 200 });
  }),
});

// Clerk Webhook endpoint (dla synchronizacji użytkowników)
http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const body = await req.json() as {
      type: string;
      data: {
        id: string;
        email_addresses?: Array<{ email_address: string }>;
        first_name?: string;
        last_name?: string;
        image_url?: string;
      }
    };

    // W produkcji powinieneś weryfikować podpis Clerk
    // const svix_id = req.headers.get("svix-id");
    // const svix_timestamp = req.headers.get("svix-timestamp");
    // const svix_signature = req.headers.get("svix-signature");

    const eventType = body.type;
    const data = body.data;

    switch (eventType) {
      case "user.created":
      case "user.updated": {
        await ctx.runMutation(internal.users.upsertUser, {
          clerkId: data.id,
          email: data.email_addresses?.[0]?.email_address || "",
          name: `${data.first_name || ""} ${data.last_name || ""}`.trim() || undefined,
          avatarUrl: data.image_url || undefined,
        });
        break;
      }

      default:
        console.log(`Unhandled Clerk event: ${eventType}`);
    }

    return new Response("OK", { status: 200 });
  }),
});

export default http;
