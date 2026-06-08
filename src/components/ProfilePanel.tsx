import { motion } from "framer-motion";
import { User, TrendingUp, BarChart3 } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { format } from "date-fns";

interface HistoryRow {
  id: string;
  emotion: string;
  confidence: number;
  date_time: string;
  latency_ms: number | null;
  gender: string | null;
  age_estimate: number | null;
}

interface ProfilePanelProps {
  history: HistoryRow[];
}

const GENDER_COLORS: Record<string, string> = {
  male: "hsl(210, 80%, 60%)",
  female: "hsl(330, 80%, 65%)",
  unknown: "hsl(220, 10%, 60%)",
};

export default function ProfilePanel({ history }: ProfilePanelProps) {
  const recordsWithProfile = history.filter(
    (h) => h.gender || (h.age_estimate !== null && h.age_estimate !== undefined)
  );

  // Gender stats
  const genderCounts = recordsWithProfile.reduce<Record<string, number>>((acc, h) => {
    const g = h.gender || "unknown";
    acc[g] = (acc[g] || 0) + 1;
    return acc;
  }, {});

  const totalGendered = Object.values(genderCounts).reduce((s, v) => s + v, 0);
  const dominantGender = totalGendered > 0
    ? Object.entries(genderCounts).sort((a, b) => b[1] - a[1])[0][0]
    : null;
  const dominantGenderPct = totalGendered > 0 && dominantGender
    ? Math.round((genderCounts[dominantGender] / totalGendered) * 100)
    : 0;

  const genderChartData = Object.entries(genderCounts).map(([gender, count]) => ({
    name: gender.charAt(0).toUpperCase() + gender.slice(1),
    value: count,
    fill: GENDER_COLORS[gender] || GENDER_COLORS.unknown,
  }));

  // Age stats
  const ages = recordsWithProfile
    .map((h) => h.age_estimate)
    .filter((a): a is number => a !== null && a !== undefined);

  const avgAge = ages.length > 0
    ? Math.round(ages.reduce((s, a) => s + a, 0) / ages.length)
    : null;
  const minAge = ages.length > 0 ? Math.min(...ages) : null;
  const maxAge = ages.length > 0 ? Math.max(...ages) : null;

  // Age buckets
  const ageBuckets: Record<string, number> = {};
  ages.forEach((a) => {
    const bucket = `${Math.floor(a / 10) * 10}s`;
    ageBuckets[bucket] = (ageBuckets[bucket] || 0) + 1;
  });
  const ageBucketData = Object.entries(ageBuckets)
    .map(([bucket, count]) => ({ bucket, count }))
    .sort((a, b) => parseInt(a.bucket) - parseInt(b.bucket));

  // Age trend over time (last 30 records with age, chronological)
  const ageTrend = recordsWithProfile
    .filter((h) => h.age_estimate !== null && h.age_estimate !== undefined)
    .slice(-30)
    .map((h) => ({
      date: format(new Date(h.date_time), "MMM d HH:mm"),
      age: h.age_estimate!,
    }));

  if (recordsWithProfile.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="glass-card rounded-xl p-5 mobile:p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold">Profile Summary</h3>
        </div>
        <div className="text-sm text-muted-foreground text-center py-8">
          No profile data yet. Run detections with gender/age info to build your profile.
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="glass-card rounded-xl p-5 mobile:p-6"
    >
      <div className="flex items-center gap-2 mb-5">
        <User className="w-5 h-5 text-primary" />
        <h3 className="font-display font-semibold">Profile Summary</h3>
        <span className="ml-auto text-xs text-muted-foreground">
          {recordsWithProfile.length} detection{recordsWithProfile.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="grid mobile:grid-cols-3 gap-4 mb-6">
        {/* Dominant gender */}
        <div className="glass-card rounded-lg p-4 flex flex-col items-center text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Gender</p>
          <p className="text-2xl font-display font-bold capitalize">
            {dominantGender || "—"}
          </p>
          <p className="text-xs text-primary mt-1">{dominantGenderPct}% of scans</p>
        </div>

        {/* Average age */}
        <div className="glass-card rounded-lg p-4 flex flex-col items-center text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Avg. Age</p>
          <p className="text-2xl font-display font-bold">{avgAge ?? "—"}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {minAge !== null && maxAge !== null ? `${minAge} – ${maxAge} yrs` : "No data"}
          </p>
        </div>

        {/* Age range spread */}
        <div className="glass-card rounded-lg p-4 flex flex-col items-center text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Age Spread</p>
          <p className="text-2xl font-display font-bold">
            {minAge !== null && maxAge !== null ? maxAge - minAge : "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">years variance</p>
        </div>
      </div>

      <div className="grid mobile:grid-cols-2 gap-4">
        {/* Gender pie chart */}
        {genderChartData.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground">Gender Distribution</p>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={genderChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {genderChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
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
            <div className="flex flex-wrap justify-center gap-3 mt-1">
              {genderChartData.map((g) => (
                <div key={g.name} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="w-2 h-2 rounded-full" style={{ background: g.fill }} />
                  {g.name} ({Math.round((g.value / totalGendered) * 100)}%)
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Age trend */}
        {ageTrend.length > 1 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground">Age Trend</p>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={ageTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} domain={["dataMin - 5", "dataMax + 5"]} />
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
                  dataKey="age"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 2, fill: "hsl(var(--primary))" }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </motion.div>
  );
}
