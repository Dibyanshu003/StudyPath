import ProgressBar from "./ProgressBar.jsx";

export default function SubjectCard({ subject, today }) {
  const tt = subject.trackingType;
  const timeDone = today?.completedMinutes || 0;
  const qDone = today?.completedQuestions || 0;
  const timeTarget = tt !== "questions" ? subject.targetPerDayMinutes || 0 : 0;
  const qTarget = tt !== "time" ? subject.targetPerDayQuestions || 0 : 0;
  const colorCode = subject.colorCode || "#6366F1";

  return (
    <div className="card space-y-3">
      <div className="font-medium">{subject.name}</div>

      {tt !== "questions" && (
        <ProgressBar
          value={timeDone}
          target={timeTarget}
          label="Time (min)"
          colorCode={colorCode}
        />
      )}

      {(tt === "questions" || tt === "both") && (
        <ProgressBar
          value={qDone}
          target={qTarget}
          label="Questions"
          colorCode={colorCode}
        />
      )}
    </div>
  );
}
