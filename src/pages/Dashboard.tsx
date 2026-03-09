import { motion } from "framer-motion";
import { Camera, Image, TrendingUp, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import StatCard from "@/components/StatCard";
import EmotionBadge from "@/components/EmotionBadge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const emotionData = [
  { emotion: "Happy", count: 42, fill: "hsl(45, 95%, 55%)" },
  { emotion: "Sad", count: 12, fill: "hsl(220, 75%, 55%)" },
  { emotion: "Angry", count: 8, fill: "hsl(0, 85%, 55%)" },
  { emotion: "Surprise", count: 18, fill: "hsl(30, 95%, 55%)" },
  { emotion: "Fear", count: 5, fill: "hsl(270, 65%, 55%)" },
  { emotion: "Neutral", count: 35, fill: "hsl(220, 10%, 55%)" },
];

const recentDetections = [
  { id: 1, emotion: "Happy", confidence: 92, time: "2 min ago", source: "Webcam" },
  { id: 2, emotion: "Surprise", confidence: 78, time: "15 min ago", source: "Upload" },
  { id: 3, emotion: "Neutral", confidence: 85, time: "1 hour ago", source: "Webcam" },
  { id: 4, emotion: "Sad", confidence: 64, time: "3 hours ago", source: "Upload" },
];

const Dashboard = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main className="pt-20 pb-10 px-4">
      <div className="container mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <h1 className="text-3xl font-display font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's your emotion analysis overview.</p>
        </motion.div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Scans" value={120} change="+12 today" icon={Camera} delay={0} />
          <StatCard title="Images Analyzed" value={45} change="+3 today" icon={Image} delay={0.05} />
          <StatCard title="Dominant Emotion" value="Happy" icon={TrendingUp} delay={0.1} />
          <StatCard title="Avg. Confidence" value="84%" change="+2% this week" icon={Clock} delay={0.15} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 glass-card rounded-xl p-5"
          >
            <h3 className="font-display font-semibold mb-4">Emotion Distribution</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={emotionData}>
                <XAxis dataKey="emotion" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {emotionData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
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
            <div className="space-y-3">
              {recentDetections.map((d) => (
                <div key={d.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <EmotionBadge emotion={d.emotion} size="sm" />
                    <div>
                      <p className="text-xs text-muted-foreground">{d.source}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{d.confidence}%</p>
                    <p className="text-xs text-muted-foreground">{d.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex flex-col sm:flex-row gap-4"
        >
          <Link to="/detect" className="flex-1">
            <div className="glass-card rounded-xl p-6 hover:glow-border transition-shadow cursor-pointer group">
              <Camera className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-display font-semibold mb-1">Start Webcam Detection</h3>
              <p className="text-sm text-muted-foreground">Analyze emotions in real-time from your camera.</p>
            </div>
          </Link>
          <Link to="/detect" className="flex-1">
            <div className="glass-card rounded-xl p-6 hover:glow-border transition-shadow cursor-pointer group">
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

export default Dashboard;
