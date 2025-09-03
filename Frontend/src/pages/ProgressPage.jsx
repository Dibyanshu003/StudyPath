import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "../api/client.js";
import { toast } from "react-toastify";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import dayjs from "dayjs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function ProgressPage() {
  const [period, setPeriod] = useState("7d"); // '7d' | '30d'
  const [metric, setMetric] = useState("minutes"); // 'minutes' | 'questions'

  // progress
  const { data: weeklyRes, isLoading: wl } = useQuery({
    queryKey: ["progress", "7d"],
    queryFn: async () => (await api.get("/api/sessions/weekly")).data,
  });
  const { data: monthlyRes, isLoading: ml } = useQuery({
    queryKey: ["progress", "30d"],
    queryFn: async () => (await api.get("/api/sessions/monthly")).data,
  });

  const progress =
    period === "7d" ? weeklyRes?.progress || [] : monthlyRes?.progress || [];

  const loading = period === "7d" ? wl : ml;

  // heatmap + streak counters
  const { data: heatmapRes, isLoading: hl } = useQuery({
    queryKey: ["heatmap"],
    queryFn: async () => (await api.get("/api/streak/heatmap")).data,
  });
  const heatmap = heatmapRes?.heatmap || [];

  const { data: streakRes } = useQuery({
    queryKey: ["streak"],
    queryFn: async () => (await api.get("/api/streak")).data,
  });
  const currentStreak = streakRes?.currentStreak ?? 0;
  const maxStreak = streakRes?.maxStreak ?? 0;

  // AI insights
  const {
    data: insightsRes,
    isError: insightsMissing,
    refetch: refetchInsights,
    isFetching: il,
  } = useQuery({
    queryKey: ["weekly-insights"],
    queryFn: async () => (await api.get("/api/ai/insights")).data,
    retry: false,
  });

  const genInsights = useMutation({
    mutationFn: async () => (await api.post("/api/ai/generate")).data,
    onSuccess: () => {
      toast.success("Insights generated");
      refetchInsights();
    },
    onError: (err) => {
      const s = err?.response?.status;
      if (s === 404)
        toast.error("Log at least one session this week, then try again.");
      else if (s === 409) refetchInsights();
      else
        toast.error(
          err?.response?.data?.message || "Failed to generate insights"
        );
    },
  });

  // charts data
  const barData = useMemo(() => {
    const key =
      metric === "minutes" ? "completedMinutes" : "completedQuestions";
    return progress.map((p) => ({
      name: p.subjectName,
      value: p[key] || 0,
      color: p.colorCode || "#6366F1",
    }));
  }, [progress, metric]);

  const pieData = useMemo(() => {
    const rows = barData.filter((b) => b.value > 0);
    const total = rows.reduce((sum, r) => sum + r.value, 0) || 1;
    return rows.map((r) => ({
      name: r.name,
      value: r.value,
      percent: Math.round((r.value / total) * 100),
      color: r.color,
    }));
  }, [barData]);

  const hasAnyValue = barData.some((b) => b.value > 0);

  // heatmap bounds
  const today = dayjs().format("YYYY-MM-DD");
  const start365 = dayjs().subtract(364, "day").format("YYYY-MM-DD");

  // auto-scale thresholds like LeetCode
  const thresholds = useMemo(() => {
    const max = Math.max(0, ...heatmap.map((v) => v.count || 0));
    return {
      t1: max > 0 ? max * 0.25 : 0,
      t2: max > 0 ? max * 0.5 : 0,
      t3: max > 0 ? max * 0.75 : 0,
    };
  }, [heatmap]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-bold text-brand-400 text-2xl tracking-wide">
          Progress
        </h1>
        <div className="flex gap-2">
          <MetricToggle value={metric} onChange={setMetric} />
          <PeriodPicker value={period} onChange={setPeriod} />
        </div>
      </header>

      {/* Streak counters */}
      <section className="grid sm:grid-cols-2 gap-4">
        <div className="card flex items-center justify-between">
          <div className="font-medium">Current streak</div>
          <div className="text-2xl font-semibold">{currentStreak}🔥</div>
        </div>
        <div className="card flex items-center justify-between">
          <div className="font-medium">Best streak</div>
          <div className="text-2xl font-semibold">{maxStreak}🏆</div>
        </div>
      </section>

      {/* Charts */}
      <section className="grid lg:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="font-medium mb-3">
            {metric === "minutes" ? "Study time" : "Questions"} by subject (
            {period === "7d" ? "7 days" : "30 days"})
          </h2>
          {loading ? (
            <SkeletonChart />
          ) : hasAnyValue ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barData}
                  margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
                >
                  <XAxis dataKey="name" tick={{ fill: "currentColor" }} />
                  <YAxis tick={{ fill: "currentColor" }} />
                  <Tooltip
                    contentStyle={{
                      background: "rgb(15 23 42)",
                      border: "1px solid rgb(51 65 85)",
                      color: "#E2E8F0",
                    }}
                    formatter={(v) => [
                      metric === "minutes" ? `${v} min` : `${v} qns`,
                      metric === "minutes" ? "Time" : "Solved",
                    ]}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {barData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="opacity-70">No data for this period.</p>
          )}
        </div>

        <div className="card">
          <h2 className="font-medium mb-3">Distribution of {metric}</h2>
          {hasAnyValue ? (
            <ResponsiveContainer width="100%" height={256}>
              <PieChart>
                <Tooltip
                  contentStyle={{
                    background: "rgb(15 23 42)",
                    border: "1px solid rgb(51 65 85)",
                    color: "#E2E8F0",
                  }}
                  formatter={(v, n, p) => [
                    metric === "minutes" ? `${v} min` : `${v} qns`,
                    p?.payload?.name,
                  ]}
                />
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius="80%"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="opacity-70">Not enough data to show distribution.</p>
          )}
        </div>
      </section>

      {/* Heatmap (simple + reliable) */}
      <section className="card">
        <h2 className="font-medium mb-3">Streak heatmap (last 365 days)</h2>
        {hl ? (
          <SkeletonHeatmap />
        ) : (
          <div className="overflow-x-auto">
            <CalendarHeatmap
              startDate={start365}
              endDate={today}
              values={heatmap} // [{ date:'YYYY-MM-DD', count: minutes }]
              gutterSize={3}
              showMonthLabels={true}
              classForValue={(v) => {
                if (!v || !v.count) return "heat-0";
                const { t1, t2, t3 } = thresholds;
                const c = v.count;
                if (c <= t1) return "heat-1";
                if (c <= t2) return "heat-2";
                if (c <= t3) return "heat-3";
                return "heat-4";
              }}
              tooltipDataAttrs={(v) => ({
                "data-tip": v?.date ? `${v.date}: ${v.count} min` : "No study",
              })}
              showWeekdayLabels={false}
            />
          </div>
        )}
      </section>

      {/* Insights */}
      <section className="card">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Weekly AI Insights</h2>
          {insightsMissing && (
            <button
              className="btn btn-ghost"
              onClick={() => genInsights.mutate()}
              disabled={genInsights.isLoading}
            >
              {genInsights.isLoading ? "Generating…" : "Generate"}
            </button>
          )}
        </div>

        <div className="mt-3 grid md:grid-cols-3 gap-4">
          {il ? (
            <>
              <Skeleton lines={5} />
              <Skeleton lines={5} />
              <Skeleton lines={5} />
            </>
          ) : insightsMissing ? (
            <p className="opacity-70">
              No insights yet. Generate after logging sessions this week.
            </p>
          ) : (
            <>
              <Panel
                title="Feedback"
                text={insightsRes?.insights?.feedbackText}
              />
              <Panel title="Risks" text={insightsRes?.insights?.riskAreas} />
              <Panel
                title="Compared to last week"
                text={insightsRes?.insights?.comparisonWithLastWeek}
              />
            </>
          )}
        </div>
      </section>
    </div>
  );
}

