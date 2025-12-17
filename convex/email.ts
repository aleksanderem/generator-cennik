"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { Resend } from "resend";

// Email action for sending notifications
// Note: Requires RESEND_API_KEY environment variable to be set in Convex dashboard

export const sendOptimizationCompletedEmail = internalAction({
  args: {
    userEmail: v.string(),
    userName: v.optional(v.string()),
    pricelistName: v.string(),
    changesCount: v.number(),
    auditLink: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.warn("[Email] RESEND_API_KEY not configured - skipping email notification");
      return { success: false, error: "RESEND_API_KEY not configured" };
    }

    const resend = new Resend(apiKey);

    const firstName = args.userName?.split(" ")[0] || "Użytkowniku";
    const appUrl = process.env.APP_URL || "https://auditorai.pl";
    const auditLink = args.auditLink ? `${appUrl}${args.auditLink}` : appUrl;

    try {
      await resend.emails.send({
        from: "AuditorAI <notifications@auditorai.pl>",
        to: args.userEmail,
        subject: `Optymalizacja cennika "${args.pricelistName}" zakończona!`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f5f5f5; margin: 0; padding: 40px 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #722F37 0%, #5a252c 100%); padding: 40px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">
                  Optymalizacja zakończona!
                </h1>
              </div>

              <!-- Content -->
              <div style="padding: 40px;">
                <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                  Cześć ${firstName}!
                </p>

                <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                  Twój cennik <strong>"${args.pricelistName}"</strong> został pomyślnie zoptymalizowany.
                </p>

                <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 24px 0;">
                  <p style="color: #64748b; font-size: 14px; margin: 0 0 8px;">Wprowadzono zmian:</p>
                  <p style="color: #722F37; font-size: 32px; font-weight: 700; margin: 0;">${args.changesCount}</p>
                </div>

                <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                  Kliknij poniższy przycisk, aby zobaczyć zoptymalizowany cennik i przejrzeć wprowadzone zmiany.
                </p>

                <div style="text-align: center;">
                  <a href="${auditLink}" style="display: inline-block; background: linear-gradient(135deg, #722F37 0%, #5a252c 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                    Zobacz zoptymalizowany cennik
                  </a>
                </div>
              </div>

              <!-- Footer -->
              <div style="background: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                  AuditorAI - Inteligentny audyt cennika dla salonów beauty
                </p>
                <p style="color: #94a3b8; font-size: 12px; margin: 8px 0 0;">
                  Ta wiadomość została wysłana automatycznie.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      console.log("[Email] Optimization completed email sent to:", args.userEmail);
      return { success: true };

    } catch (error) {
      console.error("[Email] Failed to send email:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: errorMessage };
    }
  },
});

export const sendOptimizationFailedEmail = internalAction({
  args: {
    userEmail: v.string(),
    userName: v.optional(v.string()),
    pricelistName: v.string(),
    errorMessage: v.string(),
    auditLink: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.warn("[Email] RESEND_API_KEY not configured - skipping email notification");
      return { success: false, error: "RESEND_API_KEY not configured" };
    }

    const resend = new Resend(apiKey);

    const firstName = args.userName?.split(" ")[0] || "Użytkowniku";
    const appUrl = process.env.APP_URL || "https://auditorai.pl";
    const auditLink = args.auditLink ? `${appUrl}${args.auditLink}` : appUrl;

    // User-friendly error message
    const userFriendlyError = args.errorMessage.includes("overloaded")
      ? "Serwis AI jest chwilowo przeciążony. Spróbuj ponownie za kilka minut."
      : "Wystąpił nieoczekiwany błąd podczas optymalizacji.";

    try {
      await resend.emails.send({
        from: "AuditorAI <notifications@auditorai.pl>",
        to: args.userEmail,
        subject: `Błąd optymalizacji cennika "${args.pricelistName}"`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f5f5f5; margin: 0; padding: 40px 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 40px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">
                  Błąd optymalizacji
                </h1>
              </div>

              <!-- Content -->
              <div style="padding: 40px;">
                <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                  Cześć ${firstName},
                </p>

                <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                  Niestety, optymalizacja cennika <strong>"${args.pricelistName}"</strong> nie powiodła się.
                </p>

                <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 24px; margin: 24px 0;">
                  <p style="color: #991b1b; font-size: 14px; margin: 0;">${userFriendlyError}</p>
                </div>

                <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                  Możesz spróbować ponownie lub skontaktować się z nami, jeśli problem będzie się powtarzał.
                </p>

                <div style="text-align: center;">
                  <a href="${auditLink}" style="display: inline-block; background: linear-gradient(135deg, #722F37 0%, #5a252c 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                    Spróbuj ponownie
                  </a>
                </div>
              </div>

              <!-- Footer -->
              <div style="background: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                  AuditorAI - Inteligentny audyt cennika dla salonów beauty
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      console.log("[Email] Optimization failed email sent to:", args.userEmail);
      return { success: true };

    } catch (error) {
      console.error("[Email] Failed to send email:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return { success: false, error: errorMessage };
    }
  },
});
