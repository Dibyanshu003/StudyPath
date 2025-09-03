import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/client.js";
import { toast } from "react-toastify";
import GoalFormModal from "../components/GoalFormModal.jsx";
import dayjs from "dayjs";

export default function GoalsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all"); // all | pending | completed
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null); // goal object or null

  // load subjects for dropdowns
  const { data: subjectsRes } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => (await api.get("/api/subjects")).data,
  });
  const subjects = subjectsRes?.subjects || [];

  // load goals (react-query key includes filter)
  const { data: goalsRes, isLoading } = useQuery({
    queryKey: ["goals", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const url =
        "/api/goals" + (params.toString() ? `?${params.toString()}` : "");
      return (await api.get(url)).data;
    },
  });
  const goals = goalsRes?.goals || [];

  // mutations
  const createMutation = useMutation({
    mutationFn: async (payload) =>
      (await api.post("/api/goals/create", payload)).data,
    onSuccess: () => {
      toast.success("Goal created");
      qc.invalidateQueries({ queryKey: ["goals"] });
      setModalOpen(false);
    },
    onError: (e) =>
      toast.error(e?.response?.data?.message || "Failed to create goal"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ goalId, payload }) =>
      (await api.put(`/api/goals/${goalId}`, payload)).data,
    onSuccess: () => {
      toast.success("Goal updated");
      qc.invalidateQueries({ queryKey: ["goals"] });
      setModalOpen(false);
      setEditingGoal(null);
    },
    onError: (e) =>
      toast.error(e?.response?.data?.message || "Failed to update goal"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (goalId) =>
      (await api.delete(`/api/goals/${goalId}`)).data,
    onSuccess: () => {
      toast.success("Goal deleted");
      qc.invalidateQueries({ queryKey: ["goals"] });
    },
    onError: (e) =>
      toast.error(e?.response?.data?.message || "Failed to delete goal"),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (goal) => {
      const next = goal.status === "completed" ? "pending" : "completed";
      return (await api.put(`/api/goals/${goal._id}`, { status: next })).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
    },
    onError: () => toast.error("Failed to update status"),
  });

  const openCreate = () => {
    setEditingGoal(null);
    setModalOpen(true);
  };
  const openEdit = (goal) => {
    setEditingGoal(goal);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="font-bold text-brand-400 text-2xl tracking-wide">
          Goals
        </h1>
        <div className="flex items-center gap-2">
          <StatusFilter value={statusFilter} onChange={setStatusFilter} />
          <button className="btn btn-primary" onClick={openCreate}>
            + Add Goal
          </button>
        </div>
      </header>

      <div className="card">
        {isLoading ? (
          <GoalsSkeleton />
        ) : goals.length === 0 ? (
          <div className="text-center py-10 opacity-80">
            No goals {statusFilter !== "all" ? `(${statusFilter})` : ""} yet.
            <div>
              <button className="btn btn-ghost mt-3" onClick={openCreate}>
                Create your first goal
              </button>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {goals.map((g) => (
              <li key={g._id} className="py-3 flex items-center gap-3">
                <button
                  onClick={() => toggleStatusMutation.mutate(g)}
                  className={`h-5 w-5 rounded border flex items-center justify-center ${
                    g.status === "completed"
                      ? "bg-success border-success text-slate-900"
                      : "bg-transparent border-slate-400/40"
                  }`}
                  title="Toggle status"
                >
                  {g.status === "completed" ? "✓" : ""}
                </button>

                <div className="flex-1 min-w-0">
                  <div
                    className={`truncate ${
                      g.status === "completed" ? "line-through opacity-70" : ""
                    }`}
                  >
                    {g.title}
                  </div>
                  <div className="text-sm opacity-70 mt-0.5 flex gap-3 flex-wrap">
                    {g.subjectId?.name && (
                      <span>
                        Subject:{" "}
                        <span className="opacity-90">{g.subjectId.name}</span>
                      </span>
                    )}
                    {g.dueDate && (
                      <span>
                        Due:{" "}
                        <span className="opacity-90">
                          {prettyDate(g.dueDate)}
                        </span>
                      </span>
                    )}
                    <span>
                      Status:{" "}
                      <span className="opacity-90 capitalize">{g.status}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="btn btn-ghost" onClick={() => openEdit(g)}>
                    Edit
                  </button>
                  <button
                    className="btn btn-ghost text-red-400"
                    onClick={() => deleteMutation.mutate(g._id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <GoalFormModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingGoal(null);
          }}
          subjects={subjects}
          initial={editingGoal}
          onSubmit={(payload) => {
            if (editingGoal) {
              updateMutation.mutate({ goalId: editingGoal._id, payload });
            } else {
              createMutation.mutate(payload);
            }
          }}
          submitting={createMutation.isLoading || updateMutation.isLoading}
        />
      )}
    </div>
  );
}

/* ----------------- helpers & tiny components ----------------- */

function StatusFilter({ value, onChange }) {
  return (
    <div className="flex rounded-md overflow-hidden border border-slate-200 dark:border-slate-800">
      <button
        className={`px-3 py-2 ${
          value === "all"
            ? "bg-brand-500 text-white"
            : "bg-slate-200/50 dark:bg-slate-800"
        }`}
        onClick={() => onChange("all")}
      >
        All
      </button>
      <button
        className={`px-3 py-2 ${
          value === "pending"
            ? "bg-brand-500 text-white"
            : "bg-slate-200/50 dark:bg-slate-800"
        }`}
        onClick={() => onChange("pending")}
      >
        Pending
      </button>
      <button
        className={`px-3 py-2 ${
          value === "completed"
            ? "bg-brand-500 text-white"
            : "bg-slate-200/50 dark:bg-slate-800"
        }`}
        onClick={() => onChange("completed")}
      >
        Completed
      </button>
    </div>
  );
}

function GoalsSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-10 bg-slate-200 dark:bg-slate-800 rounded" />
      ))}
    </div>
  );
}

function prettyDate(yyyy_mm_dd) {
  try {
    return dayjs(yyyy_mm_dd).format("DD MMM YYYY");
  } catch {
    return yyyy_mm_dd || "";
  }
}
