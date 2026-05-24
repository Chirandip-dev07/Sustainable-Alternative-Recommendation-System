"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  ArrowRightLeft, 
  Search, 
  PlusCircle, 
  Leaf, 
  Award, 
  Recycle, 
  Wind, 
  X, 
  RefreshCw, 
  Clock 
} from "lucide-react";
import { toast } from "sonner";

interface CompareProduct {
  id: string;
  name: string;
  material: string;
  price: string;
  reusability: number;
  biodegradability: number;
  carbonImpact: number;
  score: number;
}

// Helper to estimate or create product
function createCompareProduct(
  name: string,
  material: string,
  priceINR: number,
  scoresOverride?: { r: number; b: number; c: number }
): CompareProduct {
  let r = 5;
  let b = 5;
  let c = 5;

  if (scoresOverride) {
    r = scoresOverride.r;
    b = scoresOverride.b;
    c = scoresOverride.c;
  } else {
    // Estimate based on name and material heuristics
    const lower = (name + " " + material).toLowerCase();
    if (lower.includes("bamboo") || lower.includes("neem") || lower.includes("wood")) {
      r = 8; b = 9; c = 2;
    } else if (lower.includes("steel") || lower.includes("metal") || lower.includes("copper") || lower.includes("iron")) {
      r = 10; b = 1; c = 5;
    } else if (lower.includes("glass")) {
      r = 9; b = 1; c = 6;
    } else if (lower.includes("paper") || lower.includes("cardboard") || lower.includes("kulhad")) {
      r = 1; b = 8; c = 3;
    } else if (lower.includes("clay")) {
      r = 2; b = 10; c = 1;
    } else if (lower.includes("jute") || lower.includes("cotton") || lower.includes("tote") || lower.includes("canvas")) {
      r = 9; b = 9; c = 3;
    } else if (lower.includes("recycled plastic") || lower.includes("rpet")) {
      r = 6; b = 2; c = 4;
    } else if (lower.includes("plastic") || lower.includes("disposable") || lower.includes("single-use") || lower.includes("polythene")) {
      r = 1; b = 1; c = 8;
    }
  }

  const score = r + b + (10 - c);

  return {
    id: Math.random().toString(),
    name,
    material,
    price: `₹${priceINR}`,
    reusability: r,
    biodegradability: b,
    carbonImpact: c,
    score
  };
}

// Floating orb component
function Orb({ cx, cy, r, delay = 0 }: { cx: string; cy: string; r: number; delay?: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        left: cx, top: cy, width: r * 2, height: r * 2,
        transform: 'translate(-50%, -50%)',
        background: 'radial-gradient(circle, rgba(134,191,120,0.18) 0%, rgba(45,110,70,0.08) 60%, transparent 100%)',
        filter: 'blur(2px)',
      }}
      animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
      transition={{ duration: 6 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    />
  );
}

// Animated leaf particle
function LeafParticle({ x, delay }: { x: string; delay: number }) {
  return (
    <motion.div
      className="absolute pointer-events-none text-[#5a9e6f] opacity-20 select-none"
      style={{ left: x, top: '-2rem', fontSize: '1.2rem' }}
      animate={{ y: ['0vh', '110vh'], rotate: [0, 360], x: [0, 30, -20, 0] }}
      transition={{ duration: 12 + delay * 2, repeat: Infinity, ease: 'linear', delay: delay * 3 }}
    >
      ✦
    </motion.div>
  );
}

