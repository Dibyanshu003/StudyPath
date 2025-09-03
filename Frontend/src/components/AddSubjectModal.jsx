import { useState } from "react";
import api from "../api/client.js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

export default function AddSubjectModal({ open, onClose }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [trackingType, setTrackingType] = useState("time"); // time | questions | both
  const [targetMinutes, setTargetMinutes] = useState("");
  const [targetQuestions, setTargetQuestions] = useState("");
  const [colorCode, setColorCode] = useState("#FFD700");

  const { mutate, isLoading } = useMutation({
    mutationFn: async () => {
      const body = {
        name,
        trackingType,
        colorCode,
      };
      if (trackingType !== "questions")
        body.targetPerDayMinutes = Number(targetMinutes) || 0;
      if (trackingType !== "time")
        body.targetPerDayQuestions = Number(targetQuestions) || 0;
      return api.post("/api/subjects/create", body);
    },
    onSuccess: () => {
      toast.success("Subject added");
      qc.invalidateQueries({ queryKey: ["subjects"] });
      onClose();
      setName("");
      setTrackingType("time");
      setTargetMinutes("");
      setTargetQuestions("");
      setColorCode("#FFD700");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to add subject");
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 grid place-items-center z-50">
      <div className="card w-full max-w-md bg-slate-50 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Add Subject</h3>
          <button onClick={onClose} className="btn btn-ghost">
            ✕
          </button>
        </div>

        <label className="block mb-2 text-sm">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mb-3 px-3 py-2 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
        />

        <label className="block mb-2 text-sm">Tracking Type</label>
        <select
          value={trackingType}
          onChange={(e) => setTrackingType(e.target.value)}
          className="w-full mb-3 px-3 py-2 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
        >
          <option value="time">Time</option>
          <option value="questions">Questions</option>
          <option value="both">Both</option>
        </select>

        {trackingType !== "questions" && (
          <>
            <label className="block mb-2 text-sm">Daily Target (minutes)</label>
            <input
              type="number"
              min="0"
              value={targetMinutes}
              onChange={(e) => setTargetMinutes(e.target.value)}
              className="w-full mb-3 px-3 py-2 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </>
        )}

        {trackingType !== "time" && (
          <>
            <label className="block mb-2 text-sm">
              Daily Target (questions)
            </label>
            <input
              type="number"
              min="0"
              value={targetQuestions}
              onChange={(e) => setTargetQuestions(e.target.value)}
              className="w-full mb-4 px-3 py-2 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </>
        )}

        <label className="block mb-2 text-sm">Color</label>
        <input
          type="color"
          value={colorCode}
          onChange={(e) => setColorCode(e.target.value)}
          className="w-16 h-8 mb-4 p-0 border border-slate-300 rounded"
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn btn-ghost">
            Cancel
          </button>
          <button
            onClick={() => mutate()}
            disabled={isLoading || !name}
            className="btn btn-primary"
          >
            {isLoading ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
