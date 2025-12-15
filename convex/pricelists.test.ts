import { convexTest } from "convex-test";
import { expect, test, describe } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.setup";

// Sample test data
const samplePricingData = JSON.stringify({
  salonName: "Salon Beauty",
  categories: [
    {
      id: "cat1",
      categoryName: "Fryzjerstwo",
      services: [
        { id: "s1", name: "Strzyżenie damskie", price: "80 zł", duration: 45 },
        { id: "s2", name: "Strzyżenie męskie", price: "50 zł", duration: 30 },
      ],
    },
    {
      id: "cat2",
      categoryName: "Koloryzacja",
      services: [
        { id: "s3", name: "Farbowanie", price: "150 zł", duration: 90 },
      ],
    },
  ],
});

const sampleThemeConfig = JSON.stringify({
  primaryColor: "#D4A574",
  secondaryColor: "#1a1a1a",
  backgroundColor: "#FFFFFF",
  fontFamily: "Inter",
});

describe("pricelists - getUserPricelists", () => {
  test("powinien zwrócić pustą tablicę dla niezalogowanego użytkownika", async () => {
    const t = convexTest(schema, modules);

    const pricelists = await t.query(api.pricelists.getUserPricelists, {});
    expect(pricelists).toEqual([]);
  });

  test("powinien zwrócić cenniki zalogowanego użytkownika", async () => {
    const t = convexTest(schema, modules);

    // Create user
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkId: "test_clerk_pricelists",
        email: "pricelists@example.com",
        credits: 0,
        createdAt: Date.now(),
      });
    });

    // Create pricelists
    await t.run(async (ctx) => {
      await ctx.db.insert("pricelists", {
        userId,
        name: "Cennik 1",
        source: "manual",
        pricingDataJson: samplePricingData,
        createdAt: Date.now(),
      });
      await ctx.db.insert("pricelists", {
        userId,
        name: "Cennik 2",
        source: "booksy",
        pricingDataJson: samplePricingData,
        createdAt: Date.now() + 1000,
      });
    });

    const asUser = t.withIdentity({
      subject: "test_clerk_pricelists",
      issuer: "https://clerk.dev",
    });

    const pricelists = await asUser.query(api.pricelists.getUserPricelists, {});
    expect(pricelists.length).toBe(2);
    // Sorted by createdAt desc
    expect(pricelists[0].name).toBe("Cennik 2");
    expect(pricelists[1].name).toBe("Cennik 1");
  });

  test("nie powinien zwracać cenników innych użytkowników", async () => {
    const t = convexTest(schema, modules);

    // User A
    const userIdA = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkId: "user_a_pricelists",
        email: "a@example.com",
        credits: 0,
        createdAt: Date.now(),
      });
    });

    // User B
    await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkId: "user_b_pricelists",
        email: "b@example.com",
        credits: 0,
        createdAt: Date.now(),
      });
    });

    // Create pricelist for User A
    await t.run(async (ctx) => {
      await ctx.db.insert("pricelists", {
        userId: userIdA,
        name: "Cennik A",
        source: "manual",
        pricingDataJson: samplePricingData,
        createdAt: Date.now(),
      });
    });

    // User B should not see User A's pricelists
    const asUserB = t.withIdentity({
      subject: "user_b_pricelists",
      issuer: "https://clerk.dev",
    });

    const pricelists = await asUserB.query(api.pricelists.getUserPricelists, {});
    expect(pricelists.length).toBe(0);
  });
});

describe("pricelists - getPricelist", () => {
  test("powinien zwrócić null dla niezalogowanego użytkownika", async () => {
    const t = convexTest(schema, modules);

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkId: "test_get_pricelist",
        email: "get@example.com",
        credits: 0,
        createdAt: Date.now(),
      });
    });

    const pricelistId = await t.run(async (ctx) => {
      return await ctx.db.insert("pricelists", {
        userId,
        name: "Test",
        source: "manual",
        pricingDataJson: samplePricingData,
        createdAt: Date.now(),
      });
    });

    const pricelist = await t.query(api.pricelists.getPricelist, { pricelistId });
    expect(pricelist).toBeNull();
  });

  test("powinien zwrócić cennik właściciela", async () => {
    const t = convexTest(schema, modules);

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkId: "owner_pricelist",
        email: "owner@example.com",
        credits: 0,
        createdAt: Date.now(),
      });
    });

    const pricelistId = await t.run(async (ctx) => {
      return await ctx.db.insert("pricelists", {
        userId,
        name: "Mój cennik",
        source: "manual",
        pricingDataJson: samplePricingData,
        themeConfigJson: sampleThemeConfig,
        templateId: "modern",
        servicesCount: 3,
        categoriesCount: 2,
        createdAt: Date.now(),
      });
    });

    const asUser = t.withIdentity({
      subject: "owner_pricelist",
      issuer: "https://clerk.dev",
    });

    const pricelist = await asUser.query(api.pricelists.getPricelist, { pricelistId });
    expect(pricelist).not.toBeNull();
    expect(pricelist?.name).toBe("Mój cennik");
    expect(pricelist?.templateId).toBe("modern");
    expect(pricelist?.servicesCount).toBe(3);
  });

  test("powinien zwrócić null dla cudzego cennika", async () => {
    const t = convexTest(schema, modules);

    const userIdA = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkId: "user_a_get",
        email: "a.get@example.com",
        credits: 0,
        createdAt: Date.now(),
      });
    });

    await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkId: "user_b_get",
        email: "b.get@example.com",
        credits: 0,
        createdAt: Date.now(),
      });
    });

    const pricelistId = await t.run(async (ctx) => {
      return await ctx.db.insert("pricelists", {
        userId: userIdA,
        name: "Cennik A",
        source: "manual",
        pricingDataJson: samplePricingData,
        createdAt: Date.now(),
      });
    });

    const asUserB = t.withIdentity({
      subject: "user_b_get",
      issuer: "https://clerk.dev",
    });

    const pricelist = await asUserB.query(api.pricelists.getPricelist, { pricelistId });
    expect(pricelist).toBeNull();
  });
});