export default function ComparePage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<'left' | 'right' | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [apiResult, setApiResult] = useState<{
    mainProduct: CompareProduct;
    alternatives: CompareProduct[];
  } | null>(null);
  const [recentHistory, setRecentHistory] = useState<any[]>([]);

  // Pre-load with beautiful initial values
  const [leftProduct, setLeftProduct] = useState<CompareProduct | null>(null);
  const [rightProduct, setRightProduct] = useState<CompareProduct | null>(null);

  useEffect(() => {
    // Initial load
    setLeftProduct(createCompareProduct("Plastic Water Bottle", "PET Plastic", 20, { r: 2, b: 2, c: 8 }));
    setRightProduct(createCompareProduct("Stainless Steel Bottle", "Stainless Steel", 350, { r: 10, b: 1, c: 7 }));
  }, []);

  // Fetch scan history from localStorage whenever dialog is opened
  useEffect(() => {
    if (isSearchOpen && typeof window !== "undefined") {
      const savedHistory = localStorage.getItem("econova_history");
      if (savedHistory) {
        try {
          const parsed = JSON.parse(savedHistory);
          setRecentHistory(parsed.slice(0, 5)); // show top 5 items
        } catch (e) {
          console.error(e);
        }
      } else {
        setRecentHistory([]);
      }
    }
  }, [isSearchOpen]);

  const openSearch = (slot: 'left' | 'right') => {
    setActiveSlot(slot);
    setSearchQuery("");
    setApiResult(null);
    setIsSearchOpen(true);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsLoadingProduct(true);
    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: searchQuery }),
      });

      if (!response.ok) {
        throw new Error(`API error ${response.status}`);
      }

      const json = await response.json();
      const data = json.data;

      if (data) {
        setApiResult({
          mainProduct: createCompareProduct(
            data.productName,
            data.materialType || "Mixed Synthetics",
            data.estimatedPriceINR || 100,
            data.scores
          ),
          alternatives: (data.ecoAlternatives || []).map((alt: any) => 
            createCompareProduct(
              alt.name,
              alt.material || "Sustainable Material",
              alt.estimatedPriceINR || alt.price || 150
            )
          )
        });
      } else {
        toast.error("Failed to analyze product. Try another query.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Could not scan product. Check if backend is running.");
    } finally {
      setIsLoadingProduct(false);
    }
  };

  const selectProduct = (product: CompareProduct) => {
    if (activeSlot === 'left') {
      setLeftProduct(product);
    } else {
      setRightProduct(product);
    }
    setIsSearchOpen(false);
    toast.success(`Selected ${product.name}`);
  };

  const selectHistoryProduct = (item: any) => {
    let product;
    if (item.fullData) {
      const fd = item.fullData;
      product = createCompareProduct(
        fd.productName || item.name,
        fd.materialType || "Mixed Synthetics",
        fd.estimatedPriceINR || 100,
        fd.scores
      );
    } else {
      product = createCompareProduct(
        item.name,
        "Mixed Synthetics",
        100
      );
    }

    if (activeSlot === 'left') {
      setLeftProduct(product);
    } else {
      setRightProduct(product);
    }
    setIsSearchOpen(false);
    toast.success(`Selected ${product.name}`);
  };

  const clearSlot = (slot: 'left' | 'right') => {
    if (slot === 'left') setLeftProduct(null);
    if (slot === 'right') setRightProduct(null);
  };

  const getWinnerMessage = () => {
    if (!leftProduct || !rightProduct) return "";
    if (leftProduct.score === rightProduct.score) {
      return "Both products are equivalent in overall environmental footprint.";
    }
    const winner = leftProduct.score > rightProduct.score ? leftProduct : rightProduct;
    const loser = leftProduct.score > rightProduct.score ? rightProduct : leftProduct;
    const scoreDiff = winner.score - loser.score;
    
    // Custom explanation
    const reusabilityBetter = winner.reusability > loser.reusability;
    const carbonBetter = winner.carbonImpact < loser.carbonImpact;
    const bioBetter = winner.biodegradability > loser.biodegradability;
    
    let reasoning = "";
    if (reusabilityBetter && carbonBetter) {
      reasoning = " It offers superior reusability lifespan and a lower carbon footprint.";
    } else if (reusabilityBetter) {
      reasoning = " It provides a much longer usage cycle, reducing single-use waste.";
    } else if (carbonBetter) {
      reasoning = " It has a significantly lower greenhouse gas footprint during manufacture.";
    } else if (bioBetter) {
      reasoning = " It biodegrades and composts naturally without leaving toxic residues.";
    }

    return `${winner.name} outperforms ${loser.name} by ${scoreDiff} point${scoreDiff > 1 ? 's' : ''} in sustainability score.${reasoning}`;
  };

  const ProductCard = ({ product, slot }: { product: CompareProduct | null, slot: 'left' | 'right' }) => {
    if (!product) {
      return (
        <div 
          onClick={() => openSearch(slot)}
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px dashed rgba(86, 168, 100, 0.25)',
            borderRadius: '24px',
            padding: '48px',
            height: '420px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 300ms ease',
            backdropFilter: 'blur(10px)',
          }}
          className="hover:bg-emerald-500/5 hover:border-emerald-500/40 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          
          <div className="h-16 w-16 rounded-full bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 group-hover:border-emerald-500/30 transition-all duration-300 mb-6">
            <PlusCircle className="h-8 w-8 text-emerald-500/45 group-hover:text-emerald-500 group-hover:scale-110 transition-all duration-300" />
          </div>
          
          <div>
            <h3 className="font-semibold text-lg text-emerald-100/90 font-sans tracking-wide">Add Product</h3>
            <p className="text-sm text-emerald-750/60 mt-1 max-w-[200px] mx-auto font-sans leading-relaxed">Search or select from scan history to compare</p>
          </div>
        </div>
      );
    }

    const isHigh = product.score > 20;
    const isMedium = product.score > 12 && product.score <= 20;
    const scoreColor = isHigh ? '#56a864' : isMedium ? '#d97706' : '#dc2626';

    return (
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(20,50,25,0.45), rgba(10,30,15,0.65))',
          border: '1px solid rgba(86,168,100,0.22)',
          borderRadius: '24px',
          padding: '32px',
          height: '420px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}
        className="group transition-all duration-300 hover:border-emerald-500/30"
      >
        {/* Remove Button */}
        <button
          onClick={() => clearSlot(slot)}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            color: 'rgba(239, 68, 68, 0.8)',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 200ms ease'
          }}
          className="hover:bg-red-500 hover:text-white"
          title="Remove Product"
        >
          <X size={14} />
        </button>

        {/* Header */}
        <div className="text-center mt-2">
          <span style={{
            fontSize: '0.68rem',
            fontFamily: 'Manrope, sans-serif',
            fontWeight: 600,
            color: 'rgba(134, 191, 120, 0.7)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            display: 'block',
            marginBottom: '6px'
          }}>
            {product.material}
          </span>
          <h3 style={{
            fontSize: '1.45rem',
            fontFamily: 'Crimson Pro, Georgia, serif',
            color: '#e8f0e2',
            lineHeight: 1.2,
            marginBottom: '8px',
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {product.name}
          </h3>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            Est. Price: {product.price}
          </span>
        </div>

        {/* Score Circle */}
        <div className="flex justify-center my-4">
          <div style={{
            position: 'relative',
            width: '90px',
            height: '90px',
            borderRadius: '50%',
            background: 'rgba(86, 168, 100, 0.05)',
            border: `2px solid ${scoreColor}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.2)'
          }}>
            <span style={{ fontSize: '1.65rem', fontWeight: 300, color: '#e8f0e2', lineHeight: 1 }}>
              {product.score}
            </span>
            <span style={{ fontSize: '0.62rem', color: 'rgba(180, 210, 170, 0.5)', fontFamily: 'Manrope, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              / 30
            </span>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-3.5 w-full">
          {/* Reusability */}
          <div>
            <div className="flex justify-between text-xs font-medium mb-1.5" style={{ fontFamily: 'Manrope, sans-serif' }}>
              <span className="flex items-center gap-1.5 text-slate-300">
                <Recycle size={12} className="text-blue-400" /> Reusability
              </span>
              <span className="text-emerald-300">{product.reusability}/10</span>
            </div>
            <div style={{ height: '3.5px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{ width: `${product.reusability * 10}%`, height: '100%', background: 'linear-gradient(90deg, #1d4ed8, #3b82f6)', borderRadius: '999px' }} />
            </div>
          </div>

          {/* Biodegradability */}
          <div>
            <div className="flex justify-between text-xs font-medium mb-1.5" style={{ fontFamily: 'Manrope, sans-serif' }}>
              <span className="flex items-center gap-1.5 text-slate-300">
                <Leaf size={12} className="text-emerald-400" /> Biodegradability
              </span>
              <span className="text-emerald-300">{product.biodegradability}/10</span>
            </div>
            <div style={{ height: '3.5px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{ width: `${product.biodegradability * 10}%`, height: '100%', background: 'linear-gradient(90deg, #047857, #10b981)', borderRadius: '999px' }} />
            </div>
          </div>

          {/* Carbon Footprint (represented as efficiency: 10 - carbonImpact) */}
          <div>
            <div className="flex justify-between text-xs font-medium mb-1.5" style={{ fontFamily: 'Manrope, sans-serif' }}>
              <span className="flex items-center gap-1.5 text-slate-300">
                <Wind size={12} className="text-teal-400" /> Carbon Efficiency
              </span>
              <span className="text-emerald-300">{10 - product.carbonImpact}/10</span>
            </div>
            <div style={{ height: '3.5px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{ width: `${(10 - product.carbonImpact) * 10}%`, height: '100%', background: 'linear-gradient(90deg, #0f766e, #06b6d4)', borderRadius: '999px' }} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ background: '#0d1f14', fontFamily: "'Crimson Pro', 'Georgia', serif" }}>
      
      {/* Floating particles */}
      {['8%','22%','38%','55%','70%','85%'].map((x, i) => (
        <LeafParticle key={x} x={x} delay={i} />
      ))}

      {/* Floating Orbs */}
      <Orb cx="20%" cy="30%" r={200} delay={0} />
      <Orb cx="80%" cy="60%" r={280} delay={2} />
      <Orb cx="50%" cy="80%" r={160} delay={4} />

      {/* ── CUSTOM BOTANICAL NAV ──────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-8 py-5"
        style={{ background: 'rgba(13,31,20,0.7)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(86,168,100,0.08)' }}>
        <motion.div
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <Link href="/" className="flex items-center gap-3" style={{ textDecoration: 'none' }}>
            <div className="flex items-center justify-center w-9 h-9 rounded-full" style={{ background: 'rgba(86,168,100,0.15)', border: '1px solid rgba(86,168,100,0.3)' }}>
              <Leaf size={16} color="#86a878" />
            </div>
            <span style={{ color: '#c8dfc0', fontSize: '0.85rem', letterSpacing: '0.25em', fontFamily: 'Manrope, sans-serif', fontWeight: 600 }}>
              ECONOVA GREENLENS
            </span>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          className="flex flex-wrap items-center justify-end gap-2"
          style={{ maxWidth: '75%' }}
        >
          <Link href="/scanner" style={{
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '0.75rem',
            fontFamily: 'Manrope, sans-serif',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            transition: 'all 200ms',
            color: 'rgba(180,210,170,0.7)',
            border: '1px solid rgba(86,168,100,0.15)',
            background: 'rgba(86,168,100,0.05)',
            textDecoration: 'none'
          }} className="hover:text-[#a8d4a0] hover:bg-[#56a864]/10">
            Scanner
          </Link>
          <Link href="/compare" style={{
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '0.75rem',
            fontFamily: 'Manrope, sans-serif',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            transition: 'all 200ms',
            color: '#a8d4a0',
            border: '1px solid rgba(86,168,100,0.3)',
            background: 'rgba(86,168,100,0.15)',
            textDecoration: 'none'
          }} className="hover:text-[#a8d4a0] hover:bg-[#56a864]/10">
            Compare
          </Link>
          <Link href="/#dashboard-section" style={{
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '0.75rem',
            fontFamily: 'Manrope, sans-serif',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            transition: 'all 200ms',
            color: 'rgba(180,210,170,0.7)',
            border: '1px solid rgba(86,168,100,0.15)',
            background: 'rgba(86,168,100,0.05)',
            textDecoration: 'none'
          }} className="hover:text-[#a8d4a0] hover:bg-[#56a864]/10">
            Dashboard
          </Link>
          <Link href="/about" style={{
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '0.75rem',
            fontFamily: 'Manrope, sans-serif',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            transition: 'all 200ms',
            color: 'rgba(180,210,170,0.7)',
            border: '1px solid rgba(86,168,100,0.15)',
            background: 'rgba(86,168,100,0.05)',
            textDecoration: 'none'
          }} className="hover:text-[#a8d4a0] hover:bg-[#56a864]/10">
            About
          </Link>
        </motion.div>
      </nav>

      {/* ── MAIN CONTENT ──────────────────────────────────────────── */}
      <main className="flex-1 container mx-auto px-6 pt-36 pb-24 max-w-6xl relative z-10">
        
        {/* Title Block */}
        <div className="text-center mb-16 space-y-4 animate-in fade-in duration-500">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl mb-2">
            <ArrowRightLeft className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            fontWeight: 400,
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            color: '#e8f0e2',
          }}>
            Compare <em style={{ color: '#7dc88a', fontStyle: 'italic' }}>Products</em>
          </h1>
          <p style={{ color: 'rgba(180,210,170,0.65)', fontSize: '1rem', lineHeight: 1.7, maxWidth: '520px', margin: '0 auto', fontFamily: 'Manrope, sans-serif', fontWeight: 400 }}>
            Place two items side-by-side to compare their reusability, material biodegradability, and carbon foot prints using real-time AI scanning.
          </p>
        </div>

        {/* Product Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-8 items-center animate-in fade-in duration-700">
          
          <ProductCard product={leftProduct} slot="left" />

          {/* VS Divider */}
          <div className="flex justify-center py-4 md:py-0">
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(13, 31, 20, 0.8)',
              border: '1px solid rgba(86, 168, 100, 0.3)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#7dc88a',
              fontFamily: 'Manrope, sans-serif',
              fontWeight: 800,
              fontSize: '0.85rem',
              letterSpacing: '0.05em',
              zIndex: 10
            }}>
              VS
            </div>
          </div>

          <ProductCard product={rightProduct} slot="right" />

        </div>
        
        {/* Winner Highlight Card */}
        {leftProduct && rightProduct && (
          <div 
            style={{
              background: 'linear-gradient(135deg, rgba(86,168,100,0.12), rgba(16,185,129,0.02))',
              border: '1px solid rgba(86,168,100,0.25)',
              borderRadius: '24px',
              backdropFilter: 'blur(15px)'
            }}
            className="mt-16 p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <h3 className="text-2xl font-bold flex items-center justify-center gap-3" style={{ fontFamily: 'Crimson Pro, Georgia, serif', color: '#c8e8c0' }}>
              <Award className="h-7 w-7 text-emerald-400 animate-bounce" /> 
              Winner: {
                leftProduct.score > rightProduct.score 
                  ? leftProduct.name 
                  : rightProduct.score > leftProduct.score 
                    ? rightProduct.name 
                    : "It's a Tie!"
              }
            </h3>
            <p className="mt-3 max-w-2xl mx-auto text-sm leading-relaxed" style={{ fontFamily: 'Manrope, sans-serif', color: 'rgba(180, 210, 170, 0.7)' }}>
              {getWinnerMessage()}
            </p>
          </div>
        )}
      </main>

      {/* ── SEARCH OVERLAY DIALOG ─────────────────────────────────── */}
      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="max-w-md bg-[#0d1f14] border border-emerald-500/25 text-[#e8f0e2] rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[85vh]">
          <DialogHeader className="pb-4 border-b border-emerald-500/10">
            <DialogTitle style={{ fontFamily: 'Crimson Pro, Georgia, serif', fontSize: '1.5rem', color: '#e8f0e2' }} className="font-normal">
              Search & Compare Product
            </DialogTitle>
          </DialogHeader>
          
          {/* Input Search Form */}
          <div className="py-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600/80" />
              <Input 
                autoFocus
                placeholder="Type product name (e.g. plastic bottle)..." 
                className="pl-9 bg-black/40 border-emerald-500/20 text-[#c8dfc0] placeholder:text-emerald-700/50 focus-visible:ring-emerald-500/50 rounded-full h-11"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button 
              onClick={handleSearch}
              disabled={isLoadingProduct || !searchQuery.trim()}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 text-[#e8f0e2] font-semibold rounded-full h-11 border border-emerald-500/25"
            >
              {isLoadingProduct ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  AI Scanning Footprint...
                </>
              ) : "Analyze with AI Scanner"}
            </Button>
          </div>

          <div className="space-y-6 pt-2">
            {/* 1. Loading Indicator */}
            {isLoadingProduct && (
              <div className="p-8 text-center border border-dashed border-emerald-500/10 rounded-2xl bg-black/10">
                <RefreshCw className="h-8 w-8 text-emerald-500 animate-spin mx-auto mb-3" />
                <p className="text-sm text-emerald-300/80 font-medium">Estimating material durability, biodegradability index, and production carbon impact...</p>
              </div>
            )}

            {/* 2. API Scan Results (Main Product + Alternatives) */}
            {!isLoadingProduct && apiResult && (
              <div className="space-y-4">
                {/* Main Scanned Product */}
                <div>
                  <h4 className="text-xs font-bold text-emerald-600/70 tracking-widest uppercase mb-2">Scanned Target</h4>
                  <div 
                    onClick={() => selectProduct(apiResult.mainProduct)}
                    className="flex items-center justify-between p-4 bg-emerald-950/20 hover:bg-emerald-900/30 border border-emerald-500/20 rounded-2xl cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-emerald-100">{apiResult.mainProduct.name}</p>
                      <p className="text-xs text-[#86a878]">{apiResult.mainProduct.material} · {apiResult.mainProduct.price}</p>
                    </div>
                    <div style={{
                      borderColor: apiResult.mainProduct.score > 20 ? '#56a864' : apiResult.mainProduct.score > 12 ? '#d97706' : '#dc2626'
                    }} className="font-bold text-xs border rounded-full px-2.5 py-1 text-slate-100 bg-black/40">
                      Score: {apiResult.mainProduct.score}/100
                    </div>
                  </div>
                </div>

                {/* Alternatives */}
                {apiResult.alternatives.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-emerald-600/70 tracking-widest uppercase mb-2">Sustainable Alternatives</h4>
                    <div className="space-y-2">
                      {apiResult.alternatives.map((alt) => (
                        <div 
                          key={alt.id}
                          onClick={() => selectProduct(alt)}
                          className="flex items-center justify-between p-3.5 bg-black/20 hover:bg-emerald-900/20 border border-emerald-500/10 hover:border-emerald-500/20 rounded-2xl cursor-pointer transition-colors"
                        >
                          <div>
                            <p className="font-medium text-emerald-100/90 text-sm">{alt.name}</p>
                            <p className="text-xs text-[#86a878]/80">{alt.material} · {alt.price}</p>
                          </div>
                          <div style={{
                            borderColor: alt.score > 20 ? '#56a864' : alt.score > 12 ? '#d97706' : '#dc2626'
                          }} className="font-semibold text-xs border rounded-full px-2 py-0.5 text-slate-200 bg-black/30">
                            {alt.score}/30
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. Recent Scan History */}
            {!isLoadingProduct && recentHistory.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-emerald-600/70 tracking-widest uppercase mb-2 flex items-center gap-1.5">
                  <Clock size={12} /> Recent Scans
                </h4>
                <div className="space-y-2">
                  {recentHistory.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => selectHistoryProduct(item)}
                      className="flex items-center justify-between p-3.5 bg-black/10 hover:bg-emerald-900/20 border border-emerald-500/5 hover:border-emerald-500/15 rounded-2xl cursor-pointer transition-colors"
                    >
                      <div>
                        <p className="font-medium text-emerald-100/80 text-sm">{item.name}</p>
                        <p className="text-xs text-[#86a878]/60">Scan date: {item.date}</p>
                      </div>
                      <div className="font-semibold text-xs px-2 py-0.5 rounded-md bg-emerald-500/5 text-emerald-400 border border-emerald-500/10">
                        Select
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isLoadingProduct && !apiResult && recentHistory.length === 0 && (
              <div className="p-8 text-center text-[#86a878]/60 font-medium">
                <p>Type above to scan any product with AI,</p>
                <p className="text-xs mt-1">or view results compared instantly here.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
