import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://127.0.0.1:8000";

function hashStringToIndex(s: string, limit: number): number {
  if (!s) return 0;
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) % 1000000007;
  }
  return Math.abs(hash) % limit;
}

function getPurchaseLinks(productName: string) {
  const query = new URLSearchParams({ q: productName.trim() }).toString().replace(/^q=/, "");

  return {
    amazon_link: `https://www.amazon.in/s?k=${query}`,
    flipkart_link: `https://www.flipkart.com/search?q=${query}`,
  };
}

function addPurchaseLinksToAlternatives(alternatives: any[] = []) {
  return alternatives.map((alternative) => ({
    ...alternative,
    ...getPurchaseLinks(alternative.name || alternative.product_name || "eco friendly product"),
  }));
}

function getSmartMockResponse(text?: string, image?: string) {
  const templates = [
    // 0: Bottle
    {
      productName: "Generic Plastic Bottle",
      category: "Beverage Container",
      materialType: "PET Plastic",
      estimatedPriceINR: 20,
      scores: { r: 2, b: 2, c: 8 },
      ecoAlternatives: [
        { name: "Recycled Plastic Bottle", material: "RPET Plastic", estimatedPriceINR: 40, alternativeType: "budget", reason: "Affordable alternative made from recycled materials, reducing virgin plastic demand." },
        { name: "Glass Water Bottle", material: "Glass", estimatedPriceINR: 120, alternativeType: "balanced", reason: "Highly reusable, non-toxic, and infinitely recyclable at a moderate price." },
        { name: "Steel Water Bottle", material: "Stainless Steel", estimatedPriceINR: 350, alternativeType: "eco", reason: "Ultimate durability and reuse lifespan; completely eliminates single-use bottle consumption." }
      ]
    },
    // 1: Coffee Cup
    {
      productName: "Single-use Coffee Cup",
      category: "Food Service Tableware",
      materialType: "Polyethylene-coated Paper",
      estimatedPriceINR: 15,
      scores: { r: 1, b: 4, c: 6 },
      ecoAlternatives: [
        { name: "Clay Kulhad Cup", material: "Natural Clay", estimatedPriceINR: 10, alternativeType: "budget", reason: "Extremely cheap, traditional, and 100% biodegradable clay cup." },
        { name: "Ceramic Mug", material: "Ceramic", estimatedPriceINR: 100, alternativeType: "balanced", reason: "Durable, reusable thousands of times, and perfect for office/home use." },
        { name: "Stainless Steel Tumbler", material: "Stainless Steel", estimatedPriceINR: 350, alternativeType: "eco", reason: "Insulated, extremely long-lasting, and highly sustainable premium carry option." }
      ]
    },
    // 2: Shopping Bag
    {
      productName: "Plastic Shopping Bag",
      category: "Shopping Bag",
      materialType: "LDPE Plastic",
      estimatedPriceINR: 5,
      scores: { r: 1, b: 1, c: 7 },
      ecoAlternatives: [
        { name: "Recycled Paper Bag", material: "Recycled Kraft Paper", estimatedPriceINR: 10, alternativeType: "budget", reason: "Very cheap, biodegradable, and made from 100% recycled paper fibers." },
        { name: "Jute Shopping Bag", material: "Jute Fiber", estimatedPriceINR: 80, alternativeType: "balanced", reason: "Strong, natural plant fiber, reusable for years, and highly biodegradable." },
        { name: "Cotton Canvas Tote Bag", material: "Cotton Canvas", estimatedPriceINR: 150, alternativeType: "eco", reason: "Washable, aesthetic, premium durability, and reusable for a lifetime." }
      ]
    },
    // 3: Toothbrush
    {
      productName: "Plastic Toothbrush",
      category: "Personal Care",
      materialType: "Nylon and Polypropylene",
      estimatedPriceINR: 45,
      scores: { r: 1, b: 0, c: 6 },
      ecoAlternatives: [
        { name: "Bamboo Toothbrush", material: "Organic Bamboo", estimatedPriceINR: 60, alternativeType: "budget", reason: "Affordable, biodegradable organic bamboo body with charcoal bristles." },
        { name: "Neem Wood Toothbrush", material: "Neem Wood", estimatedPriceINR: 110, alternativeType: "balanced", reason: "Made from anti-bacterial neem wood, fully compostable and eco-friendly." },
        { name: "Reusable Replaceable Head Toothbrush", material: "Bio-plastic and Bamboo", estimatedPriceINR: 250, alternativeType: "eco", reason: "Premium reusable handle where only the bamboo bristle head is replaced, minimizing waste." }
      ]
    },
    // 4: Cutlery
    {
      productName: "Disposable Plastic Cutlery",
      category: "Tableware",
      materialType: "Polystyrene Plastic",
      estimatedPriceINR: 5,
      scores: { r: 1, b: 1, c: 8 },
      ecoAlternatives: [
        { name: "Birchwood Disposable Spoon", material: "Birch Wood", estimatedPriceINR: 10, alternativeType: "budget", reason: "Compostable, chemical-free, and breaks down naturally in weeks." },
        { name: "Reusable Bamboo Spoon", material: "Natural Bamboo", estimatedPriceINR: 45, alternativeType: "balanced", reason: "Reusable, lightweight, biodegradable, and highly portable." },
        { name: "Stainless Steel Spoon Set", material: "Stainless Steel", estimatedPriceINR: 180, alternativeType: "eco", reason: "Dishwasher-safe, infinitely reusable, and extremely durable premium alternative." }
      ]
    }
  ];

  let selectedTemplate = templates[0];

  if (text) {
    const textLower = text.toLowerCase();
    let idx = 0;
    let custom = false;
    
    if (textLower.includes("bottle") || textLower.includes("coke") || textLower.includes("pepsi") || textLower.includes("soda") || textLower.includes("drink") || textLower.includes("water")) {
      idx = 0;
    } else if (textLower.includes("cup") || textLower.includes("glass") || textLower.includes("mug") || textLower.includes("tea") || textLower.includes("coffee")) {
      idx = 1;
    } else if (textLower.includes("bag") || textLower.includes("shopping") || textLower.includes("polythene") || textLower.includes("plastic bag")) {
      idx = 2;
    } else if (textLower.includes("toothbrush") || textLower.includes("brush") || textLower.includes("colgate")) {
      idx = 3;
    } else if (textLower.includes("spoon") || textLower.includes("fork") || textLower.includes("knife") || textLower.includes("cutlery") || textLower.includes("plate") || textLower.includes("bowl")) {
      idx = 4;
    } else {
      custom = true;
    }

    if (custom) {
      const productName = text.replace(/\b\w/g, c => c.toUpperCase());
      return {
        data: {
          productName,
          category: "General Goods",
          materialType: "Mixed Synthetics",
          estimatedPriceINR: 100,
          scores: { r: 4, b: 2, c: 5 },
          sustainabilityScore: 11,
          ecoAlternatives: addPurchaseLinksToAlternatives([
            { name: `Recycled ${productName}`, material: "Recycled / Organic Materials", estimatedPriceINR: 80, alternativeType: "budget", reason: "Affordable alternative made using sustainable, carbon-neutral manufacturing processes." },
            { name: `Eco-friendly ${productName}`, material: "Recycled / Organic Materials", estimatedPriceINR: 150, alternativeType: "balanced", reason: "Balanced alternative offering high sustainability at a moderate price." },
            { name: `Premium Organic ${productName}`, material: "Organic / Premium Restored", estimatedPriceINR: 350, alternativeType: "eco", reason: "Premium eco option focusing on maximum longevity and biological breakdown." }
          ])
        }
      };
    } else {
      selectedTemplate = { ...templates[idx] };
      const baseName = text.replace(/\b\w/g, c => c.toUpperCase());
      if (idx === 0 && !baseName.toLowerCase().includes("bottle")) {
        selectedTemplate.productName = baseName + " Bottle";
      } else if (idx === 1 && !baseName.toLowerCase().includes("cup")) {
        selectedTemplate.productName = baseName + " Cup";
      } else if (idx === 2 && !baseName.toLowerCase().includes("bag")) {
        selectedTemplate.productName = baseName + " Bag";
      } else {
        selectedTemplate.productName = baseName;
      }
    }
  } else if (image) {
    const idx = hashStringToIndex(image, templates.length);
    selectedTemplate = templates[idx];
  }

  return {
    data: {
      ...selectedTemplate,
      ecoAlternatives: addPurchaseLinksToAlternatives(selectedTemplate.ecoAlternatives),
      sustainabilityScore: selectedTemplate.scores.r + selectedTemplate.scores.b + (10 - selectedTemplate.scores.c)
    }
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image, text } = body;

    console.log("------------------- API SCAN REQUEST -------------------");
    console.log("PYTHON_BACKEND_URL:", PYTHON_BACKEND_URL);
    console.log("Text parameter:", text);
    console.log("Image parameter length:", image ? image.length : "undefined/null");
    if (image) {
      console.log("Image start:", image.substring(0, 100));
    }

    if (!image && !text) {
      return NextResponse.json({ error: "Image or text is required" }, { status: 400 });
    }

    try {
      // Call Python Backend API
      const response = await fetch(`${PYTHON_BACKEND_URL}/scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image, text }),
      });

      if (!response.ok) {
         throw new Error(`Python backend returned ${response.status}`);
      }

      const aiData = await response.json();
      
      const sustainabilityScore = aiData.reusabilityScore + aiData.biodegradabilityScore + (10 - aiData.carbonImpactScore);
      
      // Try to save to DB, but don't fail if the DB isn't fully migrated yet
      try {
        let category = await prisma.category.findUnique({ where: { name: aiData.category } });
        if (!category) {
          category = await prisma.category.create({ data: { name: aiData.category } });
        }
        const product = await prisma.product.create({
          data: {
            name: aiData.productName,
            materialType: aiData.materialType,
            reusabilityScore: aiData.reusabilityScore,
            biodegradability: aiData.biodegradabilityScore,
            carbonImpact: aiData.carbonImpactScore,
            sustainabilityScore,
            categoryId: category.id,
          }
        });
        await prisma.scanHistory.create({
          data: {
            productId: product.id,
            userId: "clmockuserid1234567890",
            calculatedScore: sustainabilityScore,
            rawAiResponse: JSON.stringify(aiData)
          }
        });
      } catch (dbError) {
        console.warn("Notice: Database save skipped (database might not be fully migrated yet).");
      }

      // Return the real AI data to the frontend!
      return NextResponse.json({ 
        scanId: "real-scan-id-" + Date.now(), 
        data: {
          productName: aiData.productName,
          category: aiData.category,
          materialType: aiData.materialType,
          estimatedPriceINR: aiData.estimatedPriceINR,
          scores: { r: aiData.reusabilityScore, b: aiData.biodegradabilityScore, c: aiData.carbonImpactScore },
          sustainabilityScore: sustainabilityScore,
          ecoAlternatives: addPurchaseLinksToAlternatives(aiData.ecoAlternatives)
        } 
      });

    } catch (apiError: any) {
      // SMART FALLBACK: If Python API fails, fallback safely!
      console.error("Python API failed. Falling back to Mock Data.");
      console.error(apiError.message);
      
      const smartMock = getSmartMockResponse(text, image);
      return NextResponse.json({
        scanId: "mock-scan-id-" + Date.now(),
        data: smartMock.data,
        error: apiError.message // Passing this down so we can debug on frontend if needed
      });
    }

  } catch (error: any) {
    console.error("Critical Scanning Error:", error);
    return NextResponse.json(
      { error: "Failed to process scan. " + error.message },
      { status: 500 }
    );
  }
}
