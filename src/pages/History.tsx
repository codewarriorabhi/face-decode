import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Filter, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import EmotionBadge from "@/components/EmotionBadge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

type FilterRange = "today" | "7days" | "30days" | "all";

interface HistoryRow {
  id: string;
  emotion: string;
  confidence: number;
  date_time: string;
}

const History = () => {
  const [filter, setFilter] = useState<FilterRange>("all");
  const [data, setData] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [filter]);

  const fetchHistory = async () => {
    setLoading(true);
    let query = supabase
      .from("emotion_history")
      .select("id, emotion, confidence, date_time")
      .order("date_time", { ascending: false });

    const now = new Date();
    if (filter === "today") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      query = query.gte("date_time", start);
    } else if (filter === "7days") {
      const start = new Date(now.getTime() - 7 * 86400000).toISOString();
      query = query.gte("date_time", start);
    } else if (filter === "30days") {
      const start = new Date(now.getTime() - 30 * 86400000).toISOString();
      query = query.gte("date_time", start);
    }

    const { data: rows, error } = await query.limit(100);
    if (!error && rows) setData(rows);
    setLoading(false);
  };

  const filters: { label: string; value: FilterRange }[] = [
    { label: "All Time", value: "all" },
    { label: "Today", value: "today" },
    { label: "Last 7 Days", value: "7days" },
    { label: "Last 30 Days", value: "30days" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-10 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 flex flex-col mobile:flex-row mobile:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold">Detection History</h1>
              <p className="text-muted-foreground mt-1">Browse your past emotion detections.</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {filters.map((f) => (
                <Button
                  key={f.value}
                  size="sm"
                  variant={filter === f.value ? "default" : "outline"}
                  onClick={() => setFilter(f.value)}
                  className={filter === f.value ? "bg-primary text-primary-foreground" : ""}
                >
                  {f.label}
                </Button>
              ))}
            </div>
          </motion.div>

          <div className="glass-card rounded-xl overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-3 mobile:grid-cols-12 gap-4 px-5 py-3 bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground font-medium">
              <div className="col-span-3 mobile:col-span-4">Date</div>
              <div className="col-span-3 mobile:col-span-4">Emotion</div>
              <div className="col-span-3 mobile:col-span-4 text-right">Confidence</div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : data.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <p className="font-medium">No detections found</p>
                <p className="text-sm mt-1">Run an emotion detection to see results here.</p>
              </div>
            ) : (
              data.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="grid grid-cols-3 mobile:grid-cols-12 gap-4 px-5 py-4 border-b border-border last:border-0 items-center hover:bg-secondary/30 transition-colors"
                >
                  <div className="col-span-3 mobile:col-span-4 flex items-center gap-2 text-sm">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span>{format(new Date(item.date_time), "MMM d, yyyy")}</span>
                    <span className="text-muted-foreground">{format(new Date(item.date_time), "HH:mm")}</span>
                  </div>
                  <div className="col-span-3 mobile:col-span-4">
                    <EmotionBadge emotion={item.emotion} size="sm" />
                  </div>
                  <div className="col-span-3 mobile:col-span-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${item.confidence * 100}%` }} />
                      </div>
                      <span className="text-sm font-mono font-semibold">{Math.round(item.confidence * 100)}%</span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {!loading && data.length > 0 && (
            <p className="text-xs text-muted-foreground text-center mt-4">
              Showing {data.length} detection{data.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </main>
    </div>
  );
};

export default History;
