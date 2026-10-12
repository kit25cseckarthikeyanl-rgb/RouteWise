export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-navy-900/15 py-16 text-center">
      <p className="font-display text-lg text-navy-800">{title}</p>
      {description && <p className="max-w-sm text-sm text-navy-600">{description}</p>}
    </div>
  );
}
