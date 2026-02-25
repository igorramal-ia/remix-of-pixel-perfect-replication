import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
  variant?: "default" | "primary" | "accent";
  className?: string;
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, variant = "default", className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl p-5 transition-all duration-200 hover:shadow-elevated animate-fade-in",
        variant === "primary" && "gradient-brand text-primary-foreground",
        variant === "accent" && "gradient-accent text-accent-foreground",
        variant === "default" && "bg-card shadow-card border border-border",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p
            className={cn(
              "text-xs font-medium uppercase tracking-wider",
              variant === "default" ? "text-muted-foreground" : "opacity-80"
            )}
          >
            {title}
          </p>
          <p className="text-3xl font-display font-bold">{value}</p>
          {subtitle && (
            <p className={cn("text-sm", variant === "default" ? "text-muted-foreground" : "opacity-70")}>
              {subtitle}
            </p>
          )}
          {trend && (
            <p className={cn("text-xs font-medium", trend.positive ? "text-status-available" : "text-destructive")}>
              {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}% vs. mês anterior
            </p>
          )}
        </div>
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
            variant === "default" ? "bg-primary/10 text-primary" : "bg-white/20"
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
