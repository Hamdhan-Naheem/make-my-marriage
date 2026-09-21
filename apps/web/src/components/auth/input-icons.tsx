type IconProps = { className?: string };

export function MailIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      <rect height="15" rx="2" width="19" x="2.5" y="4.5" />
      <path d="m3.5 6 8.1 6.1a.7.7 0 0 0 .8 0L20.5 6" />
    </svg>
  );
}

export function PersonIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.8-3.2 3.2-5 7-5s6.2 1.8 7 5" />
    </svg>
  );
}

export function EyeIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M2.5 12s3.3-5.5 9.5-5.5S21.5 12 21.5 12 18.2 17.5 12 17.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

export function EyeOffIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M10.7 6.7A10.8 10.8 0 0 1 12 6.5c6.2 0 9.5 5.5 9.5 5.5a15.3 15.3 0 0 1-3.1 3.5M6.2 8.2A15.3 15.3 0 0 0 2.5 12s3.3 5.5 9.5 5.5c1.2 0 2.3-.2 3.3-.6" />
      <path d="m3 3 18 18M9.6 9.6A3.4 3.4 0 0 0 14.4 14.4" />
    </svg>
  );
}
