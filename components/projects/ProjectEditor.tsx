"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import type { Project } from "@prisma/client";

type ProjectEditorProps = {
  project: Project;
  onClose: () => void;
};

export function ProjectEditor({ project, onClose }: ProjectEditorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  async function save(formData: FormData) {
    setLoading(true);
    setError("");

    const payload = Object.fromEntries(formData.entries());
    const response = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setLoading(false);
    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: "Could not save changes." }));
      setError(body.error);
      return;
    }

    onClose();
    router.refresh();
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal modal-wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-editor-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 className="panel-title" id="project-editor-title">
              Edit project
            </h2>
            <p className="panel-kicker">Lightweight work container — no subtasks</p>
          </div>
          <button className="icon-button secondary modal-close" type="button" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form action={save} className="form-grid">
          {error ? <div className="error wide">{error}</div> : null}

          <label className="field wide">
            <span>Title</span>
            <input name="title" defaultValue={project.title} required />
          </label>
          <label className="field">
            <span>Status</span>
            <select name="status" defaultValue={project.status}>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </label>
          <label className="field wide">
            <span>Next step</span>
            <input name="nextStep" defaultValue={project.nextStep ?? ""} placeholder="What to do next" />
          </label>
          <label className="field wide">
            <span>Notes</span>
            <textarea name="notes" defaultValue={project.notes ?? ""} />
          </label>

          <button className="button wide" disabled={loading} type="submit">
            {loading ? "Saving" : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
