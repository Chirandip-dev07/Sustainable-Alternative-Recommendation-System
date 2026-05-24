import { AlertCircle, CheckCircle, AlertTriangle, Recycle, Leaf, TrendingDown } from "lucide-react";

interface PackagingAnalysisProps {
  productMetadata?: {
    barcode: string;
    name: string;
    brand: string;
    packaging: string;
    packagingMaterials: string[];
    labels: string[];
    category?: string;
    imageUrl?: string;
  };
  sustainabilityScore?: number;
}

export function PackagingAnalysis({ productMetadata, sustainabilityScore }: PackagingAnalysisProps) {
  if (!productMetadata) return null;

  const materials = productMetadata.packagingMaterials || [];
  
  // Analyze packaging materials
  const getMaterialImpact = (material: string): {
    score: number;
    color: string;
    borderColor: string;
    textColor: string;
    assessment: string;
  } => {
    const impacts: Record<string, any> = {
      Glass: {
        score: 9,
        color: "from-blue-500/20 to-blue-600/20",
        borderColor: "border-blue-500/30",
        textColor: "text-blue-600",
        assessment: "Infinitely recyclable and non-toxic. Best choice for long-term storage.",
      },
      Metal: {
        score: 8,
        color: "from-gray-500/20 to-gray-600/20",
        borderColor: "border-gray-500/30",
        textColor: "text-gray-600",
        assessment: "Highly recyclable with excellent recycling infrastructure.",
      },
      Paper: {
        score: 7,
        color: "from-amber-500/20 to-amber-600/20",
        borderColor: "border-amber-500/30",
        textColor: "text-amber-600",
        assessment: "Biodegradable and recyclable. Ensure proper recycling.",
      },
      Cardboard: {
        score: 7,
        color: "from-amber-500/20 to-amber-600/20",
        borderColor: "border-amber-500/30",
        textColor: "text-amber-600",
        assessment: "Biodegradable and recyclable. Ensure proper recycling.",
      },
      Wood: {
        score: 8,
        color: "from-emerald-500/20 to-emerald-600/20",
        borderColor: "border-emerald-500/30",
        textColor: "text-emerald-600",
        assessment: "Biodegradable and renewable when sustainably sourced.",
      },
      Plastic: {
        score: 2,
        color: "from-red-500/20 to-red-600/20",
        borderColor: "border-red-500/30",
        textColor: "text-red-600",
        assessment: "High environmental impact. Seek alternatives when possible.",
      },
      PET: {
        score: 3,
        color: "from-orange-500/20 to-orange-600/20",
        borderColor: "border-orange-500/30",
        textColor: "text-orange-600",
        assessment: "Recyclable but requires proper collection infrastructure.",
      },
      HDPE: {
        score: 3,
        color: "from-orange-500/20 to-orange-600/20",
        borderColor: "border-orange-500/30",
        textColor: "text-orange-600",
        assessment: "Recyclable but requires proper collection infrastructure.",
      },
      LDPE: {
        score: 2,
        color: "from-red-500/20 to-red-600/20",
        borderColor: "border-red-500/30",
        textColor: "text-red-600",
        assessment: "Low recyclability. Minimize usage when possible.",
      },
      Fabric: {
        score: 7,
        color: "from-purple-500/20 to-purple-600/20",
        borderColor: "border-purple-500/30",
        textColor: "text-purple-600",
        assessment: "Biodegradable if natural fibers. Check composition.",
      },
    };

    return impacts[material] || {
      score: 5,
      color: "from-gray-500/20 to-gray-600/20",
      borderColor: "border-gray-500/30",
      textColor: "text-gray-600",
      assessment: "Material impact assessment unavailable.",
    };
  };

  const hasPlastic = materials.some((m) => m.toLowerCase().includes("plastic"));
  const hasRecyclable = materials.some((m) =>
    ["glass", "metal", "paper", "cardboard"].some((r) => m.toLowerCase().includes(r))
  );

  const ecoLabels = productMetadata.labels || [];
  const hasEcoLabel = ecoLabels.length > 0;

  return (
    <div className="space-y-8">
      {/* Packaging Materials Overview */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Packaging Analysis</h2>

        {/* Product Details Card */}
        <div className="bg-card border rounded-2xl p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">Product</p>
              <p className="text-lg font-semibold">{productMetadata.name}</p>
              <p className="text-sm text-muted-foreground">{productMetadata.brand}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">Category</p>
              <p className="text-lg font-semibold">{productMetadata.category || "Unknown"}</p>
              <p className="text-sm text-muted-foreground">Barcode: {productMetadata.barcode}</p>
            </div>
          </div>
        </div>

        {/* Materials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {materials && materials.length > 0 ? (
            materials.map((material, idx) => {
              const impact = getMaterialImpact(material);
              return (
                <div
                  key={idx}
                  className={`bg-gradient-to-br ${impact.color} border ${impact.borderColor} rounded-2xl p-6`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className={`text-lg font-bold ${impact.textColor}`}>{material}</h3>
                    <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full">
                      <span className={`text-sm font-bold ${impact.textColor}`}>{impact.score}</span>
                      <span className="text-xs text-muted-foreground">/10</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{impact.assessment}</p>
                </div>
              );
            })
          ) : (
            <div className="col-span-1 md:col-span-2 bg-muted/30 border border-dashed rounded-2xl p-6 text-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Packaging materials not specified in product database</p>
            </div>
          )}
        </div>
      </div>

      {/* Environmental Indicators */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold tracking-tight">Environmental Indicators</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Recyclability */}
          <div className={`rounded-2xl p-6 border ${hasRecyclable ? "bg-emerald-500/10 border-emerald-500/30" : "bg-orange-500/10 border-orange-500/30"}`}>
            <div className="flex items-start justify-between mb-2">
              <Recycle className={`h-6 w-6 ${hasRecyclable ? "text-emerald-600" : "text-orange-600"}`} />
              {hasRecyclable && <CheckCircle className="h-5 w-5 text-emerald-600" />}
              {!hasRecyclable && <AlertTriangle className="h-5 w-5 text-orange-600" />}
            </div>
            <h4 className={`font-semibold mb-1 ${hasRecyclable ? "text-emerald-700 dark:text-emerald-400" : "text-orange-700 dark:text-orange-400"}`}>
              Recyclability
            </h4>
            <p className="text-sm text-muted-foreground">
              {hasRecyclable
                ? "This packaging can be recycled. Check local recycling guidelines."
                : "Limited recyclability. Consider eco-friendly alternatives."}
            </p>
          </div>

          {/* Plastic Content */}
          <div className={`rounded-2xl p-6 border ${hasPlastic ? "bg-red-500/10 border-red-500/30" : "bg-emerald-500/10 border-emerald-500/30"}`}>
            <div className="flex items-start justify-between mb-2">
              <TrendingDown className={`h-6 w-6 ${hasPlastic ? "text-red-600" : "text-emerald-600"}`} />
              {!hasPlastic && <CheckCircle className="h-5 w-5 text-emerald-600" />}
              {hasPlastic && <AlertCircle className="h-5 w-5 text-red-600" />}
            </div>
            <h4 className={`font-semibold mb-1 ${hasPlastic ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}>
              Plastic Content
            </h4>
            <p className="text-sm text-muted-foreground">
              {hasPlastic ? "Contains plastic - significant environmental concern." : "Plastic-free packaging!"}
            </p>
          </div>

          {/* Eco Labels */}
          <div className={`rounded-2xl p-6 border ${hasEcoLabel ? "bg-emerald-500/10 border-emerald-500/30" : "bg-gray-500/10 border-gray-500/30"}`}>
            <div className="flex items-start justify-between mb-2">
              <Leaf className={`h-6 w-6 ${hasEcoLabel ? "text-emerald-600" : "text-gray-600"}`} />
              {hasEcoLabel && <CheckCircle className="h-5 w-5 text-emerald-600" />}
            </div>
            <h4 className={`font-semibold mb-1 ${hasEcoLabel ? "text-emerald-700 dark:text-emerald-400" : "text-gray-700 dark:text-gray-400"}`}>
              Eco Certifications
            </h4>
            <p className="text-sm text-muted-foreground">
              {hasEcoLabel ? `${ecoLabels.length} certification${ecoLabels.length > 1 ? "s" : ""} found` : "No eco labels detected"}
            </p>
          </div>
        </div>

        {/* Eco Labels Details */}
        {ecoLabels.length > 0 && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6">
            <h4 className="font-semibold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
              <Leaf className="h-5 w-5" />
              Detected Certifications
            </h4>
            <div className="flex flex-wrap gap-2">
              {ecoLabels.map((label, idx) => (
                <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold tracking-tight">Recommendations</h3>

        <div className="space-y-3">
          {hasPlastic && (
            <div className="flex gap-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-700 dark:text-red-400 mb-1">Reduce Plastic Use</p>
                <p className="text-sm text-muted-foreground">This product uses plastic packaging. Consider alternatives made from glass, metal, or paper.</p>
              </div>
            </div>
          )}

          {hasRecyclable && (
            <div className="flex gap-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-700 dark:text-emerald-400 mb-1">Proper Recycling</p>
                <p className="text-sm text-muted-foreground">This packaging is recyclable. Check your local recycling program for proper disposal methods.</p>
              </div>
            </div>
          )}

          {!hasPlastic && hasRecyclable && (
            <div className="flex gap-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-700 dark:text-blue-400 mb-1">Great Choice!</p>
                <p className="text-sm text-muted-foreground">This product uses sustainable, recyclable materials. You're making an eco-friendly choice!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
