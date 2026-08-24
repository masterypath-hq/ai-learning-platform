import {
  Layers,
  Server,
  MonitorSmartphone,
  ShieldCheck,
  BarChart3,
  BrainCircuit,
  Database,
  Cloud,
  Infinity as InfinityIcon,
  Smartphone,
  Apple,
  type LucideIcon,
} from "lucide-react";

/**
 * Resolves the icon key strings stored on TrackDefinition
 * (@ai-learning-platform/shared's `tracks.ts`) to lucide-react components.
 * Track copy (name, outcomes, bullets, mastery outline) lives in TRACKS itself —
 * this file is icon lookup only.
 */
export const TRACK_ICONS: Record<string, LucideIcon> = {
  layers: Layers,
  server: Server,
  "monitor-smartphone": MonitorSmartphone,
  "shield-check": ShieldCheck,
  "bar-chart-3": BarChart3,
  "brain-circuit": BrainCircuit,
  database: Database,
  cloud: Cloud,
  infinity: InfinityIcon,
  smartphone: Smartphone,
  apple: Apple,
};

export const DEFAULT_TRACK_ICON: LucideIcon = Layers;

export function resolveTrackIcon(iconKey: string): LucideIcon {
  return TRACK_ICONS[iconKey] ?? DEFAULT_TRACK_ICON;
}

export const MASTERY_PHASES = ["Foundation", "Intermediate", "Advanced", "Mastery"] as const;
