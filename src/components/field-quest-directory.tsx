"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  fieldQuestFilters,
  getFieldQuestFilterLabel,
  getFieldQuestLocationLabel,
  matchesFieldQuestFilter,
  type FieldQuestFilter,
  type FieldQuestWithDistance,
} from "@/lib/field-quests";

type FieldQuestDirectoryProps = {
  quests: FieldQuestWithDistance[];
  defaultFilter?: FieldQuestFilter | "all";
  showCommunityAnchor?: boolean;
};

function formatDifficulty(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function FieldQuestDirectory({
  quests,
  defaultFilter = "all",
  showCommunityAnchor = false,
}: FieldQuestDirectoryProps) {
  const [activeFilter, setActiveFilter] = useState<FieldQuestFilter | "all">(defaultFilter);

  const filteredQuests = useMemo(() => {
    if (activeFilter === "all") return quests;
    return quests.filter((quest) => matchesFieldQuestFilter(quest, activeFilter));
  }, [activeFilter, quests]);

  return (
    <section className="stack">
      <section className="panel stack">
        <div className="header-row">
          <div>
            <p className="eyebrow">Quest Map</p>
            <h3>Choose a mission that fits today</h3>
            <p className="panel-copy" style={{ marginBottom: 0 }}>
              These public Field Quests are simple outdoor missions families can open from Facebook, complete together, and later save into the WSA learning record.
            </p>
          </div>
          {showCommunityAnchor ? (
            <a className="button button-ghost" href="#community-trail">
              Community clue trail
            </a>
          ) : null}
        </div>

        <div className="cta-row">
          <button
            type="button"
            className={`button ${activeFilter === "all" ? "button-primary" : "button-ghost"}`}
            onClick={() => setActiveFilter("all")}
          >
            All quests
          </button>
          {fieldQuestFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              className={`button ${activeFilter === filter ? "button-primary" : "button-ghost"}`}
              onClick={() => setActiveFilter(filter)}
            >
              {getFieldQuestFilterLabel(filter)}
            </button>
          ))}
        </div>
      </section>

      <section className="content-grid">
        {filteredQuests.map((quest) => (
          <article className="panel stack" key={quest.id}>
            <div className="field-guide-meta-row">
              <span className="badge">{formatDifficulty(quest.difficulty_level)}</span>
              <span className="muted">{quest.estimated_time}</span>
            </div>
            <div>
              <h3 style={{ marginBottom: 10 }}>{quest.title}</h3>
              <p className="panel-copy" style={{ marginBottom: 0 }}>
                {quest.short_description}
              </p>
            </div>
            <ul className="chip-list">
              <li>{getFieldQuestLocationLabel(quest)}</li>
              <li>Ages {quest.age_range}</li>
              <li>Badge: {quest.badge_name}</li>
              {typeof quest.distance_miles === "number" ? <li>{quest.distance_miles} mi away</li> : null}
            </ul>
            <div className="chip-list">
              {quest.subject_tags.slice(0, 5).map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </div>
            <div className="cta-row">
              <Link className="button button-primary" href={`/field-quests/${quest.slug}`}>
                Open quest
              </Link>
            </div>
          </article>
        ))}
      </section>

      {!filteredQuests.length ? (
        <section className="panel stack">
          <h3>No quests match that filter yet</h3>
          <p className="panel-copy" style={{ marginBottom: 0 }}>
            Try another filter or open the community trail section for family-made clue adventures.
          </p>
        </section>
      ) : null}
    </section>
  );
}
