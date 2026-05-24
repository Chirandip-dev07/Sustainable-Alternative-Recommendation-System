"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Leaf, RefreshCcw, Factory, ChevronLeft, Award, AlertTriangle, ExternalLink, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { PackagingAnalysis } from "@/components/packaging-analysis";

const getPurchaseLinks = (productName: string) => {
  const query = new URLSearchParams({ q: productName.trim() }).toString().replace(/^q=/, "");

  return {
    amazon_link: `https://www.amazon.in/s?k=${query}`,
    flipkart_link: `https://www.flipkart.com/search?q=${query}`,
  };
};

export default function ResultsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scanHistory, setScanHistory] = useState<any>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const scanId = params.get('id');
    
    if (scanId) {
      const history = JSON.parse(localStorage.getItem('econova_history') || '[]');
      const found = history.find((h: any) => String(h.id) === scanId);
      if (found && found.fullData) {
        setData(found.fullData);
        setScanHistory(found);
        setLoading(false);
        return;
      }
    }

    // Read the dynamic data payload that was saved right after the API responded
    const storedScan = localStorage.getItem('econova_current_scan');
    
    if (storedScan) {
      const parsedData = JSON.parse(storedScan);
      setData(parsedData);
      
      // Try to get the full history entry for barcode metadata
      const history = JSON.parse(localStorage.getItem('econova_history') || '[]');
      if (history.length > 0) {
        setScanHistory(history[0]); // Most recent scan
      }
      
      setLoading(false);
    } else {
      // If someone just navigated here directly without scanning, show an error state
      setLoading(false);
    }
  }, []);

  const saveAlternative = (alt: any) => {
    const saved = JSON.parse(localStorage.getItem('econova_saved_alts') || '[]');
    // Check if already saved
    if (!saved.some((item: any) => item.name === alt.name)) {
      // Re-map the dynamic alt properties slightly if needed to match saved card format
      const altToSave = {
        name: alt.name,
        material: alt.material,
        score: alt.estimatedPriceINR ? 25 : 20, // Give it a dummy score if API didn't provide one for alternatives
        price: `₹${alt.estimatedPriceINR}`,
        reason: alt.reason,
        type: alt.alternativeType || alt.type || (alt.estimatedPriceINR < 150 ? 'budget' : alt.estimatedPriceINR < 300 ? 'balanced' : 'eco'),
        amazon_link: alt.amazon_link,
        flipkart_link: alt.flipkart_link
      };
      localStorage.setItem('econova_saved_alts', JSON.stringify([...saved, altToSave]));
      toast.success(`Saved ${alt.name} to your dashboard!`);
    } else {
      toast.info(`${alt.name} is already saved.`);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <div className="h-12 w-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
          <h2 className="text-xl font-semibold">Analyzing sustainability metrics...</h2>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-2xl font-bold tracking-tight">No Scan Data Found</h2>
          <p className="text-muted-foreground">It looks like you haven't scanned a product yet.</p>
          <Link href="/scanner">
            <Button className="mt-4">Go to Scanner</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl animate-in fade-in duration-500">
        <div className="mb-8">
          <Link href="/scanner" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Scanner
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{data.productName}</h1>
              <p className="text-lg text-muted-foreground">Category: {data.category} • Material: {data.materialType}</p>
              {data.estimatedPriceINR && (
                <p className="text-md font-medium text-emerald-600 mt-2">Est. Price: ₹{data.estimatedPriceINR}</p>
              )}
            </div>
            
            <div className="flex items-center gap-4 bg-muted/50 p-4 rounded-2xl border">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Eco Score</p>
                <div className={`text-4xl font-black ${data.sustainabilityScore > 20 ? 'text-emerald-500' : data.sustainabilityScore > 10 ? 'text-orange-500' : 'text-red-500'}`}>
                  {data.sustainabilityScore}
                  <span className="text-xl text-muted-foreground">/100</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Scores breakdown */}
          <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <RefreshCcw className="h-5 w-5 text-blue-500" /> Reusability
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Score</span>
                <span>{data.scores.r}/10</span>
              </div>
              <Progress value={(data.scores.r / 10) * 100} className="h-2" />
            </div>
          </div>

          <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Leaf className="h-5 w-5 text-emerald-500" /> Biodegradability
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Score</span>
                <span>{data.scores.b}/10</span>
              </div>
              <Progress value={(data.scores.b / 10) * 100} className="h-2" />
            </div>
          </div>

          <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Factory className="h-5 w-5 text-orange-500" /> Carbon Impact
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Score</span>
                <span>{data.scores.c}/10</span>
              </div>
              <Progress value={(data.scores.c / 10) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">Lower impact is better.</p>
            </div>
          </div>
        </div>

        {/* Alternatives Section */}
        {data.ecoAlternatives && data.ecoAlternatives.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">AI Recommended Alternatives</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {(() => {
                const order: Record<string, number> = { balanced: 0, budget: 1, eco: 2 };
                const sortedAlts = [...data.ecoAlternatives].sort((a, b) => {
                  const typeA = a.alternativeType || a.type || (a.estimatedPriceINR < 150 ? 'budget' : a.estimatedPriceINR < 300 ? 'balanced' : 'eco');
                  const typeB = b.alternativeType || b.type || (b.estimatedPriceINR < 150 ? 'budget' : b.estimatedPriceINR < 300 ? 'balanced' : 'eco');
                  return (order[typeA] ?? 0) - (order[typeB] ?? 0);
                });
                return sortedAlts.map((alt: any, idx: number) => {
                  const altType = alt.alternativeType || alt.type || (alt.estimatedPriceINR < 150 ? 'budget' : alt.estimatedPriceINR < 300 ? 'balanced' : 'eco');
                  const purchaseLinks = {
                    ...getPurchaseLinks(alt.name),
                    amazon_link: alt.amazon_link || getPurchaseLinks(alt.name).amazon_link,
                    flipkart_link: alt.flipkart_link || getPurchaseLinks(alt.name).flipkart_link,
                  };
                  return (
                  <div key={idx} className="relative bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group flex flex-col">
                  <div className="absolute top-4 right-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider
                      ${altType === 'eco' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                        altType === 'budget' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 
                        'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                      {altType} Priority
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold mt-4 pr-24">{alt.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{alt.material}</p>
                  
                  <div className="mt-auto space-y-4">
                    <div className="p-4 bg-muted/50 rounded-xl">
                      <p className="text-sm">{alt.reason}</p>
                    </div>
                    
                    <div className="flex items-center justify-between border-t pt-4">
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-emerald-500" />
                        <span className="font-bold text-lg">Eco-Match</span>
                      </div>
                      <div className="font-semibold text-lg">₹{alt.estimatedPriceINR}</div>
                    </div>

                    <div className="space-y-2 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.03] p-3">
                      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                        <ShoppingBag className="h-3.5 w-3.5" />
                        Best Price Search
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="rounded-full border-orange-400/30 bg-orange-500/10 text-orange-700 shadow-[0_0_18px_rgba(249,115,22,0.10)] transition-all duration-300 hover:border-orange-400/70 hover:bg-orange-500/20 hover:shadow-[0_0_24px_rgba(249,115,22,0.24)] dark:text-orange-300"
                        >
                          <a href={purchaseLinks.amazon_link} target="_blank" rel="noopener noreferrer">
                            Buy on Amazon
                            <ExternalLink className="ml-2 h-3.5 w-3.5" />
                          </a>
                        </Button>
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="rounded-full border-blue-400/30 bg-blue-500/10 text-blue-700 shadow-[0_0_18px_rgba(59,130,246,0.10)] transition-all duration-300 hover:border-blue-400/70 hover:bg-blue-500/20 hover:shadow-[0_0_24px_rgba(59,130,246,0.24)] dark:text-blue-300"
                        >
                          <a href={purchaseLinks.flipkart_link} target="_blank" rel="noopener noreferrer">
                            Buy on Flipkart
                            <ExternalLink className="ml-2 h-3.5 w-3.5" />
                          </a>
                        </Button>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full"
                      onClick={() => saveAlternative(alt)}
                    >
                      Save Alternative
                    </Button>
                  </div>
                </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* Packaging Analysis Section - Shown for Barcode Scans */}
        {scanHistory?.type === "barcode" && scanHistory?.fullData && (
          <div className="mt-12 pt-12 border-t">
            <PackagingAnalysis 
              productMetadata={scanHistory.fullData.productMetadata}
              sustainabilityScore={data.sustainabilityScore}
            />
          </div>
        )}

      </div>
    </main>
  );
}