describe("pricelists - getPricelistPublic", () => {
  test("powinien zwrócić dane cennika bez auth", async () => {
    const t = convexTest(schema, modules);

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkId: "public_owner",
        email: "public@example.com",
        credits: 0,
        createdAt: Date.now(),
      });
    });

    const pricelistId = await t.run(async (ctx) => {
      return await ctx.db.insert("pricelists", {
        userId,
        name: "Cennik publiczny",
        source: "manual",
        pricingDataJson: samplePricingData,
        themeConfigJson: sampleThemeConfig,
        templateId: "elegant",
        createdAt: Date.now(),
      });
    });

    // Without auth
    const publicData = await t.query(api.pricelists.getPricelistPublic, { pricelistId });
    expect(publicData).not.toBeNull();
    expect(publicData?.name).toBe("Cennik publiczny");
    expect(publicData?.pricingDataJson).toBe(samplePricingData);
    expect(publicData?.templateId).toBe("elegant");
  });

  test("powinien zwrócić null dla nieistniejącego cennika", async () => {
    const t = convexTest(schema, modules);

    // Create a user just to have a valid ID format
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkId: "temp_user",
        email: "temp@example.com",
        credits: 0,
        createdAt: Date.now(),
      });
    });

    // Create and delete a pricelist to get a valid but non-existent ID
    const pricelistId = await t.run(async (ctx) => {
      const id = await ctx.db.insert("pricelists", {
        userId,
        name: "Temp",
        source: "manual",
        pricingDataJson: "{}",
        createdAt: Date.now(),
      });
      await ctx.db.delete(id);
      return id;
    });

    const publicData = await t.query(api.pricelists.getPricelistPublic, { pricelistId });
    expect(publicData).toBeNull();
  });
});

describe("pricelists - savePricelist", () => {
  test("powinien rzucić błąd dla niezalogowanego użytkownika", async () => {
    const t = convexTest(schema, modules);

    await expect(
      t.mutation(api.pricelists.savePricelist, {
        name: "Test",
        source: "manual",
        pricingDataJson: samplePricingData,
      })
    ).rejects.toThrow("Musisz być zalogowany");
  });

  test("powinien utworzyć cennik z poprawnymi statystykami", async () => {
    const t = convexTest(schema, modules);

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkId: "save_pricelist_user",
        email: "save@example.com",
        credits: 0,
        createdAt: Date.now(),
      });
    });

    const asUser = t.withIdentity({
      subject: "save_pricelist_user",
      issuer: "https://clerk.dev",
    });

    const pricelistId = await asUser.mutation(api.pricelists.savePricelist, {
      name: "Nowy cennik",
      source: "manual",
      pricingDataJson: samplePricingData,
      themeConfigJson: sampleThemeConfig,
    });

    const pricelist = await t.run(async (ctx) => {
      return await ctx.db.get(pricelistId);
    });

    expect(pricelist).not.toBeNull();
    expect(pricelist?.name).toBe("Nowy cennik");
    expect(pricelist?.source).toBe("manual");
    expect(pricelist?.servicesCount).toBe(3); // 2 + 1
    expect(pricelist?.categoriesCount).toBe(2);
    expect(pricelist?.userId).toBe(userId);
  });

  test("powinien zapisać cennik z różnymi źródłami", async () => {
    const t = convexTest(schema, modules);

    await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkId: "source_test_user",
        email: "source@example.com",
        credits: 0,
        createdAt: Date.now(),
      });
    });

    const asUser = t.withIdentity({
      subject: "source_test_user",
      issuer: "https://clerk.dev",
    });

    // Test each source type
    for (const source of ["manual", "booksy", "audit"] as const) {
      const pricelistId = await asUser.mutation(api.pricelists.savePricelist, {
        name: `Cennik ${source}`,
        source,
        pricingDataJson: samplePricingData,
      });

      const pricelist = await t.run(async (ctx) => {
        return await ctx.db.get(pricelistId);
      });

      expect(pricelist?.source).toBe(source);
    }
  });
});

