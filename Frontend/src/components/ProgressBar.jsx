export default function ProgressBar({
  value = 0,
  target = 0,
  colorCode,
  label,
}) {
  const pct =
    target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;

  return (
    <div>
      {label && (
        <div className="flex items-baseline justify-between mb-1 text-sm">
          <span className="opacity-80">{label}</span>
          <span className="opacity-70">
            {value}/{target || 0}
          </span>
        </div>
      )}

      <div className="h-2.5 rounded bg-slate-200/70 dark:bg-slate-800 overflow-hidden">
        <div
          className="h-full transition-all"
          style={{
            width: `${pct}%`,
            backgroundColor: colorCode || "#6366F1", // Always use subject color
          }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={target || 0}
        />
      </div>
    </div>
  );
}
