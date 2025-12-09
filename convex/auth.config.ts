// Konfiguracja autentykacji Clerk dla Convex
// Dokumentacja: https://docs.convex.dev/auth/clerk

export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
