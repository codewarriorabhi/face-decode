import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Activity, TrendingUp, Brain, BarChart3, CalendarDays } from "lucide-react";
import Navbar from "@/components/Navbar";
import StatCard from "@/components/StatCard";
import EmotionBadge from "@/components/EmotionBadge";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay } from "date-fns";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";

const EMOTION_COLORS: Record<string, string> = {
  happy: "hsl(45, 95%, 55%)",
  sad: "hsl(220, 75%, 55%)",
  angry: "hsl(0, 85%, 55%)",
  neutral: "hsl(220, 10%, 55%)",
  surprised: "hsl(30, 95%, 55%)",
};

interface HistoryRow {
  id: string;
  emotion: string;
  confidence: number;
  date_time: string;
}

const Admin = () => {
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("emotion_history")
        .select("id, emotion, confidence, date_time")
        .order("date_time", { ascending: true })
        .limit(500);
      if (data) setHistory(data);
      setLoading(false);
    };
    fetch();
  }, []);

  // ─── Derived Stats ───
  const todayStr = startOfDay(new Date()).toISOString();
  const todayScans = useMemo(() => history.filter((h) => h.date_time >= todayStr).length, [history, todayStr]);
  const totalScans = history.length;

  const emotionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    history.forEach((h) => {
      const e = h.emotion.toLowerCase();
      counts[e] = (counts[e] || 0) + 1;
    });
    return counts;
  }, [history]);

  const mostCommon = useMemo(() => {
    const sorted = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || "—";
  }, [emotionCounts]);

  const avgConfidence = useMemo(() => {
    if (history.length === 0) return 0;
    return Math.round(history.reduce((s, h) => s + h.confidence, 0) / history.length * 100);
  }, [history]);

  // ─── Pie Chart Data ───
  const pieData = useMemo(() => {
    return Object.entries(emotionCounts).map(([emotion, count]) => ({
      name: emotion.charAt(0).toUpperCase() + emotion.slice(1),
      value: count,
      color: EMOTION_COLORS[emotion] || "hsl(220, 10%, 55%)",
    })).sort((a, b) => b.value - a.value);
  }, [emotionCounts]);

  // ─── Trend Data (last 14 days) ───
  const trendData = useMemo(() => {
    const days: Record<string, Record<string, number>> = {};
    for (let i = 13; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "MMM d");
      days[d] = { happy: 0, sad: 0, angry: 0, neutral: 0, surprised: 0 };
    }
    history.forEach((h) => {
      const key = format(new Date(h.date_time), "MMM d");
      const emotion = h.emotion.toLowerCase();
      if (days[key] && emotion in days[key]) {
        days[key][emotion]++;
      }
    });
    return Object.entries(days).map(([date, emotions]) => ({ date, ...emotions }));
  }, [history]);

  // ─── Recent detections ───
  const recent = useMemo(() => [...history].reverse().slice(0, 8), [history]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-lg p-3 text-sm shadow-lg">
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.stroke || p.fill }} />
            <span className="capitalize">{p.dataKey}:</span>
            <span className="font-semibold">{p.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-10 px-4">
        <div className="container mx-auto">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
            <div className="flex items-center gap-2 mb-1">
              <Brain className="w-5 h-5 text-primary" />
              <span className="text-xs uppercase tracking-widest text-primary font-medium">Analytics</span>
            </div>
            <h1 className="text-3xl font-display font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-1">Insights from your emotion detection data.</p>
          </motion.div>

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Stats row */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard title="Total Detections" value={totalScans} icon={BarChart3} delay={0} />
                <StatCard title="Detections Today" value={todayScans} icon={CalendarDays} delay={0.05} />
                <StatCard
                  title="Most Common Emotion"
                  value={mostCommon.charAt(0).toUpperCase() + mostCommon.slice(1)}
                  icon={TrendingUp}
                  delay={0.1}
                />
                <StatCard title="Avg. Confidence" value={`${avgConfidence}%`} icon={Activity} delay={0.15} />
              </div>

              <div className="grid lg:grid-cols-5 gap-6 mb-6">
                {/* ─── 1. Emotion Distribution Pie Chart ─── */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="lg:col-span-2 glass-card rounded-xl p-5"
                >
                  <h3 className="font-display font-semibold mb-1">Emotion Distribution</h3>
                  <p className="text-xs text-muted-foreground mb-4">Breakdown of all detected emotions</p>
                  {pieData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            dataKey="value"
                            paddingAngle={3}
                            stroke="none"
                          >
                            {pieData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap gap-3 mt-2 justify-center">
                        {pieData.map((e) => (
                          <div key={e.name} className="flex items-center gap-1.5 text-xs">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                            <span>{e.name}</span>
                            <span className="text-muted-foreground">({e.value})</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">No data yet</div>
                  )}
                </motion.div>

                {/* ─── 2. Emotion Trends Line Chart ─── */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="lg:col-span-3 glass-card rounded-xl p-5"
                >
                  <h3 className="font-display font-semibold mb-1">Emotion Trends</h3>
                  <p className="text-xs text-muted-foreground mb-4">Emotion distribution over the last 14 days</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={trendData}>
                      <defs>
                        {Object.entries(EMOTION_COLORS).map(([emotion, color]) => (
                          <linearGradient key={emotion} id={`gradient-${emotion}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="100%" stopColor={color} stopOpacity={0} />
                          </linearGradient>
                        ))}
                      </defs>
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      {Object.entries(EMOTION_COLORS).map(([emotion, color]) => (
                        <Area
                          key={emotion}
                          type="monotone"
                          dataKey={emotion}
                          stroke={color}
                          strokeWidth={2}
                          fill={`url(#gradient-${emotion})`}
                          dot={false}
                          activeDot={{ r: 4, strokeWidth: 0 }}
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </motion.div>
              </div>

              {/* ─── Recent Activity Table ─── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card rounded-xl p-5"
              >
                <h3 className="font-display font-semibold mb-4">Recent Activity</h3>
                {recent.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-10">No detections recorded yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
                          <th className="text-left py-3 px-2">Date & Time</th>
                          <th className="text-left py-3 px-2">Emotion</th>
                          <th className="text-left py-3 px-2">Confidence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recent.map((row) => (
                          <tr key={row.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                            <td className="py-3 px-2 text-muted-foreground">
                              {format(new Date(row.date_time), "MMM d, yyyy · HH:mm")}
                            </td>
                            <td className="py-3 px-2">
                              <EmotionBadge emotion={row.emotion} size="sm" />
                            </td>
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-1.5 rounded-full bg-secondary overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-primary"
                                    style={{ width: `${row.confidence * 100}%` }}
                                  />
                                </div>
                                <span className="font-mono font-semibold">{Math.round(row.confidence * 100)}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Admin;
