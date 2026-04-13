import Link from "next/link";
import { dailyAdventurePresets, type DailyAdventurePresetKey } from "@/lib/daily-adventure-presets";

type DashboardQuickStartPresetsProps = {
  activeStudentId?: string;
};

const presets: Array<{ key: DailyAdventurePresetKey; href: string; accent: string }> = [
  { key: "quick", href: "/daily-adventure?preset=quick", accent: "Quick start" },
  { key: "rainy", href: "/daily-adventure?preset=rainy", accent: "Rainy day" },
  { key: "backyard", href: "/daily-adventure?preset=backyard", accent: "Backyard" },
  { key: "weekend", href: "/daily-adventure?preset=weekend", accent: "Weekend" },
  { key: "bird", href: "/daily-adventure?preset=bird", accent: "Bird study" },
  { key: "fish", href: "/daily-adventure?preset=fish", accent: "Fishing" }
];

export function DashboardQuickStartPresets({ activeStudentId }: DashboardQuickStartPresetsProps) {
  return (
    <section className="panel stack">
      <div className="field-section-header">
        <div>
          <p className="eyebrow">Quick start presets</p>
          <h3>Launch a plan faster</h3>
        </div>
      </div>
      <div className="dashboard-preset-grid">
        {presets.map((preset) => {
          const joiner = preset.href.includes("?") ? "&" : "?";
          const href = activeStudentId ? `${preset.href}${joiner}studentId=${activeStudentId}` : preset.href;
          const config = dailyAdventurePresets[preset.key];

          return (
            <Link className="specimen-card dashboard-preset-card" href={href} key={config.label}>
              <span>{preset.accent}</span>
              <strong>{config.label}</strong>
              <p>{config.subtitle}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
