import React, { useRef } from "react";

// 4-box dotted PIN entry. Controlled: value is the digit string, onChange gets
// the cleaned (digits-only, max 4) value. A single transparent input overlays
// the boxes and captures keystrokes; the boxes just render the dots.
const PinInput = ({ value = "", onChange, length = 4, autoFocus, ariaLabel = "PIN" }) => {
  const ref = useRef(null);
  return (
    <div className="relative inline-flex cursor-text gap-[10px]" onClick={() => ref.current?.focus()}>
      {Array.from({ length }).map((_, i) => (
        <div
          key={i}
          className={`grid h-[56px] w-[48px] place-items-center rounded-[10px] border-2 bg-[var(--color-surface)] transition-colors duration-150 ${
            i === value.length ? "border-primary" : "border-[var(--color-border)]"
          }`}
        >
          {i < value.length && <span className="h-[13px] w-[13px] rounded-full bg-primary" />}
        </div>
      ))}
      <input
        ref={ref}
        className="absolute inset-0 h-full w-full cursor-text border-none opacity-0"
        value={value}
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus={autoFocus}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, length))}
      />
    </div>
  );
};

export default PinInput;
