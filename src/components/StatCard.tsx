import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: LucideIcon;
  delay?: number;
}

const StatCard = ({ title, value, change, icon: Icon, delay = 0 }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="glass-card rounded-xl p-3 mobile:p-4 tablet:p-5 glow-border"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-xl mobile:text-2xl tablet:text-3xl font-display font-bold mt-1">{value}</p>
        {change && (
          <p className="text-xs text-primary mt-1">{change}</p>
        )}
      </div>
      <div className="w-8 h-8 mobile:w-9 mobile:h-9 tablet:w-10 tablet:h-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="w-4 h-4 mobile:w-5 mobile:h-5 text-primary" />
      </div>
    </div>
  </motion.div>
);

export default StatCard;
