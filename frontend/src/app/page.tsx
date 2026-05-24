"use client";

import { useRef, useState, useEffect, type KeyboardEvent, type ReactNode } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import {
  BadgeIndianRupee, Camera, Leaf, Recycle, ShieldCheck,
  Sparkles, Upload, Zap, Wind, Droplets, Sun, X, RefreshCw,
  Heart, ScanLine, Mic, MicOff,
  Clock, Trash2, ArrowRight, Bookmark, ExternalLink, Award, User, Globe, Save, TrendingUp, ShoppingBag,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import Webcam from 'react-webcam'
import heroBotanical from '@/assets/hero-botanical.png'
import { useTheme } from 'next-themes'
import {
  fetchTextRecommendations,
  fetchImageRecommendations,
  type AnalysisScores,
  type Recommendation,
} from '@/services/api'
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
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

type Mode = 'eco' | 'balanced' | 'budget'

const getPurchaseLinks = (productName: string) => {
  const query = new URLSearchParams({ q: productName.trim() }).toString().replace(/^q=/, "");

  return {
    amazon_link: `https://www.amazon.in/s?k=${query}`,
    flipkart_link: `https://www.flipkart.com/search?q=${query}`,
  };
};

const modeMeta: Record<Mode, { title: string; subtitle: string; icon: ReactNode; color: string }> = {
  eco: {
    title: 'Eco',
    subtitle: 'Maximum sustainability impact',
    icon: <Leaf size={14} />,
    color: '#3d7a4f',
  },
  balanced: {
    title: 'Balanced',
    subtitle: 'Best mix of eco and cost',
    icon: <Sparkles size={14} />,
    color: '#2a6b5c',
  },
  budget: {
    title: 'Budget',
    subtitle: 'Sensible eco at lower cost',
    icon: <BadgeIndianRupee size={14} />,
    color: '#4a7c3f',
  },
}

const formatCategory = (category: string | null) => {
  if (!category) return 'Unknown'
  return category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
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
  )
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
  )
}

