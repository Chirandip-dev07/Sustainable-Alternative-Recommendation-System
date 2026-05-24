"use client";

import { useState, useEffect } from "react";
import { Bookmark, Trash2, ExternalLink, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";

export default function SavedPage() {
  const [saved, setSaved] = useState<any[]>([]);

  useEffect(() => {
    const data = localStorage.getItem('econova_saved_alts');
    if (data) {
      setSaved(JSON.parse(data));
    }
  }, []);

  const removeSaved = (name: string) => {
    const updated = saved.filter(item => item.name !== name);
    localStorage.setItem('econova_saved_alts', JSON.stringify(updated));
    setSaved(updated);
    toast.info("Removed from saved alternatives.");
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Saved Alternatives</h1>
          <p className="text-muted-foreground">Eco-friendly products you've bookmarked for later.</p>
        </div>
      </div>

      {saved.length === 0 ? (
        <div className="text-center py-20 bg-card border rounded-2xl">
          <Bookmark className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h2 className="text-xl font-semibold mb-2">Nothing saved yet</h2>
          <p className="text-muted-foreground mb-6">When you scan a product, you can save the recommended alternatives here.</p>
          <Link href="/scanner">
            <Button>Scan a Product</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {saved.map((item, idx) => (
            <div key={idx} className="relative bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="absolute top-4 right-4">
                <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider
                  ${item.type === 'eco' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                    item.type === 'budget' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 
                    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                  {item.type} Priority
                </span>
              </div>
              
              <h3 className="text-xl font-bold mt-4 pr-24">{item.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{item.material}</p>
              
              <div className="mt-auto space-y-4">
                <div className="p-4 bg-muted/50 rounded-xl">
                  <p className="text-sm">{item.reason}</p>
                </div>
                
                <div className="flex items-center justify-between border-t pt-4">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-emerald-500" />
                    <span className="font-bold text-lg">{item.score}/100</span>
                  </div>
                  <div className="font-semibold text-lg">{item.price}</div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                    onClick={() => removeSaved(item.name)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Remove
                  </Button>
                  <Button 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => toast.info("Shop integration coming soon!")}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" /> View Item
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
