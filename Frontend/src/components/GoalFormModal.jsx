import { useEffect, useState } from "react";

export default function GoalFormModal({
  isOpen,
  onClose,
  onSubmit,
  subjects,
  initial,
  submitting,
}) {
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [dueDate, setDueDate] = useState(""); // YYYY-MM-DD

  useEffect(() => {
    if (initial) {
      setTitle(initial.title || "");
      setSubjectId(initial.subjectId?._id || initial.subjectId || "");
      setDueDate(initial.dueDate || "");
    } else {
      setTitle("");
      setSubjectId("");
      setDueDate("");
    }
  }, [initial]);

  if (!isOpen) return null;

  const submit = () => {
    if (!title.trim()) return;
    const payload = {
      title: title.trim(),
      subjectId: subjectId || undefined,
      dueDate: dueDate || undefined,
    };
    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <div className="text-lg font-semibold mb-3">
          {initial ? "Edit Goal" : "Add Goal"}
        </div>

        <label className="text-sm mb-1 block">Title</label>
        <input
          className="w-full mb-3 px-3 py-2 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Read chapter 3, finish worksheet…"
        />

        <label className="text-sm mb-1 block">Subject (optional)</label>
        <select
          className="w-full mb-3 px-3 py-2 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
        >
          <option value="">— None —</option>
          {subjects.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>

        <label className="text-sm mb-1 block">Due date (optional)</label>
        <input
          type="date"
          className="w-full mb-4 px-3 py-2 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />

        <div className="flex justify-end gap-2">
          <button
            className="btn btn-ghost"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={submit}
            disabled={submitting || !title.trim()}
          >
            {submitting ? "Saving…" : initial ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
