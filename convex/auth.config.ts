// Konfiguracja autentykacji Clerk dla Convex
// Dokumentacja: https://docs.convex.dev/auth/clerk

// WAŻNE: W Clerk Dashboard -> JWT Templates -> utwórz template "Convex"
// Skopiuj Issuer URL i ustaw jako CLERK_JWT_ISSUER_DOMAIN w Convex Dashboard

export default {
  providers: [
    {
      // Issuer URL z Clerk JWT Template (lub fallback na Frontend API)
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN || "https://settling-sloth-35.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};
