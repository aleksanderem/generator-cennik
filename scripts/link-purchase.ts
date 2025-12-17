// Script to link a purchase to a pricelist for testing
import { ConvexHttpClient } from "convex/browser";
import { api, internal } from "../convex/_generated/api";

const client = new ConvexHttpClient(process.env.CONVEX_URL || "https://smiling-basilisk-440.convex.cloud");

async function main() {
  // Get all pricelists (internal query without auth)
  console.log("Fetching pricelists...");
  const pricelists = await client.query(api.pricelists.getUserPricelists);
  console.log("Pricelists:", JSON.stringify(pricelists, null, 2));

  // Get all purchases
  console.log("\nFetching purchases...");
  const purchases = await client.query(api.purchases.getUserPurchases);
  console.log("Purchases:", JSON.stringify(purchases, null, 2));
}

main().catch(console.error);
