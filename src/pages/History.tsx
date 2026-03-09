import { motion } from "framer-motion";
import { Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import EmotionBadge from "@/components/EmotionBadge";

const historyData = [
  { id: 1, date: "2026-03-09", time: "14:32", emotion: "Happy", confidence: 92, source: "Webcam" },
  { id: 2, date: "2026-03-09", time: "14:15", emotion: "Surprise", confidence: 78, source: "Upload" },
  { id: 3, date: "2026-03-09", time: "11:42", emotion: "Neutral", confidence: 85, source: "Webcam" },
  { id: 4, date: "2026-03-08", time: "19:08", emotion: "Sad", confidence: 64, source: "Upload" },
  { id: 5, date: "2026-03-08", time: "15:20", emotion: "Happy", confidence: 88, source: "Webcam" },
  { id: 6, date: "2026-03-08", time: "10:05", emotion: "Angry", confidence: 55, source: "Upload" },
  { id: 7, date: "2026-03-07", time: "22:18", emotion: "Fear", confidence: 42, source: "Webcam" },
  { id: 8, date: "2026-03-07", time: "16:30", emotion: "Happy", confidence: 95, source: "Webcam" },
  { id: 9, date: "2026-03-07", time: "09:12", emotion: "Neutral", confidence: 79, source: "Upload" },
  { id: 10, date: "2026-03-06", time: "20:45", emotion: "Disgust", confidence: 38, source: "Upload" },
];

const History = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main className="pt-20 pb-10 px-4">
      <div className="container mx-auto max-w-4xl">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Detection History</h1>
            <p className="text-muted-foreground mt-1">Browse your past emotion detections.</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" /> Filter
          </Button>
        </motion.div>

        <div className="glass-card rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground font-medium">
            <div className="col-span-3">Date</div>
            <div className="col-span-3">Emotion</div>
            <div className="col-span-2">Confidence</div>
            <div className="col-span-2">Source</div>
            <div className="col-span-2 text-right">Status</div>
          </div>

          {/* Rows */}
          {historyData.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-border last:border-0 items-center hover:bg-secondary/30 transition-colors"
            >
              <div className="col-span-3 flex items-center gap-2 text-sm">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{item.date}</span>
                <span className="text-muted-foreground">{item.time}</span>
              </div>
              <div className="col-span-3">
                <EmotionBadge emotion={item.emotion} size="sm" />
              </div>
              <div className="col-span-2">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${item.confidence}%` }} />
                  </div>
                  <span className="text-sm">{item.confidence}%</span>
                </div>
              </div>
              <div className="col-span-2 text-sm text-muted-foreground">{item.source}</div>
              <div className="col-span-2 text-right">
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">Completed</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  </div>
);

export default History;
