import clsx from 'clsx';

const PRIORITY_STYLES: Record<string, string> = {
  LOW: 'bg-status-low/10 text-status-low border-status-low/30',
  MEDIUM: 'bg-status-medium/10 text-status-medium border-status-medium/30',
  HIGH: 'bg-status-high/10 text-status-high border-status-high/30',
  CRITICAL: 'bg-status-critical/10 text-status-critical border-status-critical/40 animate-pulse',
};

const NEUTRAL_STYLE = 'bg-navy-900/5 text-navy-800 border-navy-900/15';

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className={clsx('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium', PRIORITY_STYLES[priority] ?? NEUTRAL_STYLE)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {priority}
    </span>
  );
}

export function StatusPill({ status }: { status: string }) {
  const readable = status.replace(/_/g, ' ');
  return (
    <span className={clsx('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', NEUTRAL_STYLE)}>
      {readable}
    </span>
  );
}
