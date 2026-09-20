type ComingSoonButtonProps = { className?: string; label: string };

export function ComingSoonButton({ className = "", label }: ComingSoonButtonProps) {
  return (
    <button
      aria-describedby="account-coming-soon"
      className={`cursor-not-allowed rounded-lg px-4 py-2 text-sm font-semibold opacity-75 ${className}`}
      disabled
      type="button"
    >
      {label} <span className="ml-1 text-xs font-medium">Coming soon</span>
    </button>
  );
}
