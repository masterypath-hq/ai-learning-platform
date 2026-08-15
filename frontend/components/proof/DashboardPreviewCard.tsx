import { Flame, Award } from "lucide-react";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";

/** Illustrative marketing preview — not a real user's data. */
export function DashboardPreviewCard() {
  return (
    <Card className="flex flex-col gap-4">
      <p className="text-xs uppercase tracking-wide text-muted-2">Your dashboard (preview)</p>

      <div className="flex items-center gap-3">
        <Flame className="h-7 w-7 text-warning" />
        <div>
          <p className="text-xl font-semibold">12</p>
          <p className="text-xs text-muted">day streak</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Cybersecurity progress</span>
          <span className="font-medium">68%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-surface-raised">
          <div className="h-2 w-[68%] rounded-full bg-[var(--accent)]" />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg bg-surface-raised px-3 py-2">
        <span className="text-sm text-muted">Module 4 quiz</span>
        <Badge tone="success">92%</Badge>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted">
        <Award className="h-3.5 w-3.5 text-[var(--accent)]" />
        3 badges earned
      </div>
    </Card>
  );
}
