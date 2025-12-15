import {
  PricingData,
  Category,
  ServiceItem,
  CategoryConfig,
  PricelistCategoryConfig,
} from '../types';

/**
 * Tworzy domyślną konfigurację kategorii z PricingData
 */
export function createDefaultCategoryConfig(pricingData: PricingData): PricelistCategoryConfig {
  const categories: CategoryConfig[] = pricingData.categories.map((cat, index) => ({
    categoryName: cat.categoryName,
    order: index,
    originalIndex: index,
    isAggregation: false,
  }));

  return {
    categories,
    enablePromotions: false,
    enableBestsellers: false,
    aggregationMode: 'move',
  };
}

/**
 * Zlicza usługi promocyjne w PricingData
 */
export function countPromoServices(pricingData: PricingData): number {
  return pricingData.categories.reduce(
    (count, cat) => count + cat.services.filter(s => s.isPromo).length,
    0
  );
}

/**
 * Zlicza usługi z tagiem Bestseller w PricingData
 */
export function countBestsellerServices(pricingData: PricingData): number {
  return pricingData.categories.reduce(
    (count, cat) => count + cat.services.filter(s => s.tags?.includes('Bestseller')).length,
    0
  );
}

/**
 * Aplikuje konfigurację kategorii do PricingData
 * - Zmienia kolejność kategorii
 * - Zmienia nazwy kategorii
 * - Dodaje kategorie agregacyjne (Promocje/Bestsellery)
 * - Obsługuje tryb kopiuj/przenieś
 */
export function applyConfigToPricingData(
  originalData: PricingData,
  config: PricelistCategoryConfig
): PricingData {
  // Krok 1: Przygotuj kategorie z nowymi nazwami i kolejnością
  const sortedCategories = [...config.categories]
    .filter(c => !c.isAggregation)
    .sort((a, b) => a.order - b.order);

  // Krok 2: Buduj nowe kategorie
  const newCategories: Category[] = [];

  // Krok 3: Dodaj kategorie agregacyjne na początek (jeśli włączone)
  if (config.enablePromotions) {
    const promoServices: ServiceItem[] = [];

    // Zbierz usługi promocyjne z wszystkich kategorii
    originalData.categories.forEach(cat => {
      cat.services.forEach(service => {
        if (service.isPromo) {
          promoServices.push({ ...service });
        }
      });
    });

    if (promoServices.length > 0) {
      newCategories.push({
        categoryName: '🔥 Promocje',
        services: promoServices,
      });
    }
  }

  if (config.enableBestsellers) {
    const bestsellerServices: ServiceItem[] = [];

    // Zbierz usługi z tagiem Bestseller
    originalData.categories.forEach(cat => {
      cat.services.forEach(service => {
        if (service.tags?.includes('Bestseller')) {
          bestsellerServices.push({ ...service });
        }
      });
    });

    if (bestsellerServices.length > 0) {
      newCategories.push({
        categoryName: '⭐ Bestsellery',
        services: bestsellerServices,
      });
    }
  }

  // Krok 4: Dodaj zwykłe kategorie
  for (const catConfig of sortedCategories) {
    const originalCategory = originalData.categories[catConfig.originalIndex];
    if (!originalCategory) continue;

    let services = [...originalCategory.services];

    // Jeśli tryb "przenieś", usuń usługi które są w agregacjach
    if (config.aggregationMode === 'move') {
      if (config.enablePromotions) {
        services = services.filter(s => !s.isPromo);
      }
      if (config.enableBestsellers) {
        services = services.filter(s => !s.tags?.includes('Bestseller'));
      }
    }

    // Dodaj kategorię tylko jeśli ma usługi
    if (services.length > 0 || config.aggregationMode === 'copy') {
      newCategories.push({
        categoryName: catConfig.categoryName,
        services: config.aggregationMode === 'move' ? services : [...originalCategory.services],
      });
    }
  }

  // Krok 5: Zastosuj przypisania usług (jeśli są)
  if (config.serviceAssignments && config.serviceAssignments.length > 0) {
    // TODO: Implementacja przypisań usług do kategorii (post-optimization)
    // Na razie pomijamy - zostanie zaimplementowane w CategoryManager
  }

  return {
    salonName: originalData.salonName,
    categories: newCategories,
  };
}

/**
 * Generuje unikalny identyfikator usługi
 */
export function generateServiceId(categoryIndex: number, serviceIndex: number): string {
  return `${categoryIndex}_${serviceIndex}`;
}

/**
 * Parsuje identyfikator usługi
 */
export function parseServiceId(serviceId: string): { categoryIndex: number; serviceIndex: number } {
  const [catIdx, svcIdx] = serviceId.split('_').map(Number);
  return { categoryIndex: catIdx, serviceIndex: svcIdx };
}

/**
 * Znajduje usługę po identyfikatorze
 */
export function findServiceById(
  pricingData: PricingData,
  serviceId: string
): ServiceItem | null {
  const { categoryIndex, serviceIndex } = parseServiceId(serviceId);
  return pricingData.categories[categoryIndex]?.services[serviceIndex] ?? null;
}

/**
 * Waliduje konfigurację kategorii
 */
export function validateCategoryConfig(
  config: PricelistCategoryConfig,
  pricingData: PricingData
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Sprawdź czy wszystkie kategorie mają oryginalne indeksy w zakresie
  for (const cat of config.categories) {
    if (!cat.isAggregation && (cat.originalIndex < 0 || cat.originalIndex >= pricingData.categories.length)) {
      errors.push(`Nieprawidłowy indeks kategorii: ${cat.originalIndex}`);
    }
  }

  // Sprawdź duplikaty orderów
  const orders = config.categories.filter(c => !c.isAggregation).map(c => c.order);
  const uniqueOrders = new Set(orders);
  if (orders.length !== uniqueOrders.size) {
    errors.push('Duplikaty kolejności kategorii');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Serializuje konfigurację do JSON
 */
export function serializeCategoryConfig(config: PricelistCategoryConfig): string {
  return JSON.stringify(config);
}

/**
 * Deserializuje konfigurację z JSON
 */
export function deserializeCategoryConfig(json: string): PricelistCategoryConfig | null {
  try {
    const parsed = JSON.parse(json);

    // Walidacja podstawowej struktury
    if (!parsed.categories || !Array.isArray(parsed.categories)) {
      return null;
    }

    return parsed as PricelistCategoryConfig;
  } catch {
    return null;
  }
}
