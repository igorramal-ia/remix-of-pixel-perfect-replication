import { cn } from "@/lib/utils";

export type OOHStatus = "available" | "waiting" | "active" | "collect" | "finished";

interface StatusBadgeProps {
  status: OOHStatus;
  className?: string;
}

const statusConfig: Record<OOHStatus, { label: string; emoji: string; colorClass: string }> = {
  available: { label: "Disponível", emoji: "🟢", colorClass: "bg-status-available/15 text-status-available" },
  waiting: { label: "Aguardando", emoji: "🟡", colorClass: "bg-status-waiting/15 text-status-waiting" },
  active: { label: "Em Veiculação", emoji: "🔴", colorClass: "bg-status-active/15 text-status-active" },
  collect: { label: "Recolher", emoji: "🟠", colorClass: "bg-status-collect/15 text-status-collect" },
  finished: { label: "Finalizado", emoji: "⚪", colorClass: "bg-status-finished/15 text-status-finished" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
        config.colorClass,
        className
      )}
    >
      <span>{config.emoji}</span>
      {config.label}
    </span>
  );
}
