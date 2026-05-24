"use client";

import { useState, useEffect } from "react";
import { Leaf, ScanLine, Bookmark, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function DashboardPage() {
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [savedAltsCount, setSavedAltsCount] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('econova_history');
    if (saved) {
      setRecentScans(JSON.parse(saved));
    }
    const savedAlts = localStorage.getItem('econova_saved_alts');
    if (savedAlts) {
      setSavedAltsCount(JSON.parse(savedAlts).length);
    }
  }, []);

  const clearHistory = () => {
    localStorage.removeItem('econova_history');
    setRecentScans([]);
    toast.success("History cleared!");
  };

  const avgEcoScore = recentScans.length > 0
    ? (recentScans.reduce((acc, curr) => acc + (curr.score || 0), 0) / recentScans.length).toFixed(1)
    : "0.0";

  const carbonOffset = (recentScans.length * 0.4 + savedAltsCount * 1.5).toFixed(1);

  const stats = [
    { name: "Total Scans", value: recentScans.length.toString(), icon: ScanLine, color: "text-blue-500", bg: "bg-blue-500/10" },
    { name: "Avg. Eco Score", value: avgEcoScore, icon: Leaf, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { name: "Saved Alternatives", value: savedAltsCount.toString(), icon: Bookmark, color: "text-purple-500", bg: "bg-purple-500/10" },
    { name: "Carbon Offset (kg)", value: carbonOffset, icon: TrendingUp, color: "text-orange-500", bg: "bg-orange-500/10" },
  ];

  // Prepare chart data (reverse array so oldest is on the left)
  const chartData = {
    labels: [...recentScans].reverse().map((scan) => scan.name),
    datasets: [
      {
        label: 'Eco Score',
        data: [...recentScans].reverse().map((scan) => scan.score),
        borderColor: 'rgb(16, 185, 129)', // emerald-500
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgb(16, 185, 129)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 14 },
        bodyFont: { size: 14 },
        displayColors: false,
        callbacks: {
          label: function(context: any) {
            return `Score: ${context.parsed.y}/100`;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
        },
        ticks: {
          color: 'rgba(156, 163, 175, 0.8)',
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgba(156, 163, 175, 0.8)',
          maxRotation: 45,
          minRotation: 0,
        }
      }
    },
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground">Track your sustainability journey and eco-impact.</p>
        </div>
        <Link href="/scanner">
          <Button className="rounded-full">
            <ScanLine className="mr-2 h-4 w-4" />
            New Scan
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="p-6 bg-card border rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-card border rounded-2xl p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-lg font-bold">Eco Score History</h3>
            <p className="text-sm text-muted-foreground">Your scanning average over the last 30 days.</p>
          </div>
          <div className="h-[300px] w-full mt-4">
            {recentScans.length > 0 ? (
              <Line data={chartData} options={chartOptions as any} />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-muted/20 rounded-xl border border-dashed">
                <div className="text-center">
                  <TrendingUp className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-muted-foreground font-medium">No data yet</p>
                  <p className="text-sm text-muted-foreground">Scan some products to see your trend</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Scans */}
        <div className="bg-card border rounded-2xl p-6 shadow-sm flex flex-col h-full">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-lg font-bold">Recent Scans</h3>
            {recentScans.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearHistory} className="text-xs text-muted-foreground">
                Clear
              </Button>
            )}
          </div>
          
          <div className="space-y-4 flex-1">
            {recentScans.length > 0 ? (
              recentScans.map((scan) => (
                <Link key={scan.id} href={`/scanner/results?id=${scan.id}`} className="block text-foreground hover:no-underline decoration-none">
                  <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer border border-transparent hover:border-border">
                    <div>
                      <p className="font-medium">{scan.name}</p>
                      <p className="text-xs text-muted-foreground">{scan.date}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold flex items-center justify-end gap-1">
                        <span className={scan.score > 20 ? 'text-emerald-500' : scan.score > 10 ? 'text-orange-500' : 'text-red-500'}>
                          {scan.score}
                        </span>
                        <span className="text-xs text-muted-foreground font-normal">/100</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ScanLine className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No scans yet.</p>
                <p className="text-sm">Scan a product to see it here!</p>
              </div>
            )}
          </div>
          
          <Link href="/dashboard/history" className="w-full mt-4 block">
            <Button 
              variant="ghost" 
              className="w-full"
            >
              View All History
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
