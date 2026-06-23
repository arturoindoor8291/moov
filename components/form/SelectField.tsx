"use client";

import { forwardRef, SelectHTMLAttributes } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[] | readonly string[];
  error?: string;
  required?: boolean;
  placeholder?: string;
  isConditional?: boolean;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, options, error, required, placeholder, isConditional, id, ...props }, ref) => {
    const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");
    const errorId = `${fieldId}-error`;

    const normalizedOptions: SelectOption[] = options.map((opt) =>
      typeof opt === "string" ? { value: opt, label: opt } : opt
    );

    return (
      <div className="flex flex-col gap-2">
        <label
          htmlFor={fieldId}
          className="font-mono text-[10px] tracking-[0.08em] uppercase"
          style={{ color: isConditional ? "#2f6dff" : "rgba(238,241,246,0.5)" }}
        >
          {label}
          {required && <span className="ml-1 text-[#ef4444]">*</span>}
        </label>
        <div className="relative">
          <select
            ref={ref}
            id={fieldId}
            aria-required={required}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            style={{
              width: "100%",
              background: "#0c0e14",
              border: `1px solid ${
                error
                  ? "#ef4444"
                  : isConditional
                    ? "rgba(47,109,255,0.5)"
                    : "rgba(255,255,255,0.1)"
              }`,
              borderRadius: "9px",
              padding: "12px 36px 12px 14px",
              color: "#eef1f6",
              fontFamily: "var(--font-montserrat), system-ui, sans-serif",
              fontSize: "14px",
              outline: "none",
              appearance: "none",
              cursor: "pointer",
              transition: "border-color 0.15s",
              minHeight: "44px",
            }}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {normalizedOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              right: "13px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "rgba(238,241,246,0.35)",
              pointerEvents: "none",
              fontSize: "11px",
            }}
          >
            ▾
          </span>
        </div>
        {error && (
          <p
            id={errorId}
            role="alert"
            className="text-xs font-mono"
            style={{ color: "#ef4444" }}
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

SelectField.displayName = "SelectField";
