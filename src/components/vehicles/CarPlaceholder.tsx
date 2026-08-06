export default function CarPlaceholder() {
  return (
    <div className="relative flex aspect-[3/2] w-full items-center justify-center overflow-hidden bg-muted">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_60%,var(--color-border)_0%,transparent_70%)]" />
      <svg
        viewBox="0 0 200 90"
        width="75%"
        className="opacity-35 drop-shadow-[0_6px_12px_rgba(0,0,0,0.3)]"
        fill="currentColor"
      >
        <path d="M20 58 L30 32 Q40 18 75 16 L125 16 Q160 18 170 32 L180 58 L185 62 L185 72 Q185 76 181 76 L155 76 Q151 76 151 72 L151 70 L49 70 L49 72 Q49 76 45 76 L19 76 Q15 76 15 72 L15 62 Z" />
        <ellipse cx="48" cy="70" rx="14" ry="14" fill="#333" />
        <ellipse cx="48" cy="70" rx="7" ry="7" fill="#666" />
        <ellipse cx="152" cy="70" rx="14" ry="14" fill="#333" />
        <ellipse cx="152" cy="70" rx="7" ry="7" fill="#666" />
        <path d="M35 34 L55 20 L100 18 L100 38 L35 38 Z" fill="rgba(180,220,255,0.25)" />
        <path d="M100 18 L145 20 L165 34 L165 38 L100 38 Z" fill="rgba(180,220,255,0.18)" />
      </svg>
    </div>
  )
}