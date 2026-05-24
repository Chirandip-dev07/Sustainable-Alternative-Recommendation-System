"use client";

import { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { X, Loader2, AlertCircle, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface BarcodeScannerProps {
  onClose: () => void;
  isOpen: boolean;
}

const playBeep = () => {
  if (typeof window === "undefined") return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(1000, ctx.currentTime);
    
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch (e) {
    console.error("Failed to play scan sound:", e);
  }
};

export function BarcodeScanner({ onClose, isOpen }: BarcodeScannerProps) {
  const qrScannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;

    const initScanner = () => {
      try {
        setError(null);
        
        qrScannerRef.current = new Html5QrcodeScanner(
          "qr-scanner-container",
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true,
            disableFlip: false,
          },
          false
        );

        qrScannerRef.current.render(
          async (decodedText: string) => {
            // Prevent multiple rapid scans
            if (scannedBarcode || isScanning || isFetching) return;
            
            setScannedBarcode(decodedText);
            setIsScanning(true);
            playBeep();
            
            // Stop scanning immediately after successful scan
            if (qrScannerRef.current) {
              qrScannerRef.current.pause();
            }

            // Process the barcode
            await processBarcodeData(decodedText);
          },
          (error: any) => {
            // Silent error handling - scanning is still active
          }
        );

        setIsScanning(true);
      } catch (err: any) {
        const errorMsg = err.message || "Failed to initialize scanner";
        setError(errorMsg);
        
        // Check if it's a permission error
        if (errorMsg.includes("Permission denied") || errorMsg.includes("NotAllowedError")) {
          setError("Camera permission denied. Please allow camera access to scan barcodes.");
          toast.error("Camera permission denied");
        } else if (errorMsg.includes("NotFound")) {
          setError("No camera found on this device.");
          toast.error("No camera detected");
        } else {
          toast.error(errorMsg);
        }
      }
    };

    initScanner();

    return () => {
      if (qrScannerRef.current) {
        try {
          qrScannerRef.current.clear();
        } catch (err) {
          console.error("Error cleaning up scanner:", err);
        }
      }
    };
  }, [isOpen, scannedBarcode, isScanning, isFetching]);

  const processBarcodeData = async (barcode: string) => {
    setIsFetching(true);
    toast.info("Fetching product details...", { description: "Scanning OpenFoodFacts database..." });

    try {
      const response = await fetch("/api/barcode/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch barcode data");
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Save to local history
      const scanRecord = {
        id: data.scanId || Date.now(),
        name: data.data.productName,
        score: data.data.sustainabilityScore,
        date: new Date().toLocaleDateString(),
        fullData: data.data,
        barcode: barcode,
        type: "barcode",
      };

      const existingHistory = JSON.parse(localStorage.getItem("econova_history") || "[]");
      localStorage.setItem("econova_history", JSON.stringify([scanRecord, ...existingHistory]));

      // Save the raw data payload for the results page
      localStorage.setItem("econova_current_scan", JSON.stringify(data.data));

      toast.success("Product found! Analyzing sustainability...");
      playBeep();

      // Navigate to results page
      setTimeout(() => {
        onClose();
        router.push(`/scanner/results?id=${data.scanId}`);
      }, 500);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to process barcode";
      toast.error(errorMessage);
      setError(errorMessage);
      setScannedBarcode(null);
      setIsScanning(false);

      // Resume scanning after error
      if (qrScannerRef.current) {
        qrScannerRef.current.resume();
      }
    } finally {
      setIsFetching(false);
    }
  };

  const handleRetry = () => {
    setScannedBarcode(null);
    setError(null);
    setIsScanning(false);

    if (qrScannerRef.current) {
      try {
        qrScannerRef.current.resume();
      } catch (err) {
        console.error("Error resuming scanner:", err);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-background rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-emerald-500/10 to-emerald-500/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-xl">
              <BarChart3 className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Scan Product Barcode</h2>
              <p className="text-sm text-muted-foreground">Point camera at product barcode</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-destructive/20 hover:text-destructive"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Scanner Container */}
        <div className="flex-1 flex flex-col items-center justify-center bg-black overflow-hidden relative">
          {error ? (
            <div className="flex flex-col items-center justify-center space-y-4 p-6 text-center">
              <div className="p-4 bg-destructive/20 rounded-full">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Scanner Error</h3>
                <p className="text-sm text-muted-foreground max-w-xs">{error}</p>
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={handleRetry}>
                  Try Again
                </Button>
                <Button variant="destructive" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          ) : isFetching ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500/30" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg mb-1">Processing Barcode</p>
                <p className="text-sm text-muted-foreground">
                  {scannedBarcode && `Barcode: ${scannedBarcode}`}
                </p>
              </div>
            </div>
          ) : (
            <div id="qr-scanner-container" className="w-full h-full" />
          )}

          {/* Animated Border Overlay */}
          {!error && !isFetching && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-emerald-500 rounded-lg shadow-lg shadow-emerald-500/50 animate-pulse" />
              <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                <div className="text-center text-white text-sm font-medium">
                  <p className="mb-2">📱 Position barcode in frame</p>
                  <div className="flex gap-2 justify-center text-xs">
                    <span className="px-3 py-1 bg-emerald-500/30 rounded-full">Auto Detect</span>
                    <span className="px-3 py-1 bg-emerald-500/30 rounded-full">Real-time</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/50 text-center text-xs text-muted-foreground">
          <p>💡 Tip: Ensure good lighting and hold your device steady for best results</p>
        </div>
      </div>
    </div>
  );
}
