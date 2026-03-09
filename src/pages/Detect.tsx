import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, X, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import EmotionBadge from "@/components/EmotionBadge";

type DetectionResult = {
  emotion: string;
  confidence: number;
}[];

const mockResults: DetectionResult = [
  { emotion: "Happy", confidence: 72 },
  { emotion: "Surprise", confidence: 15 },
  { emotion: "Neutral", confidence: 8 },
  { emotion: "Sad", confidence: 3 },
  { emotion: "Angry", confidence: 1 },
  { emotion: "Fear", confidence: 0.5 },
  { emotion: "Disgust", confidence: 0.5 },
];

const Detect = () => {
  const [mode, setMode] = useState<"webcam" | "upload">("webcam");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<DetectionResult | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [webcamActive, setWebcamActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setWebcamActive(true);
      }
    } catch {
      console.error("Webcam access denied");
    }
  }, []);

  const stopWebcam = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((t) => t.stop());
      videoRef.current.srcObject = null;
      setWebcamActive(false);
    }
  }, []);

  const simulateAnalysis = () => {
    setIsAnalyzing(true);
    setResults(null);
    setTimeout(() => {
      setResults(mockResults);
      setIsAnalyzing(false);
    }, 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedImage(ev.target?.result as string);
      setResults(null);
    };
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setResults(null);
    setUploadedImage(null);
    stopWebcam();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-10 px-4">
        <div className="container mx-auto max-w-5xl">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
            <h1 className="text-3xl font-display font-bold">Emotion Detection</h1>
            <p className="text-muted-foreground mt-1">Use your webcam or upload an image to detect emotions.</p>
          </motion.div>

          {/* Mode switcher */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={mode === "webcam" ? "default" : "outline"}
              onClick={() => { setMode("webcam"); reset(); }}
              className={mode === "webcam" ? "bg-primary text-primary-foreground" : ""}
            >
              <Camera className="w-4 h-4 mr-2" /> Webcam
            </Button>
            <Button
              variant={mode === "upload" ? "default" : "outline"}
              onClick={() => { setMode("upload"); reset(); }}
              className={mode === "upload" ? "bg-primary text-primary-foreground" : ""}
            >
              <Upload className="w-4 h-4 mr-2" /> Upload
            </Button>
          </div>

          <div className="grid lg:grid-cols-5 gap-6">
            {/* Input area */}
            <div className="lg:col-span-3">
              <motion.div layout className="glass-card rounded-xl overflow-hidden glow-border">
                {mode === "webcam" ? (
                  <div className="aspect-video bg-secondary/50 relative flex items-center justify-center">
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className={`w-full h-full object-cover ${webcamActive ? "block" : "hidden"}`}
                    />
                    {!webcamActive && (
                      <div className="text-center p-8">
                        <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
                        <p className="text-muted-foreground mb-4">Camera feed will appear here</p>
                        <Button onClick={startWebcam} className="bg-primary text-primary-foreground">
                          Start Webcam
                        </Button>
                      </div>
                    )}
                    {webcamActive && (
                      <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                        <Button onClick={simulateAnalysis} disabled={isAnalyzing} className="flex-1 bg-primary text-primary-foreground">
                          {isAnalyzing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</> : "Capture & Analyze"}
                        </Button>
                        <Button variant="outline" onClick={stopWebcam} size="icon">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video bg-secondary/50 relative flex items-center justify-center">
                    {uploadedImage ? (
                      <>
                        <img src={uploadedImage} alt="Uploaded" className="w-full h-full object-contain" />
                        <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                          <Button onClick={simulateAnalysis} disabled={isAnalyzing} className="flex-1 bg-primary text-primary-foreground">
                            {isAnalyzing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</> : "Analyze Image"}
                          </Button>
                          <Button variant="outline" onClick={reset} size="icon">
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div
                        className="text-center p-8 cursor-pointer w-full h-full flex flex-col items-center justify-center"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
                        <p className="text-muted-foreground mb-2">Drop an image here or click to browse</p>
                        <p className="text-xs text-muted-foreground">Supports JPG, PNG, WebP</p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Results */}
            <div className="lg:col-span-2">
              <div className="glass-card rounded-xl p-5 h-full">
                <h3 className="font-display font-semibold mb-4">Results</h3>
                <AnimatePresence mode="wait">
                  {isAnalyzing ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-16"
                    >
                      <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
                      <p className="text-muted-foreground text-sm">Analyzing facial expressions...</p>
                    </motion.div>
                  ) : results ? (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      {/* Primary emotion */}
                      <div className="text-center py-4 border-b border-border mb-4">
                        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Dominant Emotion</p>
                        <EmotionBadge emotion={results[0].emotion} confidence={results[0].confidence} size="lg" />
                      </div>
                      {/* All emotions */}
                      {results.map((r) => (
                        <div key={r.emotion} className="flex items-center gap-3">
                          <EmotionBadge emotion={r.emotion} size="sm" />
                          <div className="flex-1">
                            <div className="h-2 rounded-full bg-secondary overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${r.confidence}%` }}
                                transition={{ duration: 0.6, delay: 0.1 }}
                                className="h-full rounded-full bg-primary"
                              />
                            </div>
                          </div>
                          <span className="text-sm font-medium w-12 text-right">{r.confidence}%</span>
                        </div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-16 text-center"
                    >
                      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-3">
                        <Camera className="w-7 h-7 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground text-sm">Capture or upload an image to see results</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Detect;
