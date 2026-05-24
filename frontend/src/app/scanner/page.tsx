"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/navbar";
import { Upload, Camera as CameraIcon, Loader2, X, Aperture, Search, Mic, MicOff, Barcode, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Webcam from "react-webcam";
import { BarcodeScanner } from "@/components/barcode-scanner";

const playBeep = () => {
  if (typeof window === "undefined") return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {
    console.error("Failed to play scan sound:", e);
  }
};

export default function ScannerPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const recognitionRef = useRef<any>(null);
  const router = useRouter();

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
          setTextInput(transcript);
          toast.success(`Recognized: "${transcript}"`);
          setTimeout(() => {
            scanText(transcript);
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

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      if (typeof reader.result === 'string') {
        await scanBase64Image(reader.result);
      }
    };
  };

  const scanBase64Image = async (base64data: string) => {
    setIsScanning(true);
    setShowCamera(false); // Close camera if it was open
    toast.info("Analyzing product...", { description: "Our AI is scanning for materials and environmental impact." });
    
    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64data }),
      });

      if (!response.ok) throw new Error("Failed to scan product");
      
      const data = await response.json();
      
      // Save to local history for dashboard
      const scanRecord = {
        id: data.scanId || Date.now(),
        name: data.data.productName,
        score: data.data.sustainabilityScore,
        date: new Date().toLocaleDateString(),
        fullData: data.data,
      };
      const existingHistory = JSON.parse(localStorage.getItem('econova_history') || '[]');
      localStorage.setItem('econova_history', JSON.stringify([scanRecord, ...existingHistory]));

      // Save the raw data payload for the results page to render dynamically
      localStorage.setItem('econova_current_scan', JSON.stringify(data.data));

      if (data.error) {
        toast.warning("API Fallback Triggered", { description: data.error });
      } else {
        toast.success("Scan complete!");
      }
      
      playBeep();
      router.push(`/scanner/results?id=${data.scanId}`);
    } catch (error) {
      console.error(error);
      toast.error("Scanning failed. Please try again.");
      setIsScanning(false);
    }
  };

  const capturePhoto = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      scanBase64Image(imageSrc);
    } else {
      toast.error("Failed to capture image. Please make sure your camera is ready and try again.");
    }
  };

  const scanText = async (text: string) => {
    setIsScanning(true);
    toast.info("Analyzing description...", { description: "Our AI is checking for materials and environmental impact." });
    
    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error("Failed to scan product");
      
      const data = await response.json();
      
      // Save to local history for dashboard
      const scanRecord = {
        id: data.scanId || Date.now(),
        name: data.data.productName,
        score: data.data.sustainabilityScore,
        date: new Date().toLocaleDateString(),
        fullData: data.data,
      };
      const existingHistory = JSON.parse(localStorage.getItem('econova_history') || '[]');
      localStorage.setItem('econova_history', JSON.stringify([scanRecord, ...existingHistory]));

      // Save the raw data payload for the results page to render dynamically
      localStorage.setItem('econova_current_scan', JSON.stringify(data.data));

      if (data.error) {
        toast.warning("API Fallback Triggered", { description: data.error });
      } else {
        toast.success("Analysis complete!");
      }
      
      playBeep();
      router.push(`/scanner/results?id=${data.scanId}`);
    } catch (error) {
      console.error(error);
      toast.error("Analysis failed. Please try again.");
      setIsScanning(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <Navbar />
      
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-2xl space-y-8 text-center animate-in fade-in zoom-in duration-500">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Product Scanner</h1>
            <p className="text-muted-foreground">Upload an image, scan a barcode, or describe a product to see its environmental impact and discover eco-friendly alternatives.</p>
          </div>

          {showCamera ? (
            <div className="relative border-4 border-emerald-500 rounded-3xl overflow-hidden bg-black aspect-square sm:aspect-video flex flex-col items-center justify-center shadow-2xl animate-in zoom-in-95 duration-300">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-4 right-4 z-10 text-white hover:bg-white/20 rounded-full"
                onClick={() => setShowCamera(false)}
              >
                <X className="h-6 w-6" />
              </Button>
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                <Button 
                  size="lg" 
                  className="rounded-full h-16 w-16 p-0 bg-white hover:bg-gray-200 text-emerald-600 shadow-lg border-4 border-emerald-500/30"
                  onClick={capturePhoto}
                >
                  <Aperture className="h-8 w-8" />
                </Button>
              </div>
            </div>
          ) : (
            <div
              className={`relative border-2 border-dashed rounded-3xl p-12 transition-all duration-200 ease-in-out aspect-square sm:aspect-video flex flex-col items-center justify-center ${
                dragActive ? "border-emerald-500 bg-emerald-500/10" : "border-muted-foreground/25 hover:border-emerald-500/50 hover:bg-muted/50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={handleChange}
                disabled={isScanning}
              />
              
              <div className="flex flex-col items-center justify-center space-y-4 pointer-events-none">
                {isScanning ? (
                  <>
                    <div className="h-20 w-20 rounded-full bg-emerald-500/20 flex items-center justify-center animate-pulse">
                      <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
                    </div>
                    <p className="text-lg font-medium">Scanning product with AI...</p>
                    <p className="text-sm text-muted-foreground">This usually takes a few seconds.</p>
                  </>
                ) : (
                  <>
                    <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center">
                      <Upload className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-medium">Drag & drop your image here</p>
                    <p className="text-sm text-muted-foreground">or click to browse from your device</p>
                  </>
                )}
              </div>
            </div>
          )}

          {!showCamera && (
            <>
              {/* Barcode Scanner Section */}
              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0 rounded-full blur-xl opacity-50" />
                  <Button 
                    size="lg" 
                    className="w-full rounded-full px-8 h-14 inline-flex items-center justify-center mx-auto relative bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-lg border border-emerald-400/30"
                    disabled={isScanning}
                    onClick={() => setShowBarcodeScanner(true)}
                  >
                    <Barcode className="mr-2 h-5 w-5" />
                    Scan Product Barcode
                    <Sparkles className="ml-2 h-4 w-4 animate-pulse" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Real-time barcode scanning with product database</p>
              </div>

              <div className="flex items-center justify-center gap-4">
                <div className="h-px bg-border flex-1" />
                <span className="text-muted-foreground text-sm uppercase font-medium tracking-wider">or text search</span>
                <div className="h-px bg-border flex-1" />
              </div>

              <form 
                className="flex w-full gap-2 items-center" 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (textInput.trim()) scanText(textInput);
                }}
              >
                <Input 
                  placeholder="E.g., Plastic water bottle, 500ml" 
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  disabled={isScanning}
                  className="h-14 rounded-full px-6 text-base bg-secondary/50 border-muted-foreground/25 focus-visible:border-emerald-500/50"
                />
                <Button
                  onClick={toggleSpeechRecognition}
                  type="button"
                  variant="outline"
                  size="icon"
                  className={`rounded-full h-14 w-14 shrink-0 transition-all duration-300 ${
                    isListening 
                      ? "bg-red-500/20 hover:bg-red-500/30 text-red-500 border-red-500/40 animate-pulse" 
                      : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border-emerald-500/20"
                  }`}
                  disabled={isScanning}
                  title={isListening ? "Stop listening" : "Search with voice"}
                >
                  {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
                <Button 
                  type="submit"
                  size="lg" 
                  className="rounded-full h-14 px-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={isScanning || !textInput.trim()}
                >
                  <Search className="mr-2 h-5 w-5" />
                  Analyze
                </Button>
              </form>

              <div className="flex items-center justify-center gap-4 mt-2">
                <div className="h-px bg-border flex-1" />
                <span className="text-muted-foreground text-sm uppercase font-medium tracking-wider">or camera</span>
                <div className="h-px bg-border flex-1" />
              </div>

              <Button 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto rounded-full px-8 h-14 inline-flex items-center justify-center mx-auto"
                disabled={isScanning}
                onClick={() => setShowCamera(true)}
              >
                <CameraIcon className="mr-2 h-5 w-5" />
                Open Camera
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner 
        isOpen={showBarcodeScanner} 
        onClose={() => setShowBarcodeScanner(false)} 
      />
    </main>
  );
}
