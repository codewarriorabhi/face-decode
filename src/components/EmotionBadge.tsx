import { cn } from "@/lib/utils";

const emotionConfig: Record<string, { emoji: string; className: string }> = {
  happy: { emoji: "😊", className: "bg-emotion-happy/15 text-emotion-happy" },
  sad: { emoji: "😢", className: "bg-emotion-sad/15 text-emotion-sad" },
  angry: { emoji: "😠", className: "bg-emotion-angry/15 text-emotion-angry" },
  surprise: { emoji: "😲", className: "bg-emotion-surprise/15 text-emotion-surprise" },
  fear: { emoji: "😨", className: "bg-emotion-fear/15 text-emotion-fear" },
  disgust: { emoji: "🤢", className: "bg-emotion-disgust/15 text-emotion-disgust" },
  neutral: { emoji: "😐", className: "bg-emotion-neutral/15 text-emotion-neutral" },
};

interface EmotionBadgeProps {
  emotion: string;
  confidence?: number;
  size?: "sm" | "md" | "lg";
}

const EmotionBadge = ({ emotion, confidence, size = "md" }: EmotionBadgeProps) => {
  const config = emotionConfig[emotion.toLowerCase()] || emotionConfig.neutral;
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  return (
    <span className={cn("emotion-chip rounded-full font-medium", config.className, sizeClasses[size])}>
      <span>{config.emoji}</span>
      <span className="capitalize">{emotion}</span>
      {confidence !== undefined && (
        <span className="opacity-70">{Math.round(confidence)}%</span>
      )}
    </span>
  );
};

export default EmotionBadge;
