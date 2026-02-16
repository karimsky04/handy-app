export default function ProgressBar({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const pct = ((current + 1) / total) * 100;

  return (
    <div className="w-full px-6 sm:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="h-1 bg-navy-light rounded-full overflow-hidden">
          <div
            className="h-full bg-teal rounded-full transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
