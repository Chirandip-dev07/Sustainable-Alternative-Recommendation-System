/**
 * OpenFoodFacts API Integration Service
 * Fetches product metadata from OpenFoodFacts database
 */

export interface OpenFoodFactsProduct {
  code: string;
  product_name?: string;
  packaging?: string;
  packaging_text?: string;
  brands?: string;
  categories?: string;
  labels?: string;
  ingredients_text?: string;
  nutriscore_grade?: string;
  eco_score?: string;
  image_url?: string;
}

export interface ProductMetadata {
  barcode: string;
  name: string;
  brand: string;
  category: string;
  packaging: string;
  packagingMaterials: string[];
  labels: string[];
  imageUrl: string;
  ecoScore: string | null;
}

/**
 * Fetch product data from OpenFoodFacts API
 */
export async function fetchOpenFoodFactsProduct(
  barcode: string
): Promise<OpenFoodFactsProduct | null> {
  try {
    // Use OpenFoodFacts REST API
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
    );

    if (!response.ok) {
      console.warn(`OpenFoodFacts API returned ${response.status} for barcode ${barcode}`);
      return null;
    }

    const data = await response.json();

    // Check if product was found (status code in response)
    if (data.status === 0 || !data.product) {
      console.warn(`Product not found in OpenFoodFacts for barcode ${barcode}`);
      return null;
    }

    return data.product;
  } catch (error) {
    console.error("Error fetching from OpenFoodFacts:", error);
    return null;
  }
}

/**
 * Extract packaging materials from product data
 */
function extractPackagingMaterials(product: OpenFoodFactsProduct): string[] {
  const materials: string[] = [];

  // Try to extract from packaging_text
  if (product.packaging_text) {
    const packText = product.packaging_text.toLowerCase();

    if (packText.includes("plastic")) {
      materials.push("Plastic");
      if (packText.includes("pet") || packText.includes("polyester")) materials.push("PET");
      if (packText.includes("hdpe")) materials.push("HDPE");
      if (packText.includes("ldpe")) materials.push("LDPE");
    }
    if (packText.includes("glass")) materials.push("Glass");
    if (packText.includes("metal") || packText.includes("aluminum") || packText.includes("steel")) {
      materials.push("Metal");
    }
    if (packText.includes("paper") || packText.includes("cardboard")) {
      materials.push("Paper");
    }
    if (packText.includes("wood")) materials.push("Wood");
    if (packText.includes("cloth") || packText.includes("fabric")) materials.push("Fabric");
  }

  // Try to extract from categories
  if (product.categories) {
    const catText = product.categories.toLowerCase();
    if (catText.includes("bottle")) materials.push("Bottle");
    if (catText.includes("can")) materials.push("Can");
    if (catText.includes("bag")) materials.push("Bag");
    if (catText.includes("box")) materials.push("Box");
  }

  return Array.from(new Set(materials)); // Remove duplicates
}

/**
 * Extract eco labels from product data
 */
function extractLabels(product: OpenFoodFactsProduct): string[] {
  const labels: string[] = [];

  if (product.labels) {
    const labelText = product.labels.toLowerCase();

    if (labelText.includes("organic")) labels.push("Organic");
    if (labelText.includes("fair trade") || labelText.includes("fairtrade"))
      labels.push("Fair Trade");
    if (labelText.includes("recycled")) labels.push("Recycled");
    if (labelText.includes("recyclable")) labels.push("Recyclable");
    if (labelText.includes("biodegradable")) labels.push("Biodegradable");
    if (labelText.includes("compostable")) labels.push("Compostable");
    if (labelText.includes("vegan")) labels.push("Vegan");
    if (labelText.includes("eco") || labelText.includes("environmental")) labels.push("Eco-Certified");
  }

  if (product.eco_score) {
    labels.push(`Eco-Score: ${product.eco_score.toUpperCase()}`);
  }

  return Array.from(new Set(labels)); // Remove duplicates
}

/**
 * Transform OpenFoodFacts product to our metadata format
 */
export function transformProductMetadata(
  product: OpenFoodFactsProduct
): ProductMetadata {
  return {
    barcode: product.code || "",
    name: product.product_name || "Unknown Product",
    brand: product.brands || "Unknown Brand",
    category: product.categories || "Unknown Category",
    packaging: product.packaging || "Not specified",
    packagingMaterials: extractPackagingMaterials(product),
    labels: extractLabels(product),
    imageUrl: product.image_url || "",
    ecoScore: product.eco_score || null,
  };
}

/**
 * Analyze packaging sustainability based on materials
 */
export function analyzePackagingSustainability(materials: string[]): {
  score: number; // 0-10
  assessment: string;
  concerns: string[];
  recommendations: string[];
} {
  let score = 5; // Default middle score
  const concerns: string[] = [];
  const recommendations: string[] = [];

  const materialScores: { [key: string]: number } = {
    Glass: 9,
    Metal: 8,
    Paper: 7,
    Cardboard: 7,
    Wood: 8,
    Fabric: 7,
    Plastic: 2,
    PET: 3,
    HDPE: 3,
    LDPE: 2,
  };

  if (materials.length === 0) {
    return {
      score: 5,
      assessment: "Packaging material unknown - unable to assess",
      concerns: ["Material composition not specified"],
      recommendations: ["Contact manufacturer for packaging details"],
    };
  }

  // Calculate average score from materials
  let totalScore = 0;
  materials.forEach((material) => {
    totalScore += materialScores[material] || 5;
  });
  score = Math.round(totalScore / materials.length);

  // Generate assessment and recommendations
  const hasPlastic = materials.some((m) => m.includes("Plastic"));
  const hasGlass = materials.includes("Glass");
  const hasMetal = materials.includes("Metal");
  const hasPaper = materials.includes("Paper") || materials.includes("Cardboard");

  if (hasPlastic) {
    concerns.push("Plastic packaging has significant environmental impact");
    recommendations.push("Consider switching to glass or metal alternatives");
    recommendations.push("Ensure plastic is properly recycled");
  }

  if (hasGlass) {
    recommendations.push("Glass is infinitely recyclable - recycle responsibly");
  }

  if (hasMetal) {
    recommendations.push("Metal is highly recyclable - collect for recycling");
  }

  if (hasPaper) {
    recommendations.push("Ensure paper packaging goes to paper recycling");
  }

  let assessment = "";
  if (score >= 8) {
    assessment = "Excellent - Highly sustainable packaging";
  } else if (score >= 6) {
    assessment = "Good - Reasonably sustainable packaging";
  } else if (score >= 4) {
    assessment = "Moderate - Some environmental concerns";
  } else {
    assessment = "Poor - Significant environmental impact";
  }

  return {
    score,
    assessment,
    concerns,
    recommendations,
  };
}

/**
 * Validate barcode format (UPC, EAN, etc.)
 */
export function isValidBarcode(barcode: string): boolean {
  // Remove any non-digit characters
  const cleaned = barcode.replace(/\D/g, "");

  // Valid barcode lengths: UPC-A (12), EAN-13 (13), UPC-E (8), EAN-8 (8)
  const validLengths = [8, 12, 13];
  return validLengths.includes(cleaned.length);
}

/**
 * Format barcode for API calls
 */
export function formatBarcodeForAPI(barcode: string): string {
  // Remove any non-digit characters
  return barcode.replace(/\D/g, "");
}