describe("pricelists - updatePricelist", () => {
  test("powinien rzucić błąd dla niezalogowanego użytkownika", async () => {
    const t = convexTest(schema, modules);

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkId: "update_owner",
        email: "update@example.com",
        credits: 0,
        createdAt: Date.now(),
      });
    });

    const pricelistId = await t.run(async (ctx) => {
      return await ctx.db.insert("pricelists", {
        userId,
        name: "Test",
        source: "manual",
        pricingDataJson: samplePricingData,
        createdAt: Date.now(),
      });
    });

    await expect(
      t.mutation(api.pricelists.updatePricelist, {
        pricelistId,
        name: "Updated",
      })
    ).rejects.toThrow("Musisz być zalogowany");
  });

  test("powinien zaktualizować nazwę cennika", async () => {
    const t = convexTest(schema, modules);

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkId: "update_name_user",
        email: "updatename@example.com",
        credits: 0,
        createdAt: Date.now(),
      });
    });

    const pricelistId = await t.run(async (ctx) => {
      return await ctx.db.insert("pricelists", {
        userId,
        name: "Stara nazwa",
        source: "manual",
        pricingDataJson: samplePricingData,
        createdAt: Date.now(),
      });
    });

    const asUser = t.withIdentity({
      subject: "update_name_user",
      issuer: "https://clerk.dev",
    });

    await asUser.mutation(api.pricelists.updatePricelist, {
      pricelistId,
      name: "Nowa nazwa",
    });

    const pricelist = await t.run(async (ctx) => {
      return await ctx.db.get(pricelistId);
    });

    expect(pricelist?.name).toBe("Nowa nazwa");
    expect(pricelist?.updatedAt).toBeDefined();
  });

  test("powinien przeliczyć statystyki przy aktualizacji danych", async () => {
    const t = convexTest(schema, modules);

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkId: "update_stats_user",
        email: "updatestats@example.com",
        credits: 0,
        createdAt: Date.now(),
      });
    });

    const pricelistId = await t.run(async (ctx) => {
      return await ctx.db.insert("pricelists", {
        userId,
        name: "Test",
        source: "manual",
        pricingDataJson: samplePricingData,
        servicesCount: 3,
        categoriesCount: 2,
        createdAt: Date.now(),
      });
    });

    const asUser = t.withIdentity({
      subject: "update_stats_user",
      issuer: "https://clerk.dev",
    });

    const newPricingData = JSON.stringify({
      categories: [
        {
          id: "cat1",
          categoryName: "Jedna kategoria",
          services: [{ id: "s1", name: "Jedna usługa", price: "100 zł" }],
        },
      ],
    });

    await asUser.mutation(api.pricelists.updatePricelist, {
      pricelistId,
      pricingDataJson: newPricingData,
    });

    const pricelist = await t.run(async (ctx) => {
      return await ctx.db.get(pricelistId);
    });

    expect(pricelist?.servicesCount).toBe(1);
    expect(pricelist?.categoriesCount).toBe(1);
  });

  test("powinien rzucić błąd dla cudzego cennika", async () => {
    const t = convexTest(schema, modules);

    const userIdA = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkId: "owner_update",
        email: "owner.update@example.com",
        credits: 0,
        createdAt: Date.now(),
      });
    });

    await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkId: "intruder_update",
        email: "intruder.update@example.com",
        credits: 0,
        createdAt: Date.now(),
      });
    });

    const pricelistId = await t.run(async (ctx) => {
      return await ctx.db.insert("pricelists", {
        userId: userIdA,
        name: "Cennik A",
        source: "manual",
        pricingDataJson: samplePricingData,
        createdAt: Date.now(),
      });
    });

    const asIntruder = t.withIdentity({
      subject: "intruder_update",
      issuer: "https://clerk.dev",
    });

    await expect(
      asIntruder.mutation(api.pricelists.updatePricelist, {
        pricelistId,
        name: "Hacked",
      })
    ).rejects.toThrow("Cennik nie znaleziony");
  });
});

