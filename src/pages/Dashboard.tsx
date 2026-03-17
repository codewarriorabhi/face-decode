import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Camera, Image, TrendingUp, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import StatCard from "@/components/StatCard";
import EmotionBadge from "@/components/EmotionBadge";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { toast } from "sonner";
import { format } from "date-fns";

const EMOTION_COLORS: Record<string, string> = {
  happy: "hsl(45, 95%, 55%)",
  sad: "hsl(220, 75%, 55%)",
  angry: "hsl(0, 85%, 55%)",
  surprised: "hsl(30, 95%, 55%)",
  neutral: "hsl(220, 10%, 55%)",
};

interface HistoryRow {
  id: string;
  emotion: string;
  confidence: number;
  date_time: string;
}

const Dashboard = () => {
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data, error } = await supabase
          .from("emotion_history")
          .select("id, emotion, confidence, date_time")
          .order("date_time", { ascending: false })
          .limit(200);
        
        if (error) {
          console.error("Error fetching emotion history:", error);
          toast.error("Failed to load emotion history");
        } else {
          console.log("Fetched emotion history:", data);
          if (data) setHistory(data);
        }
      } catch (err) {
        console.error("Unexpected error fetching history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const totalScans = history.length;
  const todayScans = history.filter((h) => {
    const d = new Date(h.date_time);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  const dominantEmotion = history.length > 0
    ? Object.entries(
        history.reduce<Record<string, number>>((acc, h) => {
          acc[h.emotion] = (acc[h.emotion] || 0) + 1;
          return acc;
        }, {})
      ).sort((a, b) => b[1] - a[1])[0]?.[0] || "—"
    : "—";

  const avgConfidence = history.length > 0
    ? Math.round(history.reduce((s, h) => s + h.confidence, 0) / history.length * 100)
    : 0;

  // Chart data
  const emotionCounts = history.reduce<Record<string, number>>((acc, h) => {
    const label = h.emotion.charAt(0).toUpperCase() + h.emotion.slice(1);
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});
  const chartData = Object.entries(emotionCounts)
    .map(([emotion, count]) => ({
      emotion,
      count,
      fill: EMOTION_COLORS[emotion.toLowerCase()] || "hsl(220, 10%, 55%)",
    }))
    .sort((a, b) => b.count - a.count);

  const recentDetections = history.slice(0, 5);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    return format(new Date(dateStr), "MMM d");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-10 px-4">
        <div className="container mx-auto">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
            <h1 className="text-3xl font-display font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back! Here's your emotion analysis overview.</p>
          </motion.div>

          {/* Stats */}
          <div className="grid mobile:grid-cols-2 laptop:grid-cols-4 gap-4 mb-8">
            <StatCard title="Total Scans" value={totalScans} change={`+${todayScans} today`} icon={Camera} delay={0} />
            <StatCard title="Today's Scans" value={todayScans} icon={Image} delay={0.05} />
            <StatCard title="Dominant Emotion" value={dominantEmotion.charAt(0).toUpperCase() + dominantEmotion.slice(1)} icon={TrendingUp} delay={0.1} />
            <StatCard title="Avg. Confidence" value={`${avgConfidence}%`} icon={Clock} delay={0.15} />
          </div>

          <div className="grid laptop:grid-cols-3 gap-6">
            {/* Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="laptop:col-span-2 glass-card rounded-xl p-5"
            >
              <h3 className="font-display font-semibold mb-4">Emotion Distribution</h3>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="emotion" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 13 }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">
                  No data yet. Run some detections first!
                </div>
              )}
            </motion.div>

            {/* Recent detections */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="glass-card rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold">Recent Detections</h3>
                <Link to="/history">
                  <Button variant="ghost" size="sm" className="text-primary gap-1 text-xs">
                    View All <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
              {recentDetections.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">No detections yet.</div>
              ) : (
                <div className="space-y-3">
                  {recentDetections.map((d) => (
                    <div key={d.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <EmotionBadge emotion={d.emotion} size="sm" />
                      <div className="text-right">
                        <p className="text-sm font-medium">{Math.round(d.confidence * 100)}%</p>
                        <p className="text-xs text-muted-foreground">{timeAgo(d.date_time)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Quick actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex flex-col mobile:flex-row gap-4"
          >
            <Link to="/detect" className="flex-1">
              <div className="glass-card rounded-xl p-6 hover:glow-border transition-shadow cursor-pointer">
                <Camera className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-display font-semibold mb-1">Start Webcam Detection</h3>
                <p className="text-sm text-muted-foreground">Analyze emotions in real-time from your camera.</p>
              </div>
            </Link>
            <Link to="/detect" className="flex-1">
              <div className="glass-card rounded-xl p-6 hover:glow-border transition-shadow cursor-pointer">
                <Image className="w-8 h-8 text-accent mb-3" />
                <h3 className="font-display font-semibold mb-1">Upload an Image</h3>
                <p className="text-sm text-muted-foreground">Drag & drop or browse to analyze a photo.</p>
              </div>
            </Link>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
