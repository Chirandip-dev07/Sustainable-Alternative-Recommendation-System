"use client";

import Link from "next/link";
import { Leaf } from "lucide-react";
import Image from "next/image";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-emerald-500/20 shadow-sm group-hover:border-emerald-500/50 transition-colors">
              <Image 
                src="/logo.png" 
                alt="EcoNova Logo" 
                fill
                className="object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              {/* Fallback leaf icon behind the image in case it hasn't loaded yet */}
              <Leaf className="h-6 w-6 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10" />
            </div>
            <span className="font-bold text-xl hidden sm:inline-block text-foreground group-hover:text-emerald-500 transition-colors">EcoNova GreenLens</span>
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/scanner" className="transition-colors hover:text-emerald-500">Scanner</Link>
          <Link href="/#dashboard-section" className="transition-colors hover:text-emerald-500">Dashboard</Link>
          <Link href="/compare" className="transition-colors hover:text-emerald-500">Compare</Link>
          <Link href="/about" className="transition-colors hover:text-emerald-500">About</Link>
        </nav>

        <div className="flex items-center gap-4">
          <ModeToggle />
          <Link href="/auth/login" className="hidden sm:block">
            <Button variant="ghost">Log in</Button>
          </Link>
          <Link href="/scanner">
            <Button className="rounded-full">Scan Now</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
