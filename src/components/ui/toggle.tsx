"use client";

/**
 * Cardstock toggle switch. Controlled — caller owns the boolean.
 * Designed for the settings rows: ~32×18px, ink-on-paper.
 */

interface ToggleProps {
  on: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Toggle({ on, onChange, label, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative inline-flex items-center rounded-full transition-colors disabled:opacity-50 ${
        on ? "bg-cs-ink" : "bg-cs-paper-felt"
      }`}
      style={{
        width: 36,
        height: 20,
        boxShadow: "inset 0 0 0 1px rgba(28,26,20,0.18)",
      }}
    >
      <span
        aria-hidden="true"
        className="bg-cs-paper rounded-full transition-transform"
        style={{
          width: 14,
          height: 14,
          transform: `translateX(${on ? 19 : 3}px)`,
          boxShadow: "0 1px 2px rgba(20,17,11,0.25)",
        }}
      />
    </button>
  );
}
