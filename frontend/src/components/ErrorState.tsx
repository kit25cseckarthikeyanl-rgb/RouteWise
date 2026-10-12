export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-status-critical/30 bg-status-critical/5 py-12 text-center">
      <p className="text-sm font-medium text-status-critical">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-md border border-status-critical/40 px-3 py-1.5 text-xs font-medium text-status-critical hover:bg-status-critical/10"
        >
          Retry
        </button>
      )}
    </div>
  );
}
