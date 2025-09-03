import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api/client.js";

export default function SessionsPage() {
  const qc = useQueryClient();
  const nav = useNavigate();

  // subjects
  const { data: subjectsRes, isLoading: loadingSubjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => (await api.get("/api/subjects")).data,
  });
  const subjects = subjectsRes?.subjects || [];

  const [subjectId, setSubjectId] = useState("");
  useEffect(() => {
    if (!subjectId && subjects.length) setSubjectId(subjects[0]._id);
  }, [subjects, subjectId]);

  const selected = useMemo(
    () => subjects.find((s) => s._id === subjectId),
    [subjects, subjectId]
  );
  const canTime = selected?.trackingType !== "questions";
  const canQuestions =
    selected?.trackingType === "questions" || selected?.trackingType === "both";
  const targetMin = canTime ? selected?.targetPerDayMinutes || 0 : 0;
  const targetQns = canQuestions ? selected?.targetPerDayQuestions || 0 : 0;
  const subjColor = selected?.colorCode || "#6366F1";

  // mode: timer or manual
  const [mode, setMode] = useState("timer"); // 'timer' | 'manual'
  useEffect(() => {
    // pick sensible default based on subject type
    if (!selected) return;
    if (selected.trackingType === "questions")
      setMode("timer"); // timer will just show counter
    else setMode("timer");
  }, [selected]);

  // ---------- TIMER STATE ----------
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const tickRef = useRef(null);

  useEffect(() => {
    if (!running) {
      if (tickRef.current) clearInterval(tickRef.current);
      return;
    }
    tickRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [running]);

  // Questions counter (used in timer & manual)
  const [qCount, setQCount] = useState(0);

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === " ") {
        e.preventDefault();
        setRunning((r) => !r);
      }
      if (e.key === "+" || e.key === "=") setQCount((q) => q + 1);
      if (e.key === "-" || e.key === "_") setQCount((q) => Math.max(0, q - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const resetTimer = () => {
    setRunning(false);
    setSeconds(0);
    setQCount(0);
  };

  const saveMutation = useMutation({
    mutationFn: async ({ durationMin, questionsSolved }) => {
      if (!subjectId) throw new Error("Pick a subject");
      if (
        (!durationMin || durationMin <= 0) &&
        (!questionsSolved || questionsSolved <= 0)
      ) {
        throw new Error("Add time or questions before saving");
      }
      const payload = {
        subjectId,
        duration: durationMin || 0,
        questionsSolved: questionsSolved || 0,
      };
      return (await api.post("/api/sessions/log", payload)).data;
    },
    onSuccess: () => {
      toast.success("Session saved");
      qc.invalidateQueries({ queryKey: ["daily-progress"] });
      qc.invalidateQueries({ queryKey: ["weekly-progress"] });
      qc.invalidateQueries({ queryKey: ["progress", "7d"] });
      qc.invalidateQueries({ queryKey: ["progress", "30d"] });
      qc.invalidateQueries({ queryKey: ["heatmap"] });
      resetTimer();
      nav("/", { replace: true });
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to save"
      );
    },
  });

  // ---------- MANUAL STATE ----------
  const [manualMin, setManualMin] = useState("");
  const [manualQ, setManualQ] = useState("");

  const handleSaveTimer = () => {
    const minutes = Math.max(0, Math.round(seconds / 60));
    const qs = canQuestions ? qCount : 0;
    saveMutation.mutate({
      durationMin: canTime ? minutes : 0,
      questionsSolved: qs,
    });
  };
  const handleSaveManual = () => {
    const minutes = canTime ? Number(manualMin) || 0 : 0;
    const qs = canQuestions ? Number(manualQ) || 0 : 0;
    saveMutation.mutate({ durationMin: minutes, questionsSolved: qs });
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="font-bold text-brand-400 text-2xl tracking-wide">
          Study Sessions
        </h1>
        <div className="flex rounded-md overflow-hidden border border-slate-200 dark:border-slate-800">
          <button
            className={`px-3 py-2 ${
              mode === "timer"
                ? "bg-brand-500 text-white"
                : "bg-slate-200/50 dark:bg-slate-800"
            }`}
            onClick={() => setMode("timer")}
          >
            Timer
          </button>
          <button
            className={`px-3 py-2 ${
              mode === "manual"
                ? "bg-brand-500 text-white"
                : "bg-slate-200/50 dark:bg-slate-800"
            }`}
            onClick={() => setMode("manual")}
          >
            Manual Entry
          </button>
        </div>
      </header>

      {/* Subject Select */}
      <div className="card">
        {loadingSubjects ? (
          <div className="animate-pulse h-10 bg-slate-200 dark:bg-slate-800 rounded" />
        ) : subjects.length === 0 ? (
          <p className="opacity-80">
            No subjects yet. Go to Dashboard and add one first.
          </p>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="text-sm">Subject</label>
            <select
              className="px-3 py-2 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full sm:w-auto"
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value);
                resetTimer();
                setManualMin("");
                setManualQ("");
              }}
            >
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>

            <div className="text-sm opacity-70 mt-2 sm:mt-0 sm:ml-3">
              {canTime && !!targetMin && (
                <span className="mr-3">Target: {targetMin} min</span>
              )}
              {canQuestions && !!targetQns && (
                <span>Target: {targetQns} qns</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* TIMER MODE */}
      {mode === "timer" && (
        <div className="card">
          <div className="grid md:grid-cols-[220px_1fr] gap-6">
            {/* Ring */}
            <div className="flex items-center justify-center">
              <Ring
                color={subjColor}
                valueMin={canTime ? Math.round(seconds / 60) : 0}
                targetMin={targetMin}
              >
                <div className="text-center">
                  <div className="text-3xl font-semibold tabular-nums">
                    {formatTime(seconds)}
                  </div>
                  <div className="text-xs opacity-70 mt-1">
                    Press <kbd className="kbd">Space</kbd> to start/pause
                  </div>
                </div>
              </Ring>
            </div>

            {/* Controls */}
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <button
                  className={`btn ${running ? "btn-ghost" : "btn-primary"}`}
                  onClick={() => setRunning((r) => !r)}
                  disabled={!selected}
                >
                  {running ? "Pause" : "Start"}
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={resetTimer}
                  disabled={!seconds && !qCount}
                >
                  Reset
                </button>
              </div>

              {canQuestions && (
                <QuestionCounter
                  value={qCount}
                  onChange={setQCount}
                  color={subjColor}
                />
              )}

              <div className="flex justify-end">
                <button
                  className="btn btn-primary"
                  onClick={handleSaveTimer}
                  disabled={
                    saveMutation.isLoading ||
                    (!canTime && qCount === 0) ||
                    (canTime && seconds < 30 && qCount === 0)
                  }
                  title={
                    canTime && seconds < 30 && qCount === 0
                      ? "Log at least 30 seconds or some questions"
                      : ""
                  }
                >
                  {saveMutation.isLoading ? "Saving…" : "Save Session"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL MODE */}
      {mode === "manual" && (
        <div className="card max-w-xl">
          {canTime && (
            <>
              <label className="block mb-2 text-sm">Duration (minutes)</label>
              <input
                type="number"
                min="0"
                className="w-full mb-4 px-3 py-2 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                value={manualMin}
                onChange={(e) => setManualMin(e.target.value)}
                placeholder="e.g., 45"
              />
            </>
          )}

          {canQuestions && (
            <>
              <label className="block mb-2 text-sm">Questions solved</label>
              <input
                type="number"
                min="0"
                className="w-full mb-6 px-3 py-2 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                value={manualQ}
                onChange={(e) => setManualQ(e.target.value)}
                placeholder="e.g., 20"
              />
            </>
          )}

          <div className="flex justify-end gap-2">
            <button
              className="btn btn-ghost"
              onClick={() => {
                setManualMin("");
                setManualQ("");
              }}
            >
              Clear
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSaveManual}
              disabled={
                saveMutation.isLoading ||
                (!Number(manualMin) && !Number(manualQ))
              }
            >
              {saveMutation.isLoading ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// helpers / subcomponents

function formatTime(total) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function Ring({ valueMin, targetMin, color, children }) {
  const pct =
    targetMin > 0 ? Math.min(100, Math.round((valueMin / targetMin) * 100)) : 0;
  const bg = "rgba(148,163,184,.20)"; // slate-400 @20%
  const ring = `conic-gradient(${color} ${pct * 3.6}deg, ${bg} 0deg)`;
  return (
    <div className="relative">
      <div
        className="h-44 w-44 rounded-full"
        style={{ background: ring }}
        aria-label="progress ring"
      />
      <div className="absolute inset-3 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-800">
        {children}
      </div>
    </div>
  );
}

function QuestionCounter({ value, onChange, color }) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
      <div className="text-sm opacity-80 mb-2">Questions</div>
      <div className="flex items-center gap-3">
        <button
          className="btn btn-ghost"
          onClick={() => onChange(Math.max(0, value - 1))}
        >
          −
        </button>
        <input
          type="number"
          min="0"
          className="w-24 text-center px-3 py-2 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          value={value}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        />
        <button
          className="btn btn-primary"
          style={{ backgroundColor: color }}
          onClick={() => onChange(value + 1)}
        >
          +
        </button>
      </div>
      <div className="text-xs opacity-70 mt-2">
        Shortcuts: <kbd className="kbd">+</kbd>/<kbd className="kbd">-</kbd>
      </div>
    </div>
  );
}
