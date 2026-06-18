"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, CalendarPlus, NotebookPen, Plus, Target } from "lucide-react";

type Mode = "topic" | "application" | "goal" | "interview" | "note";

const modes: Array<{ id: Mode; label: string }> = [
  { id: "topic", label: "Topic" },
  { id: "application", label: "Application" },
  { id: "goal", label: "Goal" },
  { id: "interview", label: "Interview" },
  { id: "note", label: "Note" }
];

export function QuickAdd() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("topic");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(formData: FormData) {
    setLoading(true);
    setError("");
    const payload = Object.fromEntries(formData.entries());

    const response = await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, type: mode })
    });

    setLoading(false);
    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: "Could not save this item." }));
      setError(body.error);
      return;
    }

    router.refresh();
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Quick add</h2>
          <p className="panel-kicker">Capture progress while it is fresh.</p>
        </div>
        <Plus size={18} />
      </div>
      <div className="toolbar" style={{ flexWrap: "wrap", marginBottom: 14 }}>
        {modes.map((item) => (
          <button
            key={item.id}
            className={`button ${mode === item.id ? "" : "secondary"}`}
            type="button"
            onClick={() => setMode(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <form action={submit} className="form-grid">
        {error ? <div className="error wide">{error}</div> : null}
        {mode === "topic" ? <TopicFields /> : null}
        {mode === "application" ? <ApplicationFields /> : null}
        {mode === "goal" ? <GoalFields /> : null}
        {mode === "interview" ? <InterviewFields /> : null}
        {mode === "note" ? <NoteFields /> : null}
        <button className="button wide" disabled={loading}>
          {modeIcon(mode)}
          {loading ? "Saving" : "Save entry"}
        </button>
      </form>
    </section>
  );
}

function TopicFields() {
  return (
    <>
      <label className="field">
        <span>Topic</span>
        <input name="title" placeholder="Dynamic programming" required />
      </label>
      <label className="field">
        <span>Category</span>
        <select name="category" defaultValue="DSA">
          <option>DSA</option>
          <option>System Design</option>
          <option>CS Fundamentals</option>
          <option>Behavioral</option>
        </select>
      </label>
      <label className="field">
        <span>Difficulty</span>
        <select name="difficulty" defaultValue="MEDIUM">
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>
      </label>
      <label className="field">
        <span>Status</span>
        <select name="status" defaultValue="LEARNING">
          <option value="TODO">Todo</option>
          <option value="LEARNING">Learning</option>
          <option value="REVISING">Revising</option>
          <option value="MASTERED">Mastered</option>
        </select>
      </label>
      <label className="field">
        <span>Solved</span>
        <input name="solvedCount" type="number" min="0" defaultValue="0" required />
      </label>
      <label className="field">
        <span>Target</span>
        <input name="targetCount" type="number" min="1" defaultValue="10" required />
      </label>
      <label className="field">
        <span>Confidence</span>
        <input name="confidence" type="number" min="1" max="5" defaultValue="3" required />
      </label>
      <label className="field">
        <span>Resource URL</span>
        <input name="resourceUrl" type="url" placeholder="https://..." />
      </label>
    </>
  );
}

function ApplicationFields() {
  return (
    <>
      <label className="field">
        <span>Company</span>
        <input name="company" placeholder="Google" required />
      </label>
      <label className="field">
        <span>Role</span>
        <input name="roleTitle" placeholder="SDE 1" required />
      </label>
      <label className="field">
        <span>Location</span>
        <input name="location" placeholder="Bengaluru / Remote" />
      </label>
      <label className="field">
        <span>Source</span>
        <input name="source" placeholder="Referral, LinkedIn..." />
      </label>
      <label className="field">
        <span>Status</span>
        <select name="status" defaultValue="APPLIED">
          <option value="WISHLIST">Wishlist</option>
          <option value="APPLIED">Applied</option>
          <option value="OA">OA</option>
          <option value="INTERVIEWING">Interviewing</option>
          <option value="OFFER">Offer</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </label>
      <label className="field wide">
        <span>Next step</span>
        <input name="nextStep" placeholder="Ask for referral, follow up, prep graphs..." />
      </label>
      <label className="field wide">
        <span>Notes</span>
        <textarea name="notes" placeholder="Recruiter name, job link, compensation notes..." />
      </label>
    </>
  );
}

function GoalFields() {
  return (
    <>
      <label className="field">
        <span>Goal</span>
        <input name="title" placeholder="Solve graph set" required />
      </label>
      <label className="field">
        <span>Metric</span>
        <input name="metric" placeholder="problems" required />
      </label>
      <label className="field">
        <span>Target</span>
        <input name="target" type="number" min="1" defaultValue="10" required />
      </label>
      <label className="field">
        <span>Current</span>
        <input name="current" type="number" min="0" defaultValue="0" required />
      </label>
      <label className="field wide">
        <span>Due date</span>
        <input name="dueDate" type="date" required />
      </label>
    </>
  );
}

function InterviewFields() {
  return (
    <>
      <label className="field">
        <span>Company</span>
        <input name="company" placeholder="Company" required />
      </label>
      <label className="field">
        <span>Round</span>
        <input name="round" placeholder="DSA screen" required />
      </label>
      <label className="field wide">
        <span>Scheduled</span>
        <input name="scheduledAt" type="datetime-local" required />
      </label>
      <label className="field wide">
        <span>Focus</span>
        <input name="focus" placeholder="Graphs, LLD, behavioral..." required />
      </label>
      <label className="field wide">
        <span>Outcome</span>
        <input name="outcome" placeholder="Optional result or feedback" />
      </label>
    </>
  );
}

function NoteFields() {
  return (
    <>
      <label className="field">
        <span>Title</span>
        <input name="title" placeholder="Resume bullet idea" required />
      </label>
      <label className="field">
        <span>Tag</span>
        <input name="tag" placeholder="Resume, Behavioral, DSA" required />
      </label>
      <label className="field wide">
        <span>Note</span>
        <textarea name="body" placeholder="Write the useful thing before it evaporates." required />
      </label>
    </>
  );
}

function modeIcon(mode: Mode) {
  if (mode === "application") return <BriefcaseBusiness size={18} />;
  if (mode === "goal") return <Target size={18} />;
  if (mode === "interview") return <CalendarPlus size={18} />;
  if (mode === "note") return <NotebookPen size={18} />;
  return <Plus size={18} />;
}