describe("pricelists - deletePricelist", () => {
  test("powinien rzucić błąd dla niezalogowanego użytkownika", async () => {
    const t = convexTest(schema, modules);

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkId: "delete_owner",
        email: "delete@example.com",
        credits: 0,
        createdAt: Date.now(),
      });
    });

    const pricelistId = await t.run(async (ctx) => {
      return await ctx.db.insert("pricelists", {
        userId,
        name: "To delete",
        source: "manual",
        pricingDataJson: samplePricingData,
        createdAt: Date.now(),
      });
    });

    await expect(
      t.mutation(api.pricelists.deletePricelist, { pricelistId })
    ).rejects.toThrow("Musisz być zalogowany");
  });

  test("powinien usunąć cennik właściciela", async () => {
    const t = convexTest(schema, modules);

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkId: "delete_user",
        email: "deleteuser@example.com",
        credits: 0,
        createdAt: Date.now(),
      });
    });

    const pricelistId = await t.run(async (ctx) => {
      return await ctx.db.insert("pricelists", {
        userId,
        name: "Do usunięcia",
        source: "manual",
        pricingDataJson: samplePricingData,
        createdAt: Date.now(),
      });
    });

    const asUser = t.withIdentity({
      subject: "delete_user",
      issuer: "https://clerk.dev",
    });

    // Verify exists
    let pricelist = await t.run(async (ctx) => {
      return await ctx.db.get(pricelistId);
    });
    expect(pricelist).not.toBeNull();

    // Delete
    await asUser.mutation(api.pricelists.deletePricelist, { pricelistId });

    // Verify deleted
    pricelist = await t.run(async (ctx) => {
      return await ctx.db.get(pricelistId);
    });
    expect(pricelist).toBeNull();
  });

  test("powinien rzucić błąd przy usuwaniu cudzego cennika", async () => {
    const t = convexTest(schema, modules);

    const userIdA = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkId: "owner_delete",
        email: "owner.delete@example.com",
        credits: 0,
        createdAt: Date.now(),
      });
    });

    await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkId: "intruder_delete",
        email: "intruder.delete@example.com",
        credits: 0,
        createdAt: Date.now(),
      });
    });

    const pricelistId = await t.run(async (ctx) => {
      return await ctx.db.insert("pricelists", {
        userId: userIdA,
        name: "Cennik A",
        source: "manual",
        pricingDataJson: samplePricingData,
        createdAt: Date.now(),
      });
    });

    const asIntruder = t.withIdentity({
      subject: "intruder_delete",
      issuer: "https://clerk.dev",
    });

    await expect(
      asIntruder.mutation(api.pricelists.deletePricelist, { pricelistId })
    ).rejects.toThrow("Cennik nie znaleziony");
  });
});

describe("pricelists - updatePricelistTheme", () => {
  test("powinien zaktualizować theme i template", async () => {
    const t = convexTest(schema, modules);

    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkId: "theme_user",
        email: "theme@example.com",
        credits: 0,
        createdAt: Date.now(),
      });
    });

    const pricelistId = await t.run(async (ctx) => {
      return await ctx.db.insert("pricelists", {
        userId,
        name: "Cennik",
        source: "manual",
        pricingDataJson: samplePricingData,
        templateId: "modern",
        themeConfigJson: sampleThemeConfig,
        createdAt: Date.now(),
      });
    });

    const asUser = t.withIdentity({
      subject: "theme_user",
      issuer: "https://clerk.dev",
    });

    const newTheme = JSON.stringify({
      primaryColor: "#FF0000",
      secondaryColor: "#00FF00",
    });

    await asUser.mutation(api.pricelists.updatePricelistTheme, {
      pricelistId,
      themeConfigJson: newTheme,
      templateId: "elegant",
    });

    const pricelist = await t.run(async (ctx) => {
      return await ctx.db.get(pricelistId);
    });

    expect(pricelist?.themeConfigJson).toBe(newTheme);
    expect(pricelist?.templateId).toBe("elegant");
    expect(pricelist?.updatedAt).toBeDefined();
  });

  test("powinien rzucić błąd dla cudzego cennika", async () => {
    const t = convexTest(schema, modules);

    const userIdA = await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkId: "theme_owner",
        email: "theme.owner@example.com",
        credits: 0,
        createdAt: Date.now(),
      });
    });

    await t.run(async (ctx) => {
      return await ctx.db.insert("users", {
        clerkId: "theme_intruder",
        email: "theme.intruder@example.com",
        credits: 0,
        createdAt: Date.now(),
      });
    });

    const pricelistId = await t.run(async (ctx) => {
      return await ctx.db.insert("pricelists", {
        userId: userIdA,
        name: "Cennik A",
        source: "manual",
        pricingDataJson: samplePricingData,
        createdAt: Date.now(),
      });
    });

    const asIntruder = t.withIdentity({
      subject: "theme_intruder",
      issuer: "https://clerk.dev",
    });

    await expect(
      asIntruder.mutation(api.pricelists.updatePricelistTheme, {
        pricelistId,
        themeConfigJson: "{}",
        templateId: "hacked",
      })
    ).rejects.toThrow("Cennik nie znaleziony");
  });
});
