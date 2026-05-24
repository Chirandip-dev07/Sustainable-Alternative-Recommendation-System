"use client";

import { useState, useEffect } from "react";
import { Clock, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('econova_history');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  const clearHistory = () => {
    localStorage.removeItem('econova_history');
    setHistory([]);
    toast.success("Scan history cleared.");
  };

  const removeSingle = (id: string | number) => {
    const updated = history.filter(item => item.id !== id);
    localStorage.setItem('econova_history', JSON.stringify(updated));
    setHistory(updated);
    toast.info("Item removed from history.");
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scan History</h1>
          <p className="text-muted-foreground">A complete log of all the products you've scanned.</p>
        </div>
        {history.length > 0 && (
          <Button variant="destructive" onClick={clearHistory}>
            <Trash2 className="mr-2 h-4 w-4" /> Clear All History
          </Button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-20 bg-card border rounded-2xl">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h2 className="text-xl font-semibold mb-2">No scans yet</h2>
          <p className="text-muted-foreground mb-6">You haven't scanned any products yet. Get started to track your impact!</p>
          <Link href="/scanner">
            <Button>Launch Scanner</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-4 font-medium">Product Name</th>
                  <th className="px-6 py-4 font-medium">Date Scanned</th>
                  <th className="px-6 py-4 font-medium text-center">Sustainability Score</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map((scan) => (
                  <tr key={scan.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 font-medium">
                      {scan.name}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {scan.date}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold bg-muted">
                        <span className={scan.score > 20 ? 'text-emerald-500' : scan.score > 10 ? 'text-orange-500' : 'text-red-500'}>
                          {scan.score}
                        </span>
                        <span className="text-muted-foreground ml-1">/ 30</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/scanner/results?id=${scan.id}`}>
                          <Button variant="outline" size="sm">
                            View <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" onClick={() => removeSingle(scan.id)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
