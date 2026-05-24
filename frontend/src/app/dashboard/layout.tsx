"use client";

import { Navbar } from "@/components/navbar";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Scan History", href: "/dashboard/history" },
    { label: "Saved Alternatives", href: "/dashboard/saved" },
    { label: "Settings", href: "/dashboard/settings" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      {/* Sleek Mobile Navigation Pills */}
      <div className="border-b bg-muted/10 block sm:hidden px-4 py-3 overflow-x-auto scrollbar-none whitespace-nowrap">
        <nav className="flex gap-2">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 decoration-none ${
                  active
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                    : "bg-muted text-muted-foreground hover:text-foreground border border-transparent"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex-1 flex flex-col sm:flex-row">
        {/* Sidebar for Desktop */}
        <aside className="w-full sm:w-64 border-r bg-muted/10 hidden sm:block">
          <div className="h-full px-4 py-6 space-y-6">
            <div className="space-y-1">
              <h4 className="px-2 text-xs font-bold tracking-widest uppercase text-muted-foreground/60 mb-4">Overview</h4>
              <nav className="grid gap-1">
                {navItems.slice(0, 3).map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 decoration-none ${
                        active
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
            
            <div className="space-y-1 pt-4 border-t">
              <h4 className="px-2 text-xs font-bold tracking-widest uppercase text-muted-foreground/60 mb-4">Account</h4>
              <nav className="grid gap-1">
                {navItems.slice(3).map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 decoration-none ${
                        active
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </aside>
        
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
