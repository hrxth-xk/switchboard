"use client";

import { useMemo, useState } from "react";
import {
  activityCategoryIcon,
  filterActivities,
  searchActivities,
  type ActivityFeedItem,
  type ActivityFilter
} from "@/lib/activity-utils";

function categoryIconClass(category: ActivityFeedItem["category"]) {
  switch (category) {
    case "DSA":
      return "tone-dsa";
    case "Applications":
      return "tone-applications";
    case "Projects":
      return "tone-projects";
    default:
      return "tone-other";
  }
}

const PAGE_SIZE = 30;

const FILTER_OPTIONS: { value: ActivityFilter; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "week", label: "This Week" },
  { value: "custom", label: "Custom Date" }
];

type ActivityFeedProps = {
  items: ActivityFeedItem[];
};

export function ActivityFeed({ items }: ActivityFeedProps) {
  const [filter, setFilter] = useState<ActivityFilter>("today");
  const [customDate, setCustomDate] = useState("");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const byDate = filterActivities(items, filter, customDate || null);
    return searchActivities(byDate, query);
  }, [customDate, filter, items, query]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div className="activity-workspace">
      <div className="workspace-toolbar">
        <div className="segmented-control" role="tablist" aria-label="Activity period">
          {FILTER_OPTIONS.map((option) => (
            <button
              className={`segmented-btn${filter === option.value ? " active" : ""}`}
              key={option.value}
              onClick={() => {
                setFilter(option.value);
                setVisibleCount(PAGE_SIZE);
              }}
              role="tab"
              type="button"
              aria-selected={filter === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>

        {filter === "custom" ? (
          <div className="custom-date-card">
            <label className="custom-date-label">
              <span>Date</span>
              <input
                onChange={(event) => {
                  setCustomDate(event.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
                type="date"
                value={customDate}
              />
            </label>
          </div>
        ) : null}

        <input
          className="table-search workspace-search"
          onChange={(event) => {
            setQuery(event.target.value);
            setVisibleCount(PAGE_SIZE);
          }}
          placeholder="Search activity…"
          type="search"
          value={query}
        />
      </div>

      {visible.length ? (
        <ul className="activity-log">
          {visible.map((item) => (
            <li className="activity-log-item" key={item.id}>
              <span aria-hidden="true" className={`activity-log-icon ${categoryIconClass(item.category)}`}>
                {activityCategoryIcon(item.category)}
              </span>
              <div className="activity-log-body">
                <p className="activity-log-title">{item.title}</p>
                <p className="activity-log-meta">
                  <span>{item.category}</span>
                  <span aria-hidden="true">·</span>
                  <time dateTime={item.createdAt}>{item.timestamp}</time>
                </p>
                {item.description ? <p className="activity-log-description">{item.description}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-inline workspace-empty">
          {items.length ? "No activity matches this filter." : "Activity appears as you log problems, move applications, and update projects."}
        </p>
      )}

      {hasMore ? (
        <button
          className="button secondary load-more-btn"
          onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
          type="button"
        >
          Load more
        </button>
      ) : null}
    </div>
  );
}
