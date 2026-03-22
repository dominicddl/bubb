interface BubbLogoProps {
  size?: number;
  className?: string;
}

export function BubbLogo({ size = 32, className }: BubbLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="18 4 82 116"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Left ear */}
      <path
        d="M32 48 L40 12 L52 44"
        stroke="#0d7a6e"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Right ear */}
      <path
        d="M62 44 L74 12 L82 48"
        stroke="#0d7a6e"
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Head */}
      <rect
        x="26"
        y="40"
        width="66"
        height="42"
        rx="8"
        stroke="#0d7a6e"
        strokeWidth="5.5"
        fill="none"
      />

      {/* Red dots at ear bases */}
      <circle cx="38" cy="42" r="3.5" fill="#d44030" />
      <circle cx="57" cy="42" r="3.5" fill="#d44030" />
      <circle cx="76" cy="42" r="3.5" fill="#d44030" />

      {/* Nose/eye dot */}
      <ellipse cx="48" cy="58" rx="2.5" ry="3" fill="#0d7a6e" />

      {/* Red smile */}
      <path
        d="M68 68 L75 62 L82 68"
        stroke="#d44030"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        transform="rotate(180, 75, 65)"
      />

      {/* Lower jaw / scarf area */}
      <path
        d="M26 82 L26 94 Q26 102 34 102 L80 102 Q88 102 88 94"
        stroke="#0d7a6e"
        strokeWidth="5.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Scarf wrap */}
      <path
        d="M30 94 L78 94 Q86 94 86 100 L86 108 Q86 114 78 114 L48 114"
        stroke="#0d7a6e"
        strokeWidth="5.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
