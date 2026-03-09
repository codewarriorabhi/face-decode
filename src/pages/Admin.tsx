import { motion } from "framer-motion";
import { Users, Activity, Server, TrendingUp, Brain } from "lucide-react";
import Navbar from "@/components/Navbar";
import StatCard from "@/components/StatCard";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const usageData = [
  { day: "Mon", scans: 120 },
  { day: "Tue", scans: 210 },
  { day: "Wed", scans: 180 },
  { day: "Thu", scans: 340 },
  { day: "Fri", scans: 290 },
  { day: "Sat", scans: 150 },
  { day: "Sun", scans: 190 },
];

const emotionPie = [
  { name: "Happy", value: 35, color: "hsl(45, 95%, 55%)" },
  { name: "Neutral", value: 25, color: "hsl(220, 10%, 55%)" },
  { name: "Surprise", value: 15, color: "hsl(30, 95%, 55%)" },
  { name: "Sad", value: 12, color: "hsl(220, 75%, 55%)" },
  { name: "Angry", value: 8, color: "hsl(0, 85%, 55%)" },
  { name: "Other", value: 5, color: "hsl(260, 65%, 55%)" },
];

const recentUsers = [
  { name: "Alice Chen", scans: 45, lastActive: "2 min ago" },
  { name: "Bob Smith", scans: 32, lastActive: "10 min ago" },
  { name: "Carol Davis", scans: 28, lastActive: "1 hr ago" },
  { name: "David Lee", scans: 19, lastActive: "3 hrs ago" },
  { name: "Eva Martinez", scans: 12, lastActive: "5 hrs ago" },
];

const Admin = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main className="pt-20 pb-10 px-4">
      <div className="container mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-5 h-5 text-primary" />
            <span className="text-xs uppercase tracking-wider text-primary font-medium">Admin Panel</span>
          </div>
          <h1 className="text-3xl font-display font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">Platform-wide metrics and user activity.</p>
        </motion.div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Users" value="1,248" change="+32 this week" icon={Users} delay={0} />
          <StatCard title="Scans Today" value="3,421" change="+18%" icon={Activity} delay={0.05} />
          <StatCard title="API Uptime" value="99.9%" icon={Server} delay={0.1} />
          <StatCard title="Avg. Response" value="142ms" change="-8ms" icon={TrendingUp} delay={0.15} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Usage trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 glass-card rounded-xl p-5"
          >
            <h3 className="font-display font-semibold mb-4">Weekly Scan Trend</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={usageData}>
                <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="scans"
                  stroke="hsl(190, 90%, 50%)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "hsl(190, 90%, 50%)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Emotion pie */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass-card rounded-xl p-5"
          >
            <h3 className="font-display font-semibold mb-4">Emotion Breakdown</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={emotionPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {emotionPie.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-2">
              {emotionPie.map((e) => (
                <div key={e.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }} />
                  {e.name}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Recent users */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-xl p-5"
        >
          <h3 className="font-display font-semibold mb-4">Active Users</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
                  <th className="text-left py-3 px-2">User</th>
                  <th className="text-left py-3 px-2">Total Scans</th>
                  <th className="text-left py-3 px-2">Last Active</th>
                  <th className="text-right py-3 px-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((user) => (
                  <tr key={user.name} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-2 font-medium">{user.name}</td>
                    <td className="py-3 px-2 text-muted-foreground">{user.scans}</td>
                    <td className="py-3 px-2 text-muted-foreground">{user.lastActive}</td>
                    <td className="py-3 px-2 text-right">
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </main>
  </div>
);

export default Admin;