// small UI bits
function MetricToggle({ value, onChange }) {
  return (
    <div className="flex rounded-md overflow-hidden border border-slate-200 dark:border-slate-800">
      <button
        className={`px-3 py-2 ${
          value === "minutes"
            ? "bg-brand-500 text-white"
            : "bg-slate-200/50 dark:bg-slate-800"
        }`}
        onClick={() => onChange("minutes")}
      >
        Minutes
      </button>
      <button
        className={`px-3 py-2 ${
          value === "questions"
            ? "bg-brand-500 text-white"
            : "bg-slate-200/50 dark:bg-slate-800"
        }`}
        onClick={() => onChange("questions")}
      >
        Questions
      </button>
    </div>
  );
}
function PeriodPicker({ value, onChange }) {
  return (
    <div className="flex rounded-md overflow-hidden border border-slate-200 dark:border-slate-800">
      <button
        className={`px-3 py-2 ${
          value === "7d"
            ? "bg-brand-500 text-white"
            : "bg-slate-200/50 dark:bg-slate-800"
        }`}
        onClick={() => onChange("7d")}
      >
        7 days
      </button>
      <button
        className={`px-3 py-2 ${
          value === "30d"
            ? "bg-brand-500 text-white"
            : "bg-slate-200/50 dark:bg-slate-800"
        }`}
        onClick={() => onChange("30d")}
      >
        30 days
      </button>
    </div>
  );
}

function Panel({ title, text }) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
      <div className="font-medium mb-2">{title}</div>
      <p className="opacity-90 whitespace-pre-line">{text || "—"}</p>
    </div>
  );
}
function Skeleton({ lines = 3 }) {
  return (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 bg-slate-200 dark:bg-slate-800 rounded" />
      ))}
    </div>
  );
}
function SkeletonChart() {
  return (
    <div className="h-64 flex items-center justify-center">
      <div className="animate-pulse h-24 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
    </div>
  );
}
function SkeletonHeatmap() {
  return (
    <div className="h-32 animate-pulse bg-slate-200 dark:bg-slate-800 rounded" />
  );
}