export default function Home() {
  const [mode, setMode] = useState<Mode>('balanced')
  const [query, setQuery] = useState('')
  const [detectedItem, setDetectedItem] = useState('')
  const [confidence, setConfidence] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [analysisScores, setAnalysisScores] = useState<AnalysisScores | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [showCameraModal, setShowCameraModal] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const uploadInputRef = useRef<HTMLInputElement>(null)
  const webcamRef = useRef<Webcam>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Cursor glow
  const cursorX = useMotionValue(-100)
  const cursorY = useMotionValue(-100)
  const springX = useSpring(cursorX, { stiffness: 80, damping: 20 })
  const springY = useSpring(cursorY, { stiffness: 80, damping: 20 })

  useEffect(() => {
    const move = (e: MouseEvent) => {
      cursorX.set(e.clientX)
      cursorY.set(e.clientY)
    }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])

  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  // Dashboard Integration State
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'saved' | 'settings'>('overview')
  const [recentScans, setRecentScans] = useState<any[]>([])
  const [savedAlts, setSavedAlts] = useState<any[]>([])
  const [settingsForm, setSettingsForm] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    notifications: true,
    currency: 'INR (₹)',
  })

  const loadDashboardData = () => {
    if (typeof window === 'undefined') return
    
    // Load history
    const savedHistory = localStorage.getItem('econova_history')
    if (savedHistory) {
      setRecentScans(JSON.parse(savedHistory))
    } else {
      setRecentScans([])
    }

    // Load saved alternatives
    const savedAlternatives = localStorage.getItem('econova_saved_alts')
    if (savedAlternatives) {
      setSavedAlts(JSON.parse(savedAlternatives))
    } else {
      setSavedAlts([])
    }

    // Load settings
    const savedSettings = localStorage.getItem('econova_settings')
    if (savedSettings) {
      try {
        setSettingsForm(JSON.parse(savedSettings))
      } catch (e) {
        console.error(e)
      }
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const saveAlternative = (alt: Recommendation) => {
    const saved = JSON.parse(localStorage.getItem('econova_saved_alts') || '[]');
    if (!saved.some((item: any) => item.name === alt.name)) {
      const altToSave = {
        name: alt.name,
        material: alt.material,
        score: alt.sustainability_score ? Math.round(alt.sustainability_score * 0.3) : 25,
        price: `₹${alt.price}`,
        reason: alt.reason,
        type: alt.alternativeType || (alt.price < 150 ? 'budget' : alt.price < 300 ? 'balanced' : 'eco'),
        amazon_link: alt.amazon_link,
        flipkart_link: alt.flipkart_link
      };
      localStorage.setItem('econova_saved_alts', JSON.stringify([...saved, altToSave]));
      toast.success(`Saved ${alt.name} to your dashboard!`);
      loadDashboardData();
    } else {
      toast.info(`${alt.name} is already saved.`);
    }
  };

  const deleteScan = (id: string | number) => {
    const updated = recentScans.filter(item => item.id !== id);
    localStorage.setItem('econova_history', JSON.stringify(updated));
    setRecentScans(updated);
    toast.info("Item removed from history.");
  };

  const clearAllHistory = () => {
    localStorage.removeItem('econova_history');
    setRecentScans([]);
    toast.success("Scan history cleared.");
  };

  const removeSavedAlt = (name: string) => {
    const updated = savedAlts.filter(item => item.name !== name);
    localStorage.setItem('econova_saved_alts', JSON.stringify(updated));
    setSavedAlts(updated);
    toast.info("Removed from saved alternatives.");
  };

  const saveSettings = () => {
    localStorage.setItem('econova_settings', JSON.stringify(settingsForm));
    toast.success("Settings saved successfully!");
  };

  const handleNavClick = (tab: 'overview' | 'history' | 'saved' | 'settings') => {
    setActiveTab(tab);
    setTimeout(() => {
      document.getElementById('dashboard-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const toggleSpeechRecognition = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error('Voice search is not supported in your browser. Try Google Chrome.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-IN';

      rec.onstart = () => {
        setIsListening(true);
        toast.info('Listening for product name...', { duration: 2000 });
      };

      rec.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        if (transcript) {
          setQuery(transcript);
          toast.success(`Recognized: "${transcript}"`);
          setTimeout(() => {
            handleCompare(mode, transcript);
          }, 500);
        }
      };

      rec.onerror = (e: any) => {
        console.error('Speech recognition error', e);
        setIsListening(false);
        if (e.error === 'not-allowed') {
          toast.error('Microphone permission denied. Please allow microphone access.');
        } else {
          toast.error(`Voice error: ${e.error}`);
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err: any) {
      console.error(err);
      setIsListening(false);
    }
  };

  const scrollToResults = () => {
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleCompare = async (selectedMode: Mode = mode, overrideQuery?: string) => {
    const activeQuery = overrideQuery !== undefined ? overrideQuery : query;
    if (!activeQuery.trim()) return
    try {
      setIsLoading(true)
      setError('')
      setRecommendations([])
      setAnalysisScores(null)
      setHasSearched(true)

      const result = await fetchTextRecommendations(activeQuery, selectedMode)
      setDetectedItem(result.detected_product)

      if (!result.recommendations.length) {
        setConfidence(result.message || 'No recommendations found')
        return
      }

      setRecommendations(result.recommendations)
      setAnalysisScores(result.analysis_scores)
      setConfidence(`Category: ${formatCategory(result.category)}`)
      
      // Save scan details to localStorage so it is saved in History
      const fullPayload = {
        productName: result.detected_product,
        category: result.category,
        materialType: result.recommendations[0]?.material || "Eco Materials",
        estimatedPriceINR: result.recommendations[0]?.price ? Math.round(result.recommendations[0].price * 0.8) : 100,
        scores: {
          r: Math.round(result.analysis_scores.reusability / 10),
          b: Math.round(result.analysis_scores.sustainability / 10),
          c: Math.round((100 - result.analysis_scores.carbon) / 10)
        },
        sustainabilityScore: result.analysis_scores.sustainability,
        ecoAlternatives: result.recommendations.map(r => ({
          name: r.name,
          material: r.material || "Sustainable",
          estimatedPriceINR: r.price,
          reason: r.reason,
          alternativeType: r.alternativeType
        }))
      };
      const scanRecord = {
        id: Date.now(),
        name: result.detected_product,
        score: result.analysis_scores.sustainability,
        date: new Date().toLocaleDateString(),
        fullData: fullPayload,
      };
      const existingHistory = JSON.parse(localStorage.getItem('econova_history') || '[]');
      localStorage.setItem('econova_history', JSON.stringify([scanRecord, ...existingHistory]));
      loadDashboardData();

      setTimeout(scrollToResults, 300)
    } catch (err: any) {
      setError('Could not connect to backend. Make sure Python FastAPI backend is running.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleModeChange = (next: Mode) => {
    setMode(next)
  }

  const handleImageSelection = async (file?: File) => {
    if (!file) return
    if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(file))
    setConfidence('Reading image...')
    try {
      setIsLoading(true)
      setError('')
      setRecommendations([])
      setAnalysisScores(null)
      setHasSearched(true)

      const result = await fetchImageRecommendations(file, mode)
      setDetectedItem(result.detected_product)

      if (!result.recommendations.length) {
        setConfidence(result.message || 'No recommendations found')
        return
      }

      setRecommendations(result.recommendations)
      setAnalysisScores(result.analysis_scores)
      setConfidence(`Detected: ${result.detected_product}`)
      
      // Save scan details to localStorage so it is saved in History
      const fullPayload = {
        productName: result.detected_product,
        category: result.category,
        materialType: result.recommendations[0]?.material || "Eco Materials",
        estimatedPriceINR: result.recommendations[0]?.price ? Math.round(result.recommendations[0].price * 0.8) : 100,
        scores: {
          r: Math.round(result.analysis_scores.reusability / 10),
          b: Math.round(result.analysis_scores.sustainability / 10),
          c: Math.round((100 - result.analysis_scores.carbon) / 10)
        },
        sustainabilityScore: result.analysis_scores.sustainability,
        ecoAlternatives: result.recommendations.map(r => ({
          name: r.name,
          material: r.material || "Sustainable",
          estimatedPriceINR: r.price,
          reason: r.reason,
          alternativeType: r.alternativeType
        }))
      };
      const scanRecord = {
        id: Date.now(),
        name: result.detected_product,
        score: result.analysis_scores.sustainability,
        date: new Date().toLocaleDateString(),
        fullData: fullPayload,
      };
      const existingHistory = JSON.parse(localStorage.getItem('econova_history') || '[]');
      localStorage.setItem('econova_history', JSON.stringify([scanRecord, ...existingHistory]));
      loadDashboardData();

      setTimeout(scrollToResults, 300)
    } catch (err: any) {
      setError('Image analysis failed. Make sure Python FastAPI backend is running.')
      setConfidence('Analysis failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCameraCapture = async () => {
    if (!webcamRef.current) return
    const imageSrc = webcamRef.current.getScreenshot()
    if (!imageSrc) {
      setError('Failed to capture snapshot from camera.')
      return
    }

    setShowCameraModal(false)
    if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(imageSrc)
    setConfidence('Reading camera snapshot...')

    try {
      setIsLoading(true)
      setError('')
      setRecommendations([])
      setAnalysisScores(null)
      setHasSearched(true)

      const result = await fetchImageRecommendations(imageSrc, mode)
      setDetectedItem(result.detected_product)

      if (!result.recommendations.length) {
        setConfidence(result.message || 'No recommendations found')
        return
      }

      setRecommendations(result.recommendations)
      setAnalysisScores(result.analysis_scores)
      setConfidence(`Detected: ${result.detected_product}`)
      
      // Save scan details to localStorage so it is saved in History
      const fullPayload = {
        productName: result.detected_product,
        category: result.category,
        materialType: result.recommendations[0]?.material || "Eco Materials",
        estimatedPriceINR: result.recommendations[0]?.price ? Math.round(result.recommendations[0].price * 0.8) : 100,
        scores: {
          r: Math.round(result.analysis_scores.reusability / 10),
          b: Math.round(result.analysis_scores.sustainability / 10),
          c: Math.round((100 - result.analysis_scores.carbon) / 10)
        },
        sustainabilityScore: result.analysis_scores.sustainability,
        ecoAlternatives: result.recommendations.map(r => ({
          name: r.name,
          material: r.material || "Sustainable",
          estimatedPriceINR: r.price,
          reason: r.reason,
          alternativeType: r.alternativeType
        }))
      };
      const scanRecord = {
        id: Date.now(),
        name: result.detected_product,
        score: result.analysis_scores.sustainability,
        date: new Date().toLocaleDateString(),
        fullData: fullPayload,
      };
      const existingHistory = JSON.parse(localStorage.getItem('econova_history') || '[]');
      localStorage.setItem('econova_history', JSON.stringify([scanRecord, ...existingHistory]));
      loadDashboardData();

      setTimeout(scrollToResults, 300)
    } catch (err: any) {
      setError('Camera analysis failed. Make sure Python FastAPI backend is running.')
      setConfidence('Analysis failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Fixed sorting: Balanced first, then Budget, then Eco
  const sortedRecommendations = [...recommendations].sort((a, b) => {
    const order = { balanced: 0, budget: 1, eco: 2 };
    const typeA = a.alternativeType || 'balanced';
    const typeB = b.alternativeType || 'balanced';
    return (order[typeA] ?? 0) - (order[typeB] ?? 0);
  });

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ background: '#0d1f14', fontFamily: "'Crimson Pro', 'Georgia', serif" }}>

      {/* Cursor glow */}
      <motion.div
        className="fixed pointer-events-none z-50 rounded-full hidden md:block"
        style={{
          left: springX, top: springY, width: 320, height: 320,
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(86,168,100,0.07) 0%, transparent 70%)',
        }}
      />

      {/* Floating particles */}
      {['8%','22%','38%','55%','70%','85%'].map((x, i) => (
        <LeafParticle key={x} x={x} delay={i} />
      ))}

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${heroBotanical.src || heroBotanical})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.18) saturate(1.4)',
          }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(34,90,50,0.5) 0%, transparent 60%), linear-gradient(180deg, rgba(13,31,20,0.4) 0%, #0d1f14 100%)'
        }} />

        {/* Orbs */}
        <Orb cx="20%" cy="30%" r={200} delay={0} />
        <Orb cx="80%" cy="60%" r={280} delay={2} />
        <Orb cx="50%" cy="80%" r={160} delay={4} />

        {/* Nav */}
        <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-8 py-5"
          style={{ background: 'rgba(13,31,20,0.7)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(86,168,100,0.08)' }}>
          <motion.div
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-full" style={{ background: 'rgba(86,168,100,0.15)', border: '1px solid rgba(86,168,100,0.3)' }}>
              <Leaf size={16} color="#86a878" />
            </div>
            <span style={{ color: '#c8dfc0', fontSize: '0.85rem', letterSpacing: '0.25em', fontFamily: 'Manrope, sans-serif', fontWeight: 600 }}>
              ECONOVA GREENLENS
            </span>
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
              color: 'rgba(180,210,170,0.7)',
              border: '1px solid rgba(86,168,100,0.15)',
              background: 'rgba(86,168,100,0.05)',
              textDecoration: 'none'
            }} className="hover:text-[#a8d4a0] hover:bg-[#56a864]/10">
              Compare
            </Link>
            <a href="#dashboard-section" onClick={(e) => { e.preventDefault(); handleNavClick('history'); }} style={{
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
              textDecoration: 'none',
              cursor: 'pointer'
            }} className="hover:text-[#a8d4a0] hover:bg-[#56a864]/10">
              History
            </a>
            <a href="#dashboard-section" onClick={(e) => { e.preventDefault(); handleNavClick('saved'); }} style={{
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
              textDecoration: 'none',
              cursor: 'pointer'
            }} className="hover:text-[#a8d4a0] hover:bg-[#56a864]/10">
              Saved Alts
            </a>
            <a href="#dashboard-section" onClick={(e) => { e.preventDefault(); handleNavClick('settings'); }} style={{
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
              textDecoration: 'none',
              cursor: 'pointer'
            }} className="hover:text-[#a8d4a0] hover:bg-[#56a864]/10">
              Settings
            </a>
            <a href="#dashboard-section" onClick={(e) => { e.preventDefault(); handleNavClick('overview'); }} style={{
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
              textDecoration: 'none',
              cursor: 'pointer'
            }} className="hover:text-[#a8d4a0] hover:bg-[#56a864]/10">
              Dashboard
            </a>
            <a href="#about" style={{
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
            </a>
          </motion.div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full"
              style={{ background: 'rgba(86,168,100,0.1)', border: '1px solid rgba(86,168,100,0.2)' }}>
              <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#56a864' }} />
              </motion.div>
              <span style={{ color: '#86c890', fontSize: '0.72rem', letterSpacing: '0.3em', fontFamily: 'Manrope, sans-serif', fontWeight: 600 }}>
                AI SUSTAINABILITY SCANNER
              </span>
            </div>

            <h1 style={{
              fontSize: 'clamp(3rem, 8vw, 6rem)',
              fontWeight: 400,
              lineHeight: 0.92,
              letterSpacing: '-0.03em',
              color: '#e8f0e2',
              marginBottom: '1.5rem',
            }}>
              Scan smarter.<br />
              <em style={{ color: '#7dc88a', fontStyle: 'italic' }}>Choose greener.</em>
            </h1>

            <p style={{ color: 'rgba(180,210,170,0.65)', fontSize: '1.05rem', lineHeight: 1.8, maxWidth: '480px', margin: '0 auto 3rem', fontFamily: 'Manrope, sans-serif', fontWeight: 400 }}>
              Type any product name and discover eco-friendly alternatives, ranked by sustainability, cost, and carbon impact.
            </p>
          </motion.div>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-3 mx-auto"
            style={{
              maxWidth: '560px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(86,168,100,0.25)',
              borderRadius: '999px',
              padding: '8px 8px 8px 24px',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleCompare()}
              placeholder="e.g. plastic water bottle..."
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: '#c8dfc0', fontSize: '0.95rem', fontFamily: 'Manrope, sans-serif',
              }}
            />
            <button
              onClick={toggleSpeechRecognition}
              type="button"
              style={{
                background: isListening ? 'rgba(239,68,68,0.2)' : 'rgba(86,168,100,0.1)',
                border: isListening ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(86,168,100,0.2)',
                color: isListening ? '#ef4444' : '#86a878',
                borderRadius: '50%',
                padding: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 300ms ease',
              }}
              className={`hover:scale-105 ${isListening ? 'animate-pulse' : ''}`}
              title={isListening ? 'Stop listening' : 'Search with voice'}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => handleCompare()}
              disabled={isLoading}
              style={{
                padding: '10px 24px', borderRadius: '999px',
                background: 'linear-gradient(135deg, #3d8a50, #2d6b3f)',
                border: 'none', color: '#d4f0d8', fontFamily: 'Manrope, sans-serif',
                fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(45,107,63,0.4)',
                letterSpacing: '0.05em',
              }}
            >
              {isLoading ? (
                <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                  Scanning...
                </motion.span>
              ) : 'Compare'}
            </motion.button>
          </motion.div>

          {/* Upload/Camera buttons */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-3 mt-5"
          >
            <button
              onClick={() => uploadInputRef.current?.click()}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 18px', borderRadius: '999px',
                background: 'rgba(86,168,100,0.08)',
                border: '1px solid rgba(86,168,100,0.2)',
                color: 'rgba(160,210,160,0.8)', fontSize: '0.78rem',
                fontFamily: 'Manrope, sans-serif', fontWeight: 500,
                cursor: 'pointer', letterSpacing: '0.05em',
              }}
            >
              <Upload size={13} /> Upload image
            </button>
            <button
              onClick={() => setShowCameraModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 18px', borderRadius: '999px',
                background: 'rgba(86,168,100,0.08)',
                border: '1px solid rgba(86,168,100,0.2)',
                color: 'rgba(160,210,160,0.8)', fontSize: '0.78rem',
                fontFamily: 'Manrope, sans-serif', fontWeight: 500,
                cursor: 'pointer', letterSpacing: '0.05em',
              }}
            >
              <Camera size={13} /> Use camera
            </button>
            <input ref={uploadInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageSelection(e.target.files?.[0])} />
          </motion.div>

          {/* Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-8 mt-16"
          >
            {[
              { icon: <Leaf size={16} />, label: 'Eco Score', value: '92%' },
              { icon: <Zap size={16} />, label: 'Latency', value: '< 1s' },
              { icon: <ShieldCheck size={16} />, label: 'Modes', value: '3' },
            ].map((m) => (
              <div key={m.label} className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1" style={{ color: '#56a864' }}>
                  {m.icon}
                  <span style={{ fontSize: '0.7rem', fontFamily: 'Manrope, sans-serif', letterSpacing: '0.2em', color: 'rgba(140,190,140,0.6)', textTransform: 'uppercase' }}>
                    {m.label}
                  </span>
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 300, color: '#c8e8c0', letterSpacing: '-0.02em' }}>
                  {m.value}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── IMAGE PREVIEW ──────────────────────────────────────────── */}
      <AnimatePresence>
        {previewUrl && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-6 py-8 max-w-4xl mx-auto"
          >
            <div className="rounded-3xl overflow-hidden flex items-center gap-8 p-6"
              style={{ background: 'rgba(30,60,35,0.5)', border: '1px solid rgba(86,168,100,0.15)', backdropFilter: 'blur(20px)' }}>
              <img src={previewUrl} alt="Product preview" className="w-32 h-32 object-cover rounded-2xl" />
              <div>
                <div style={{ color: 'rgba(140,190,140,0.6)', fontSize: '0.72rem', letterSpacing: '0.3em', fontFamily: 'Manrope, sans-serif', marginBottom: '8px' }}>
                  DETECTED OBJECT
                </div>
                <div style={{ color: '#c8e8c0', fontSize: '1.4rem', fontWeight: 400, marginBottom: '6px' }}>
                  {detectedItem || '—'}
                </div>
                <div style={{ color: '#56a864', fontSize: '0.82rem', fontFamily: 'Manrope, sans-serif' }}>
                  {confidence}
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── ANALYSIS SCORES ────────────────────────────────────────── */}
      <AnimatePresence>
        {analysisScores && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="px-6 py-4 max-w-4xl mx-auto"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Sustainability', value: analysisScores.sustainability, icon: <Leaf size={16} /> },
                { label: 'Cost Efficiency', value: analysisScores.cost, icon: <BadgeIndianRupee size={16} /> },
                { label: 'Carbon Impact Efficiency', value: analysisScores.carbon, icon: <Wind size={16} /> },
                { label: 'Reusability', value: analysisScores.reusability, icon: <Droplets size={16} /> },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  style={{
                    background: 'rgba(20,50,25,0.7)',
                    border: '1px solid rgba(86,168,100,0.15)',
                    borderRadius: '20px', padding: '20px',
                    backdropFilter: 'blur(20px)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-3" style={{ color: '#56a864' }}>
                    {s.icon}
                    <span style={{ fontSize: '0.68rem', fontFamily: 'Manrope, sans-serif', letterSpacing: '0.2em', color: 'rgba(140,190,140,0.6)', textTransform: 'uppercase' }}>
                      {s.label}
                    </span>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 300, color: '#c8e8c0', lineHeight: 1 }}>
                    {s.value}<span style={{ fontSize: '0.9rem', color: 'rgba(140,190,140,0.5)' }}>%</span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3" style={{ height: '3px', background: 'rgba(86,168,100,0.1)', borderRadius: '999px', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${s.value}%` }}
                      transition={{ duration: 1, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                      style={{ height: '100%', background: 'linear-gradient(90deg, #3d8a50, #7dc88a)', borderRadius: '999px' }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── RECOMMENDATIONS ────────────────────────────────────────── */}
      <div ref={resultsRef} />
      <AnimatePresence>
        {sortedRecommendations.length > 0 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-6 py-12 max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-10"
            >
              <div style={{ color: 'rgba(140,190,140,0.5)', fontSize: '0.72rem', letterSpacing: '0.35em', fontFamily: 'Manrope, sans-serif', marginBottom: '12px' }}>
                RECOMMENDED ALTERNATIVES
              </div>
              <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 400, color: '#e8f0e2', lineHeight: 1, letterSpacing: '-0.02em' }}>
                Better picks for <em style={{ color: '#7dc88a', fontStyle: 'italic' }}>{detectedItem || query}</em>
              </h2>
              <div style={{ color: 'rgba(140,190,140,0.5)', fontSize: '0.82rem', fontFamily: 'Manrope, sans-serif', marginTop: '8px' }}>
                Ranked for {modeMeta[mode].title} mode · {confidence}
              </div>
            </motion.div>

            <div className="grid gap-5 md:grid-cols-3">
              {sortedRecommendations.map((item, i) => {
                const generatedLinks = getPurchaseLinks(item.name);
                const purchaseLinks = {
                  amazon_link: item.amazon_link || generatedLinks.amazon_link,
                  flipkart_link: item.flipkart_link || generatedLinks.flipkart_link,
                };

                return (
                <motion.article
                  key={item.name}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.12, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -6, transition: { duration: 0.3 } }}
                  style={{
                    background: i === 0
                      ? 'linear-gradient(135deg, rgba(35,75,40,0.9), rgba(20,50,25,0.9))'
                      : 'rgba(18,40,22,0.8)',
                    border: i === 0
                      ? '1px solid rgba(86,168,100,0.35)'
                      : '1px solid rgba(86,168,100,0.1)',
                    borderRadius: '24px',
                    padding: '24px',
                    backdropFilter: 'blur(20px)',
                    cursor: 'default',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                  }}
                >
                  {i === 0 && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                      background: 'linear-gradient(90deg, transparent, #56a864, transparent)',
                    }} />
                  )}

                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div style={{ fontSize: '1.15rem', color: '#c8e8c0', fontWeight: 400, lineHeight: 1.3 }}>
                      {item.name}
                    </div>
                    {i === 0 && (
                      <span style={{
                        flexShrink: 0, padding: '4px 10px', borderRadius: '999px',
                        background: 'rgba(86,168,100,0.2)', border: '1px solid rgba(86,168,100,0.3)',
                        color: '#7dc88a', fontSize: '0.65rem', fontFamily: 'Manrope, sans-serif',
                        fontWeight: 700, letterSpacing: '0.15em',
                      }}>
                        TOP PICK
                      </span>
                    )}
                  </div>

                  <p style={{ color: 'rgba(160,210,160,0.65)', fontSize: '0.85rem', lineHeight: 1.7, fontFamily: 'Manrope, sans-serif', marginBottom: '20px', minHeight: '60px' }}>
                     {item.reason}
                  </p>

                  {/* Score bar */}
                  <div className="mb-4">
                    <div className="flex justify-between mb-2">
                      <span style={{ color: 'rgba(140,190,140,0.5)', fontSize: '0.7rem', fontFamily: 'Manrope, sans-serif', letterSpacing: '0.15em' }}>SUSTAINABILITY</span>
                      <span style={{ color: '#7dc88a', fontSize: '0.85rem', fontFamily: 'Manrope, sans-serif', fontWeight: 600 }}>{item.sustainability_score}/100</span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(86,168,100,0.1)', borderRadius: '999px', overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.sustainability_score}%` }}
                        transition={{ duration: 1, delay: 0.3 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                        style={{ height: '100%', background: 'linear-gradient(90deg, #2d6b3f, #7dc88a)', borderRadius: '999px' }}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto' }}>
                  <div className="flex items-center justify-between">
                    <div style={{ color: 'rgba(140,190,140,0.5)', fontSize: '0.7rem', fontFamily: 'Manrope, sans-serif', letterSpacing: '0.15em' }}>
                      PRICE BRACKET
                    </div>
                    <div className="flex items-center gap-2">
                      <span style={{
                        padding: '2px 8px', borderRadius: '4px',
                        fontSize: '0.62rem', fontFamily: 'Manrope, sans-serif', fontWeight: 600,
                        background: item.alternativeType === 'eco' ? 'rgba(16,185,129,0.15)' : item.alternativeType === 'budget' ? 'rgba(59,130,246,0.15)' : 'rgba(168,85,247,0.15)',
                        color: item.alternativeType === 'eco' ? '#34d399' : item.alternativeType === 'budget' ? '#60a5fa' : '#c084fc',
                        border: item.alternativeType === 'eco' ? '1px solid rgba(16,185,129,0.25)' : item.alternativeType === 'budget' ? '1px solid rgba(59,130,246,0.25)' : '1px solid rgba(168,85,247,0.25)',
                      }}>
                        {item.alternativeType ? (item.alternativeType.charAt(0).toUpperCase() + item.alternativeType.slice(1) + ' Priority') : 'Alternative'}
                      </span>
                      <span style={{ color: '#c8e8c0', fontSize: '1.1rem', fontWeight: 300, letterSpacing: '-0.01em' }}>
                        ₹{item.price}
                      </span>
                    </div>
                  </div>

                  <div
                    className="mt-5 rounded-2xl border p-3"
                    style={{
                      background: 'rgba(86,168,100,0.045)',
                      borderColor: 'rgba(86,168,100,0.12)',
                      boxShadow: i === 0 ? '0 0 28px rgba(86,168,100,0.08)' : 'none',
                    }}
                  >
                    <div className="mb-2 flex items-center gap-2" style={{ color: '#86c890', fontSize: '0.62rem', fontFamily: 'Manrope, sans-serif', fontWeight: 800, letterSpacing: '0.18em' }}>
                      <ShoppingBag size={13} />
                      BEST PRICE SEARCH
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={purchaseLinks.amazon_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold transition-all duration-300 hover:-translate-y-0.5"
                        style={{
                          background: 'rgba(249,115,22,0.11)',
                          border: '1px solid rgba(249,115,22,0.22)',
                          color: '#fdba74',
                          boxShadow: '0 0 18px rgba(249,115,22,0.08)',
                        }}
                      >
                        Amazon <ExternalLink size={12} />
                      </a>
                      <a
                        href={purchaseLinks.flipkart_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold transition-all duration-300 hover:-translate-y-0.5"
                        style={{
                          background: 'rgba(59,130,246,0.11)',
                          border: '1px solid rgba(59,130,246,0.22)',
                          color: '#93c5fd',
                          boxShadow: '0 0 18px rgba(59,130,246,0.08)',
                        }}
                      >
                        Flipkart <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>

                  <button
                    onClick={() => saveAlternative(item)}
                    className="w-full mt-4 py-2 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider transition-all duration-300 border hover:bg-[#56a864]/20"
                    style={{
                      background: 'rgba(86,168,100,0.08)',
                      borderColor: 'rgba(86,168,100,0.2)',
                      color: '#86a878',
                    }}
                  >
                    <Heart size={14} /> Save Alternative
                  </button>
                  </div>
                </motion.article>
                );
              })}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-center py-8 px-6"
            style={{ color: 'rgba(255,140,140,0.7)', fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem' }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── USER DASHBOARD SECTION ───────────────────────────────────── */}
      <section id="dashboard-section" className="relative px-6 py-16 max-w-6xl mx-auto scroll-mt-24" style={{ borderTop: '1px solid rgba(86,168,100,0.08)' }}>
        {/* Background decorative Orbs */}
        <Orb cx="75%" cy="30%" r={150} delay={1} />

        <div className="mb-10 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3"
            style={{ background: 'rgba(86,168,100,0.08)', border: '1px solid rgba(86,168,100,0.15)' }}>
            <TrendingUp size={12} color="#86c890" />
            <span style={{ color: '#86c890', fontSize: '0.65rem', letterSpacing: '0.2em', fontFamily: 'Manrope, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>
              User Space
            </span>
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 400, color: '#e8f0e2', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            My Eco <em style={{ color: '#7dc88a', fontStyle: 'italic' }}>Dashboard</em>
          </h2>
          <p style={{ color: 'rgba(160,210,160,0.5)', fontSize: '0.85rem', fontFamily: 'Manrope, sans-serif', marginTop: '8px' }}>
            Access all your stats, history, saved alternatives, and preferences directly on this page.
          </p>
        </div>

        {/* Dynamic Tabs Nav */}
        <div className="flex flex-wrap gap-2 mb-8 border-b pb-4" style={{ borderColor: 'rgba(86,168,100,0.1)' }}>
          {[
            { id: 'overview', label: 'Overview', icon: <TrendingUp size={14} /> },
            { id: 'history', label: 'Scan History', icon: <Clock size={14} /> },
            { id: 'saved', label: 'Saved Alternatives', icon: <Bookmark size={14} /> },
            { id: 'settings', label: 'Settings', icon: <User size={14} /> },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '999px',
                  fontSize: '0.8rem',
                  fontFamily: 'Manrope, sans-serif',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 200ms',
                  cursor: 'pointer',
                  border: active ? '1px solid rgba(86,168,100,0.3)' : '1px solid transparent',
                  background: active ? 'rgba(86,168,100,0.15)' : 'transparent',
                  color: active ? '#7dc88a' : 'rgba(180,210,170,0.6)',
                }}
                className="hover:text-[#a8d4a0] hover:bg-[#56a864]/5"
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div style={{ fontFamily: 'Manrope, sans-serif' }}>
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    name: "Total Scans",
                    value: recentScans.length.toString(),
                    icon: <ScanLine className="h-6 w-6 text-emerald-400" />,
                    bg: "rgba(86,168,100,0.08)"
                  },
                  {
                    name: "Avg. Eco Score",
                    value: recentScans.length > 0
                      ? (recentScans.reduce((acc, curr) => acc + (curr.score || 0), 0) / recentScans.length).toFixed(1)
                      : "0.0",
                    icon: <Leaf className="h-6 w-6 text-[#7dc88a]" />,
                    bg: "rgba(125,200,138,0.08)"
                  },
                  {
                    name: "Saved Alternatives",
                    value: savedAlts.length.toString(),
                    icon: <Bookmark className="h-6 w-6 text-emerald-400" />,
                    bg: "rgba(86,168,100,0.08)"
                  },
                  {
                    name: "Carbon Offset (kg)",
                    value: (recentScans.length * 0.4 + savedAlts.length * 1.5).toFixed(1),
                    icon: <Wind className="h-6 w-6 text-[#86a878]" />,
                    bg: "rgba(134,168,120,0.08)"
                  }
                ].map((stat) => (
                  <div key={stat.name} className="p-6 rounded-2xl border flex items-center gap-4"
                    style={{ background: 'rgba(18,40,22,0.4)', borderColor: 'rgba(86,168,100,0.1)' }}>
                    <div className="p-3 rounded-xl" style={{ background: stat.bg }}>
                      {stat.icon}
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60" style={{ color: 'rgba(160,210,160,0.5)' }}>
                        {stat.name}
                      </p>
                      <p className="text-2xl font-bold mt-1 text-[#e8f0e2]">
                        {stat.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chart and Recent Scans */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Trend Chart */}
                <div className="lg:col-span-2 rounded-2xl border p-6 flex flex-col justify-between"
                  style={{ background: 'rgba(18,40,22,0.3)', borderColor: 'rgba(86,168,100,0.1)' }}>
                  <div>
                    <h3 className="text-lg font-bold text-[#c8e8c0]">Eco Score History</h3>
                    <p className="text-xs text-muted-foreground mt-1" style={{ color: 'rgba(160,210,160,0.5)' }}>
                      Your scanning average score trend.
                    </p>
                  </div>
                  <div className="h-[340px] sm:h-[360px] w-full mt-6 overflow-visible">
                    {recentScans.length > 0 ? (
                      <Line
                        data={{
                          labels: [...recentScans].reverse().map((scan) => {
                            const name = scan.name || "Unknown";
                            return name.length > 14 ? `${name.slice(0, 13)}...` : name;
                          }),
                          datasets: [
                            {
                              label: 'Eco Score',
                              data: [...recentScans].reverse().map((scan) => scan.score),
                              borderColor: '#7dc88a',
                              backgroundColor: 'rgba(125, 200, 138, 0.1)',
                              borderWidth: 3,
                              tension: 0.42,
                              fill: true,
                              pointBackgroundColor: '#56a864',
                              pointBorderColor: '#b7f5c0',
                              pointBorderWidth: 2,
                              pointRadius: 3,
                              pointHoverRadius: 6,
                              pointHoverBackgroundColor: '#b7f5c0',
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          interaction: {
                            intersect: false,
                            mode: 'index',
                          },
                          layout: {
                            padding: { top: 16, right: 12, bottom: 30, left: 6 },
                          },
                          plugins: {
                            legend: { display: false },
                            tooltip: {
                              backgroundColor: 'rgba(7,20,11,0.96)',
                              borderColor: 'rgba(125,200,138,0.38)',
                              borderWidth: 1,
                              cornerRadius: 12,
                              padding: 12,
                              caretPadding: 10,
                              titleColor: '#c8e8c0',
                              bodyColor: '#9beaab',
                              titleFont: { size: 12, family: 'Manrope', weight: 600 },
                              bodyFont: { size: 12, family: 'Manrope', weight: 600 },
                              displayColors: false,
                              callbacks: {
                                title: (items: any[]) => [...recentScans].reverse()[items[0]?.dataIndex]?.name || 'Eco Score',
                                label: (context: any) => `Score: ${context.parsed.y}/100`
                              }
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              suggestedMax: 30,
                              grid: { color: 'rgba(86,168,100,0.05)' },
                              ticks: {
                                color: 'rgba(160,210,160,0.5)',
                                padding: 8,
                                stepSize: 5,
                              }
                            },
                            x: {
                              offset: true,
                              grid: { display: false },
                              ticks: {
                                color: 'rgba(160,210,160,0.5)',
                                autoSkip: true,
                                autoSkipPadding: 22,
                                maxTicksLimit: 6,
                                minRotation: 38,
                                maxRotation: 45,
                                padding: 12,
                              }
                            }
                          }
                        }}
                      />
                    ) : (
                      <div className="h-full w-full flex flex-col items-center justify-center rounded-xl border border-dashed"
                        style={{ borderColor: 'rgba(86,168,100,0.15)', background: 'rgba(13,31,20,0.2)' }}>
                        <TrendingUp className="h-8 w-8 text-muted-foreground mb-2 opacity-40" style={{ color: '#86a878' }} />
                        <p className="text-sm font-semibold text-[#c8e8c0]">No scan trend yet</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Submit product names to populate history graph.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Scans Side panel */}
                <div className="rounded-2xl border p-6 flex flex-col h-full"
                  style={{ background: 'rgba(18,40,22,0.3)', borderColor: 'rgba(86,168,100,0.1)' }}>
                  <div className="mb-4 flex justify-between items-center">
                    <h3 className="text-base font-bold text-[#c8e8c0]">Recent Scans</h3>
                    {recentScans.length > 0 && (
                      <button onClick={clearAllHistory} className="text-xs hover:text-red-400 transition-colors" style={{ color: 'rgba(160,210,160,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}>
                        Clear
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-3 flex-grow overflow-y-auto max-h-[250px] scrollbar-thin">
                    {recentScans.length > 0 ? (
                      recentScans.slice(0, 5).map((scan) => (
                        <div key={scan.id} className="flex items-center justify-between p-3 rounded-xl transition-all border border-transparent"
                          style={{ background: 'rgba(18,40,22,0.4)', borderColor: 'rgba(86,168,100,0.05)' }}>
                          <div>
                            <p className="font-semibold text-sm text-[#e8f0e2]">{scan.name}</p>
                            <p className="text-xs" style={{ color: 'rgba(160,210,160,0.4)' }}>{scan.date}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${scan.score > 20 ? 'text-emerald-400' : scan.score > 10 ? 'text-amber-400' : 'text-rose-400'}`}>
                              {scan.score}
                            </span>
                            <span className="text-xs" style={{ color: 'rgba(160,210,160,0.3)' }}>/100</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground flex flex-col items-center justify-center h-full">
                        <ScanLine className="h-6 w-6 mb-2 opacity-30" style={{ color: '#86a878' }} />
                        <p className="text-xs text-[#c8e8c0]">No scans yet.</p>
                      </div>
                    )}
                  </div>
                  
                  <button onClick={() => setActiveTab('history')} className="w-full mt-4 py-2 text-xs font-semibold rounded-xl text-center hover:bg-[#56a864]/10 transition-colors border"
                    style={{ background: 'rgba(86,168,100,0.05)', borderColor: 'rgba(86,168,100,0.15)', color: '#86a878', cursor: 'pointer' }}>
                    View All History
                  </button>
                </div>

              </div>

            </motion.div>
          )}

          {/* TAB 2: HISTORY */}
          {activeTab === 'history' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-[#c8e8c0]">Scan History log</h3>
                {recentScans.length > 0 && (
                  <button onClick={clearAllHistory} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-all cursor-pointer">
                    Clear All History
                  </button>
                )}
              </div>

              {recentScans.length === 0 ? (
                <div className="text-center py-16 rounded-2xl border" style={{ background: 'rgba(18,40,22,0.2)', borderColor: 'rgba(86,168,100,0.1)' }}>
                  <Clock className="h-10 w-10 mx-auto mb-3 opacity-40" style={{ color: '#86a878' }} />
                  <h4 className="text-sm font-semibold text-[#c8e8c0]">No scans logged</h4>
                  <p className="text-xs text-muted-foreground mt-1">Try scanning products above or using the live scanner page.</p>
                </div>
              ) : (
                <div className="rounded-2xl border overflow-hidden shadow-md" style={{ background: 'rgba(18,40,22,0.2)', borderColor: 'rgba(86,168,100,0.1)' }}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase" style={{ background: 'rgba(86,168,100,0.06)', color: 'rgba(160,210,160,0.5)', borderBottom: '1px solid rgba(86,168,100,0.1)' }}>
                        <tr>
                          <th className="px-6 py-4 font-bold">Product Name</th>
                          <th className="px-6 py-4 font-bold">Date Scanned</th>
                          <th className="px-6 py-4 font-bold text-center">Sustainability Score</th>
                          <th className="px-6 py-4 font-bold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody style={{ color: '#c8e8c0' }}>
                        {recentScans.map((scan) => (
                          <tr key={scan.id} className="border-b hover:bg-emerald-950/20 transition-colors" style={{ borderColor: 'rgba(86,168,100,0.06)' }}>
                            <td className="px-6 py-4 font-semibold text-sm">
                              {scan.name}
                            </td>
                            <td className="px-6 py-4 text-xs" style={{ color: 'rgba(160,210,160,0.5)' }}>
                              {scan.date}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${scan.score > 20 ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20' : scan.score > 10 ? 'bg-amber-950/40 text-amber-400 border border-amber-500/20' : 'bg-rose-950/40 text-rose-400 border border-rose-500/20'}`}>
                                {scan.score} <span className="text-[10px] font-normal opacity-60">/100</span>
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Link href={`/scanner/results?id=${scan.id}`}>
                                  <button className="px-3 py-1 rounded-lg text-xs font-semibold border hover:bg-[#56a864]/20 transition-all"
                                    style={{ background: 'rgba(86,168,100,0.05)', borderColor: 'rgba(86,168,100,0.2)', color: '#86a878', cursor: 'pointer' }}>
                                    View details
                                  </button>
                                </Link>
                                <button onClick={() => deleteScan(scan.id)} className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/25 transition-all" style={{ background: 'none', cursor: 'pointer' }}>
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: SAVED ALTERNATIVES */}
          {activeTab === 'saved' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <h3 className="text-lg font-bold text-[#c8e8c0]">My Bookmarked Alternatives</h3>

              {savedAlts.length === 0 ? (
                <div className="text-center py-16 rounded-2xl border" style={{ background: 'rgba(18,40,22,0.2)', borderColor: 'rgba(86,168,100,0.1)' }}>
                  <Bookmark className="h-10 w-10 mx-auto mb-3 opacity-40" style={{ color: '#86a878' }} />
                  <h4 className="text-sm font-semibold text-[#c8e8c0]">Nothing saved yet</h4>
                  <p className="text-xs text-muted-foreground mt-1">Bookmarked suggestions from scans will show up here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedAlts.map((item, idx) => (
                    <div key={idx} className="relative rounded-2xl border p-6 flex flex-col justify-between"
                      style={{ background: 'rgba(18,40,22,0.3)', borderColor: 'rgba(86,168,100,0.1)' }}>
                      
                      <div className="absolute top-4 right-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border
                          ${item.type === 'eco' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20' : 
                            item.type === 'budget' ? 'bg-blue-950/40 text-blue-400 border-blue-500/20' : 
                            'bg-purple-950/40 text-purple-400 border-purple-500/20'}`}>
                          {item.type} Priority
                        </span>
                      </div>
                      
                      <div className="mt-2">
                        <h4 className="text-base font-bold text-[#c8e8c0] pr-20">{item.name}</h4>
                        <p className="text-xs mt-1 font-semibold" style={{ color: '#86c890' }}>{item.material}</p>
                        
                        <div className="p-3 mt-4 rounded-xl text-xs leading-relaxed" style={{ background: 'rgba(86,168,100,0.06)', color: 'rgba(160,210,160,0.7)' }}>
                          {item.reason}
                        </div>
                      </div>

                      <div className="mt-6 space-y-4">
                        <div className="flex items-center justify-between border-t pt-4" style={{ borderColor: 'rgba(86,168,100,0.08)' }}>
                          <div className="flex items-center gap-1.5">
                            <Award size={14} className="text-emerald-400" />
                            <span className="font-bold text-sm text-[#e8f0e2]">{item.score}/100</span>
                          </div>
                          <div className="font-semibold text-sm text-[#e8f0e2]">{item.price}</div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2">
                          <button 
                            className="py-2 text-xs font-semibold rounded-xl text-center text-rose-400 hover:bg-rose-500/10 border border-rose-500/15 transition-colors"
                            onClick={() => removeSavedAlt(item.name)}
                            style={{ background: 'transparent', cursor: 'pointer' }}
                          >
                            Remove
                          </button>
                          <a
                            href={item.amazon_link || getPurchaseLinks(item.name).amazon_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-2 text-xs font-semibold rounded-xl text-center transition-colors border border-orange-400/20 bg-orange-500/10 text-orange-300 hover:bg-orange-500/20"
                          >
                            Amazon
                          </a>
                          <a
                            href={item.flipkart_link || getPurchaseLinks(item.name).flipkart_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-2 text-xs font-semibold rounded-xl text-center transition-colors border border-blue-400/20 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20"
                          >
                            Flipkart
                          </a>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 4: SETTINGS */}
          {activeTab === 'settings' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-xl">
              <h3 className="text-lg font-bold text-[#c8e8c0]">Profile & App Preferences</h3>
              
              {/* Profile Card */}
              <div className="rounded-2xl border p-6 space-y-4" style={{ background: 'rgba(18,40,22,0.3)', borderColor: 'rgba(86,168,100,0.1)' }}>
                <div className="flex items-center gap-2 border-b pb-3 mb-2" style={{ borderColor: 'rgba(86,168,100,0.08)' }}>
                  <User size={16} className="text-[#7dc88a]" />
                  <span className="font-bold text-sm text-[#c8e8c0]">Personal Profile</span>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold" style={{ color: 'rgba(160,210,160,0.6)' }}>Full Name</label>
                    <input 
                      value={settingsForm.name}
                      onChange={(e) => setSettingsForm({...settingsForm, name: e.target.value})}
                      className="w-full text-sm rounded-xl border px-3 py-2 text-[#c8dfc0]"
                      style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(86,168,100,0.25)', outline: 'none' }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold" style={{ color: 'rgba(160,210,160,0.6)' }}>Email Address</label>
                    <input 
                      value={settingsForm.email}
                      type="email"
                      onChange={(e) => setSettingsForm({...settingsForm, email: e.target.value})}
                      className="w-full text-sm rounded-xl border px-3 py-2 text-[#c8dfc0]"
                      style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(86,168,100,0.25)', outline: 'none' }}
                    />
                  </div>
                </div>
              </div>

              {/* Preferences Card */}
              <div className="rounded-2xl border p-6 space-y-4" style={{ background: 'rgba(18,40,22,0.3)', borderColor: 'rgba(86,168,100,0.1)' }}>
                <div className="flex items-center gap-2 border-b pb-3 mb-2" style={{ borderColor: 'rgba(86,168,100,0.08)' }}>
                  <Globe size={16} className="text-emerald-400" />
                  <span className="font-bold text-sm text-[#c8e8c0]">Application Preferences</span>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#e8f0e2]">Visual Theme</p>
                      <p className="text-xs" style={{ color: 'rgba(160,210,160,0.4)' }}>Choose between dark or light system theme.</p>
                    </div>
                    <div className="flex bg-emerald-950/60 p-0.5 rounded-lg border" style={{ borderColor: 'rgba(86,168,100,0.15)' }}>
                      <button 
                        onClick={() => setTheme('light')}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all border-none ${theme === 'light' ? 'bg-[#56a864] text-white' : 'bg-transparent text-emerald-600 dark:text-emerald-400/60'}`}
                        style={{ cursor: 'pointer' }}
                      >
                        Light
                      </button>
                      <button 
                        onClick={() => setTheme('dark')}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all border-none ${theme === 'dark' ? 'bg-[#56a864] text-white' : 'bg-transparent text-emerald-600 dark:text-emerald-400/60'}`}
                        style={{ cursor: 'pointer' }}
                      >
                        Dark
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t pt-4" style={{ borderColor: 'rgba(86,168,100,0.08)' }}>
                    <div>
                      <p className="text-sm font-semibold text-[#e8f0e2]">Preferred Currency</p>
                      <p className="text-xs" style={{ color: 'rgba(160,210,160,0.4)' }}>Set default currency for scanned item cost.</p>
                    </div>
                    <select 
                      className="rounded-xl border px-3 py-1.5 text-xs text-[#c8dfc0]"
                      style={{ background: 'rgba(13,31,20,0.9)', borderColor: 'rgba(86,168,100,0.25)', outline: 'none' }}
                      value={settingsForm.currency}
                      onChange={(e) => setSettingsForm({...settingsForm, currency: e.target.value})}
                    >
                      <option>INR (₹)</option>
                      <option>USD ($)</option>
                      <option>EUR (€)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={saveSettings} className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center gap-1.5 border-none" style={{ cursor: 'pointer' }}>
                  <Save size={14} /> Save Preferences
                </button>
              </div>

            </motion.div>
          )}

        </div>
      </section>

      {/* ── ABOUT & TEAM SECTION ───────────────────────────────────── */}
      <section id="about" className="relative px-6 py-24 max-w-6xl mx-auto" style={{ borderTop: '1px solid rgba(86,168,100,0.08)' }}>
        {/* Decorative elements */}
        <Orb cx="10%" cy="40%" r={180} delay={1} />
        <Orb cx="90%" cy="70%" r={220} delay={3} />

        <div className="grid gap-16 md:grid-cols-2 items-center mb-24">
          {/* Mission Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full"
              style={{ background: 'rgba(86,168,100,0.08)', border: '1px solid rgba(86,168,100,0.15)' }}>
              <Leaf size={12} color="#86c890" />
              <span style={{ color: '#86c890', fontSize: '0.65rem', letterSpacing: '0.2em', fontFamily: 'Manrope, sans-serif', fontWeight: 600, textTransform: 'uppercase' }}>
                Our Mission
              </span>
            </div>
            
            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 400, color: '#e8f0e2', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              Why We Built <br />
              <em style={{ color: '#7dc88a', fontStyle: 'italic' }}>GreenLens</em>
            </h2>
            
            <p style={{ color: 'rgba(160,210,160,0.65)', fontSize: '0.95rem', lineHeight: 1.8, fontFamily: 'Manrope, sans-serif' }}>
              Every day, we make dozens of small purchasing decisions. Unfortunately, it's often difficult to know the true environmental impact of the products we buy. Greenwashing and confusing labels make it hard to choose the genuinely sustainable option.
            </p>
            
            <p style={{ color: 'rgba(160,210,160,0.65)', fontSize: '0.95rem', lineHeight: 1.8, fontFamily: 'Manrope, sans-serif' }}>
              We believe technology can bridge this gap. By leveraging advanced AI vision models, GreenLens can instantly analyze materials, estimate carbon footprints, and score a product's reusability, empowering you to make mindful choices.
            </p>
          </motion.div>

          {/* Mission Features Grid */}
          <div className="grid gap-6">
            {[
              {
                icon: <ScanLine size={24} className="text-[#86c890]" />,
                title: "Instant Scanning",
                desc: "Point your camera or upload a photo to identify materials and reveal detailed eco-data in seconds."
              },
              {
                icon: <ShieldCheck size={24} className="text-[#86c890]" />,
                title: "Honest Scoring",
                desc: "Our algorithms break down carbon footprint, cost, and lifecycle metrics to cut through greenwashing."
              },
              {
                icon: <Heart size={24} className="text-[#86c890]" />,
                title: "Community Driven",
                desc: "Together, we shift market demands by selecting cleaner alternatives and reducing global plastic waste."
              }
            ].map((feat, index) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                whileHover={{ x: 6, transition: { duration: 0.2 } }}
                style={{
                  background: 'rgba(18,40,22,0.6)',
                  border: '1px solid rgba(86,168,100,0.1)',
                  borderRadius: '20px',
                  padding: '20px',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'flex-start'
                }}
              >
                <div className="flex-shrink-0 p-3 rounded-xl" style={{ background: 'rgba(86,168,100,0.08)', border: '1px solid rgba(86,168,100,0.15)' }}>
                  {feat.icon}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', color: '#c8e8c0', fontWeight: 500, marginBottom: '6px' }}>{feat.title}</h3>
                  <p style={{ color: 'rgba(160,210,160,0.55)', fontSize: '0.85rem', lineHeight: 1.6, fontFamily: 'Manrope, sans-serif' }}>{feat.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div className="text-center pt-8" style={{ borderTop: '1px solid rgba(86,168,100,0.06)' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-4 mb-16"
          >
            <span style={{ color: '#86c890', fontSize: '0.7rem', letterSpacing: '0.3em', fontFamily: 'Manrope, sans-serif', fontWeight: 700, textTransform: 'uppercase' }}>
              TEAM ECONOVA
            </span>
            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 400, color: '#e8f0e2', letterSpacing: '-0.02em' }}>
              The Minds Behind <em style={{ color: '#7dc88a', fontStyle: 'italic' }}>GreenLens</em>
            </h2>
            <p style={{ color: 'rgba(160,210,160,0.5)', fontSize: '0.85rem', fontFamily: 'Manrope, sans-serif', fontWeight: 500 }}>
              Techno India University &middot; OmTech Hackathon 2026 &middot; Open Innovation Track
            </p>
          </motion.div>

          {/* Team grid */}
          <div className="grid gap-8 grid-cols-2 md:grid-cols-5 justify-center max-w-5xl mx-auto">
            {[
              { initials: 'SS', name: 'Sagnik Sarkar' },
              { initials: 'CR', name: 'Chirandip Roy' },
              { initials: 'SS', name: 'Soumodeep Saha' },
              { initials: 'RC', name: 'Rudrava Chowdhury' },
              { initials: 'RG', name: 'Ritankar Ghosh' },
            ].map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="flex flex-col items-center p-6 rounded-2xl transition-colors duration-300"
                style={{
                  background: 'rgba(18,40,22,0.4)',
                  border: '1px solid rgba(86,168,100,0.06)'
                }}
              >
                <div
                  className="h-20 w-20 rounded-full border flex items-center justify-center font-serif text-xl font-bold text-white shadow-lg mb-4"
                  style={{
                    background: 'radial-gradient(circle, rgba(86,168,100,0.15) 0%, rgba(20,50,25,0.3) 100%)',
                    borderColor: 'rgba(86,168,100,0.25)',
                    boxShadow: '0 8px 24px rgba(13,31,20,0.5), inset 0 2px 4px rgba(255,255,255,0.05)',
                    color: '#c8e8c0',
                  }}
                >
                  {member.initials}
                </div>
                <h4 style={{ fontSize: '0.95rem', color: '#e8f0e2', fontWeight: 500 }}>
                  {member.name}
                </h4>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <footer className="mt-16 px-8 py-12 text-center" style={{ borderTop: '1px solid rgba(86,168,100,0.08)' }}>
        <div className="flex items-center justify-center gap-3 mb-4">
          <Recycle size={16} color="#3d6b45" />
          <span style={{ color: 'rgba(140,190,140,0.4)', fontSize: '0.75rem', fontFamily: 'Manrope, sans-serif', letterSpacing: '0.3em' }}>
            ECONOVA GREENLENS — OMTECH HACKATHON 2026
          </span>
        </div>
        <p style={{ color: 'rgba(140,190,140,0.25)', fontSize: '0.75rem', fontFamily: 'Manrope, sans-serif' }}>
          Powered by Gemini AI · PostgreSQL · Prisma · Next.js 15
        </p>
      </footer>

      {/* ── CAMERA MODAL ───────────────────────────────────────────── */}
      <AnimatePresence>
        {showCameraModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              background: 'rgba(5, 15, 8, 0.85)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-xl overflow-hidden rounded-3xl"
              style={{
                background: '#0d1f14',
                border: '1px solid rgba(86,168,100,0.3)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(86,168,100,0.1)' }}>
                <div className="flex items-center gap-2">
                  <Camera size={16} color="#86c890" />
                  <span style={{ color: '#c8dfc0', fontSize: '0.8rem', letterSpacing: '0.2em', fontFamily: 'Manrope, sans-serif', fontWeight: 600 }}>
                    LIVE SUSTAINABILITY SCANNER
                  </span>
                </div>
                <button
                  onClick={() => setShowCameraModal(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(180,210,170,0.6)',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 200ms',
                  }}
                  className="hover:text-[#a8d4a0] hover:bg-[#56a864]/10"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Webcam Viewport */}
              <div className="relative aspect-video bg-black overflow-hidden flex items-center justify-center">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{
                    facingMode: facingMode,
                    width: 1280,
                    height: 720,
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  onUserMediaError={(err) => {
                    console.error('Camera permission/access error:', err)
                    setError('Unable to access camera. Please verify camera permissions.')
                    setShowCameraModal(false)
                  }}
                />

                {/* Futuristic Scanner Overlay */}
                <div className="absolute inset-0 pointer-events-none" style={{
                  border: '2px solid rgba(86,168,100,0.15)',
                  margin: '20px',
                  borderRadius: '12px',
                }}>
                  {/* Corner notches */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#7dc88a]" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#7dc88a]" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#7dc88a]" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#7dc88a]" />

                  {/* Scanner moving beam */}
                  <motion.div
                    className="absolute left-0 right-0 h-0.5"
                    style={{
                      background: 'linear-gradient(90deg, transparent, #7dc88a, transparent)',
                      boxShadow: '0 0 10px #7dc88a, 0 0 20px #7dc88a',
                    }}
                    animate={{ top: ['5%', '95%', '5%'] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </div>
              </div>

              {/* Control Panel */}
              <div className="flex items-center justify-between px-8 py-5" style={{ background: 'rgba(13,31,20,0.5)' }}>
                {/* Switch Camera */}
                <button
                  onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '999px',
                    background: 'rgba(86,168,100,0.08)',
                    border: '1px solid rgba(86,168,100,0.15)',
                    color: 'rgba(160,210,160,0.8)',
                    fontSize: '0.72rem',
                    fontFamily: 'Manrope, sans-serif',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                  className="hover:bg-[#56a864]/20"
                >
                  <RefreshCw size={12} /> Flip Camera
                </button>

                {/* Shutter Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCameraCapture}
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3d8a50, #2d6b3f)',
                    border: '4px solid rgba(200, 239, 208, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 10px 25px rgba(45,107,63,0.4)',
                  }}
                >
                  <div className="w-4 h-4 rounded-full bg-white opacity-90" />
                </motion.button>

                {/* Cancel */}
                <button
                  onClick={() => setShowCameraModal(false)}
                  style={{
                    padding: '8px 16px',
                    color: 'rgba(180,210,170,0.6)',
                    fontSize: '0.72rem',
                    fontFamily: 'Manrope, sans-serif',
                    fontWeight: 500,
                    cursor: 'pointer',
                    background: 'transparent',
                    border: 'none',
                  }}
                  className="hover:text-[#a8d4a0]"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
