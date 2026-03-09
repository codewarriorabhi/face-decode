import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Users, Activity, TrendingUp, Brain, BarChart3, Shield,
  Trash2, Ban, Download, Loader2, ShieldAlert, CalendarDays,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import StatCard from "@/components/StatCard";
import EmotionBadge from "@/components/EmotionBadge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format, subDays, startOfDay } from "date-fns";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis,
} from "recharts";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const EMOTION_COLORS: Record<string, string> = {
  happy: "hsl(45, 95%, 55%)",
  sad: "hsl(220, 75%, 55%)",
  angry: "hsl(0, 85%, 55%)",
  neutral: "hsl(220, 10%, 55%)",
  surprised: "hsl(30, 95%, 55%)",
};

interface AdminUser {
  id: string;
  email: string;
  display_name: string;
  is_blocked: boolean;
  role: string;
  created_at: string;
  detection_count: number;
}

interface HistoryRow {
  emotion: string;
  confidence: number;
  date_time: string;
  user_id: string;
}

const Admin = () => {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalDetections, setTotalDetections] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "users">("overview");

  const fetchData = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-actions", {
        body: { action: "get_stats" },
      });
      if (error) throw error;
      if (data?.error === "Forbidden: Admin access required") {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      if (data?.error) throw new Error(data.error);
      setIsAdmin(true);
      setUsers(data.users || []);
      setHistory(data.history || []);
      setTotalUsers(data.total_users || 0);
      setTotalDetections(data.total_detections || 0);
    } catch (err: any) {
      if (err.message?.includes("Forbidden") || err.message?.includes("403")) {
        setIsAdmin(false);
      } else {
        toast.error("Failed to load admin data");
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [session]);

  const handleBlock = async (userId: string) => {
    setActionLoading(userId);
    try {
      const { data, error } = await supabase.functions.invoke("admin-actions", {
        body: { action: "block_user", target_user_id: userId },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_blocked: data.is_blocked } : u))
      );
      toast.success(data.is_blocked ? "User blocked" : "User unblocked");
    } catch (err: any) {
      toast.error(err.message || "Failed to update user");
    }
    setActionLoading(null);
  };

  const handleDelete = async (userId: string) => {
    setActionLoading(userId);
    try {
      const { data, error } = await supabase.functions.invoke("admin-actions", {
        body: { action: "delete_user", target_user_id: userId },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setTotalUsers((p) => p - 1);
      toast.success("User deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
    }
    setActionLoading(null);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-actions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ action: "export_analytics" }),
        }
      );
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `emotion_analytics_${format(new Date(), "yyyy-MM-dd")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Analytics exported!");
    } catch {
      toast.error("Failed to export analytics");
    }
    setExporting(false);
  };

  // ─── Derived data ───
  const todayStr = startOfDay(new Date()).toISOString();
  const todayDetections = useMemo(() => history.filter((h) => h.date_time >= todayStr).length, [history, todayStr]);

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

  const pieData = useMemo(
    () =>
      Object.entries(emotionCounts)
        .map(([emotion, count]) => ({
          name: emotion.charAt(0).toUpperCase() + emotion.slice(1),
          value: count,
          color: EMOTION_COLORS[emotion] || "hsl(220,10%,55%)",
        }))
        .sort((a, b) => b.value - a.value),
    [emotionCounts]
  );

  const trendData = useMemo(() => {
    const days: Record<string, Record<string, number>> = {};
    for (let i = 13; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "MMM d");
      days[d] = { happy: 0, sad: 0, angry: 0, neutral: 0, surprised: 0 };
    }
    history.forEach((h) => {
      const key = format(new Date(h.date_time), "MMM d");
      const emotion = h.emotion.toLowerCase();
      if (days[key] && emotion in days[key]) days[key][emotion]++;
    });
    return Object.entries(days).map(([date, emotions]) => ({ date, ...emotions }));
  }, [history]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-card border border-border rounded-lg p-3 text-sm shadow-lg">
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.stroke || p.fill }} />
            <span className="capitalize">{p.dataKey || p.name}:</span>
            <span className="font-semibold">{p.value}</span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center pt-40">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center pt-40 text-center px-4">
          <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
          <h1 className="text-2xl font-display font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground max-w-md">
            You don't have admin privileges. Contact your administrator to get access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-10 px-4">
        <div className="container mx-auto">
          {/* Header */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-5 h-5 text-primary" />
                <span className="text-xs uppercase tracking-widest text-primary font-medium">Admin Panel</span>
              </div>
              <h1 className="text-3xl font-display font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-1">Platform-wide analytics and user management.</p>
            </div>
            <Button onClick={handleExport} disabled={exporting} variant="outline" className="gap-2">
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Export CSV
            </Button>
          </motion.div>

          {/* Stats */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard title="Total Users" value={totalUsers} icon={Users} delay={0} />
            <StatCard title="Total Detections" value={totalDetections} icon={BarChart3} delay={0.05} />
            <StatCard title="Detections Today" value={todayDetections} icon={CalendarDays} delay={0.1} />
            <StatCard title="Most Common" value={mostCommon.charAt(0).toUpperCase() + mostCommon.slice(1)} icon={TrendingUp} delay={0.15} />
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={activeTab === "overview" ? "default" : "outline"}
              onClick={() => setActiveTab("overview")}
              className={activeTab === "overview" ? "bg-primary text-primary-foreground" : ""}
              size="sm"
            >
              <BarChart3 className="w-4 h-4 mr-2" /> Analytics
            </Button>
            <Button
              variant={activeTab === "users" ? "default" : "outline"}
              onClick={() => setActiveTab("users")}
              className={activeTab === "users" ? "bg-primary text-primary-foreground" : ""}
              size="sm"
            >
              <Users className="w-4 h-4 mr-2" /> Users ({totalUsers})
            </Button>
          </div>

          {activeTab === "overview" ? (
            <>
              <div className="grid lg:grid-cols-5 gap-6 mb-6">
                {/* Pie chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="lg:col-span-2 glass-card rounded-xl p-5"
                >
                  <h3 className="font-display font-semibold mb-1">Emotion Distribution</h3>
                  <p className="text-xs text-muted-foreground mb-4">All-time emotion breakdown across all users</p>
                  {pieData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3} stroke="none">
                            {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex flex-wrap gap-3 mt-2 justify-center">
                        {pieData.map((e) => (
                          <div key={e.name} className="flex items-center gap-1.5 text-xs">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: e.color }} />
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

                {/* Trend chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="lg:col-span-3 glass-card rounded-xl p-5"
                >
                  <h3 className="font-display font-semibold mb-1">Emotion Trends</h3>
                  <p className="text-xs text-muted-foreground mb-4">Last 14 days across all users</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={trendData}>
                      <defs>
                        {Object.entries(EMOTION_COLORS).map(([emotion, color]) => (
                          <linearGradient key={emotion} id={`admin-grad-${emotion}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="100%" stopColor={color} stopOpacity={0} />
                          </linearGradient>
                        ))}
                      </defs>
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      {Object.entries(EMOTION_COLORS).map(([emotion, color]) => (
                        <Area key={emotion} type="monotone" dataKey={emotion} stroke={color} strokeWidth={2} fill={`url(#admin-grad-${emotion})`} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </motion.div>
              </div>

              {/* API Usage / summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card rounded-xl p-5"
              >
                <h3 className="font-display font-semibold mb-4">API Usage Summary</h3>
                <div className="grid sm:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Total API Calls</p>
                    <p className="text-2xl font-display font-bold">{totalDetections}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Users (with detections)</p>
                    <p className="text-2xl font-display font-bold">
                      {users.filter((u) => u.detection_count > 0).length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Detections/User</p>
                    <p className="text-2xl font-display font-bold">
                      {totalUsers > 0 ? (totalDetections / totalUsers).toFixed(1) : "0"}
                    </p>
                  </div>
                </div>
              </motion.div>
            </>
          ) : (
            /* ─── Users Tab ─── */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-xl overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground text-xs uppercase tracking-wider border-b border-border bg-secondary/50">
                      <th className="text-left py-3 px-4">User</th>
                      <th className="text-left py-3 px-4">Role</th>
                      <th className="text-left py-3 px-4">Detections</th>
                      <th className="text-left py-3 px-4">Joined</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-right py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{u.display_name || "—"}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            u.role === "admin"
                              ? "bg-primary/10 text-primary"
                              : "bg-secondary text-muted-foreground"
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono">{u.detection_count}</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {format(new Date(u.created_at), "MMM d, yyyy")}
                        </td>
                        <td className="py-3 px-4">
                          {u.is_blocked ? (
                            <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-medium">Blocked</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">Active</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleBlock(u.id)}
                              disabled={actionLoading === u.id || u.role === "admin"}
                              title={u.is_blocked ? "Unblock user" : "Block user"}
                              className="h-8 w-8 p-0"
                            >
                              {actionLoading === u.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Ban className={`w-3.5 h-3.5 ${u.is_blocked ? "text-primary" : "text-muted-foreground"}`} />
                              )}
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={u.role === "admin"}
                                  className="h-8 w-8 p-0 hover:text-destructive"
                                  title="Delete user"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to permanently delete <strong>{u.email}</strong>? This will remove all their data and cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(u.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Admin;
