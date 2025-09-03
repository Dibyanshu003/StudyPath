import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/client.js";
import SubjectCard from "../components/SubjectCard.jsx";
import AddSubjectModal from "../components/AddSubjectModal.jsx";
import { toast } from "react-toastify";

export default function DashboardPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  // All subjects
  const { data: subjectsRes } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => (await api.get("/api/subjects")).data,
  });
  // normalize: allow {data: []} or {subjects: []} or []
  const subjects =
    subjectsRes?.data || subjectsRes?.subjects || subjectsRes || [];

  // Today's progress ONLY
  const { data: dailyRes, isLoading: dailyLoading } = useQuery({
    queryKey: ["daily-progress"],
    queryFn: async () => (await api.get("/api/sessions/daily")).data,
    staleTime: 0,
  });
  const dailyProgress = dailyRes?.progress || [];

  // Build lookups to merge by subjectId (preferred) and by name (fallback)
  const dailyById = new Map(
    dailyProgress
      .filter((p) => p.subjectId)
      .map((p) => [String(p.subjectId), p])
  );
  const dailyByName = new Map(
    dailyProgress.map((p) => [
      String(p.subjectName || p.name || "").toLowerCase(),
      p,
    ])
  );

  // Merge: every subject appears
  const todayItems = (subjects || []).map((s) => {
    const sid = String(s._id || s.id || "");
    const keyName = String(s.name || "").toLowerCase();
    const p = (sid && dailyById.get(sid)) || dailyByName.get(keyName);

    return {
      subject: {
        name: s.name,
        trackingType: s.trackingType,
        targetPerDayMinutes: s.targetPerDayMinutes ?? s.targetMinutes ?? null,
        targetPerDayQuestions:
          s.targetPerDayQuestions ?? s.targetQuestions ?? null,
        colorCode: s.colorCode || "#6366F1",
      },
      today: {
        completedMinutes: p?.completedMinutes || 0,
        completedQuestions: p?.completedQuestions || 0,
      },
    };
  });

  // Weekly activity check (used by AI generate button state)
  const { data: weeklyRes, isLoading: weeklyLoading } = useQuery({
    queryKey: ["weekly-progress"],
    queryFn: async () => (await api.get("/api/sessions/weekly")).data,
  });
  const hasWeeklyActivity = (weeklyRes?.progress || []).some(
    (p) => (p.completedMinutes || 0) > 0 || (p.completedQuestions || 0) > 0
  );

  // AI insights
  const {
    data: insightsRes,
    isError: insightsMissing,
    refetch: refetchInsights,
    isFetching: insightsLoading,
  } = useQuery({
    queryKey: ["weekly-insights"],
    queryFn: async () => (await api.get("/api/ai/insights")).data,
    retry: false,
  });

  const genMutation = useMutation({
    mutationFn: async () => (await api.post("/api/ai/generate")).data,
    onSuccess: () => {
      toast.success("Insights generated");
      refetchInsights();
    },
    onError: (err) => {
      const s = err?.response?.status;
      if (s === 404)
        toast.error(
          "Log at least one study session this week, then generate insights."
        );
      else if (s === 409) refetchInsights();
      else
        toast.error(
          err?.response?.data?.message || "Failed to generate insights"
        );
    },
  });
  const motivation = insightsRes?.insights?.motivationalText;

  // Auto-refresh at local midnight (fresh dashboard for the new day)
  useEffect(() => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const t = setTimeout(() => {
      qc.invalidateQueries({ queryKey: ["daily-progress"] });
    }, midnight.getTime() - now.getTime());
    return () => clearTimeout(t);
  }, [qc]);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="font-bold text-brand-400 text-2xl tracking-wide mb-4">
          Dashboard
        </h1>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          + Add Subject
        </button>
      </header>

      {/* AI Motivation */}
      <section className="card">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">AI Motivation</h2>
          {insightsMissing && (
            <button
              onClick={() => genMutation.mutate()}
              className="btn btn-ghost"
              disabled={genMutation.isLoading || weeklyLoading} // allow even if no weekly activity
              title=""
            >
              {genMutation.isLoading ? "Generating…" : "Generate"}
            </button>
          )}
        </div>

        <div className="mt-2 min-h-[3rem]">
          {insightsLoading ? (
            <Skeleton lines={2} />
          ) : motivation ? (
            <p className="leading-relaxed">{motivation}</p>
          ) : insightsMissing ? (
            <div className="opacity-80">
              No insights for this week.
              <p className="mt-1 text-sm opacity-70">
                You can still generate motivation anytime — click Generate.
              </p>
            </div>
          ) : (
            <p className="opacity-70">—</p>
          )}
        </div>
      </section>

      {/* Today grid: show ALL subjects; new ones appear with 0 minutes/questions */}
      <section>
        <h2 className="font-medium mb-3">Today</h2>
        {dailyLoading && subjects.length === 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : subjects.length === 0 ? (
          <div className="card">
            <p className="opacity-70">
              No subjects yet. Click “Add Subject” to get started.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {todayItems.map((row, i) => (
              <SubjectCard key={i} subject={row.subject} today={row.today} />
            ))}
          </div>
        )}
      </section>

      <AddSubjectModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={(created) => {
          // Show the newly created subject immediately in the grid with zeros
          qc.setQueryData(["subjects"], (old) => {
            const list = (old?.data || old?.subjects || old) ?? [];
            const idOf = (x) => x?._id || x?.id;
            if (list.some((x) => idOf(x) === idOf(created))) return old;
            const updated = [...list, created];
            if (old?.data) return { ...old, data: updated };
            if (old?.subjects) return { ...old, subjects: updated };
            return updated;
          });
          // Keep server cache fresh for next loads
          qc.invalidateQueries({ queryKey: ["subjects"] });
        }}
      />
    </div>
  );
}

function Skeleton({ lines = 1 }) {
  return (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 bg-slate-200 dark:bg-slate-800 rounded" />
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-3" />
      <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
      <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
    </div>
  );
}
