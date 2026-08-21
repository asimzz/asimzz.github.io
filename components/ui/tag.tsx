export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="border-line text-ink-faint rounded-full border px-2.5 py-0.5 text-xs">
      {children}
    </span>
  );
}
