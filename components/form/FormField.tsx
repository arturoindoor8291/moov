"use client";

import { forwardRef, InputHTMLAttributes } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  isConditional?: boolean;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, required, hint, isConditional, id, ...props }, ref) => {
    const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");
    const errorId = `${fieldId}-error`;

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
        <input
          ref={ref}
          id={fieldId}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          style={{
            width: "100%",
            background: "#0c0e14",
            border: `1px solid ${
              error ? "#ef4444" : isConditional ? "rgba(47,109,255,0.5)" : "rgba(255,255,255,0.1)"
            }`,
            borderRadius: "9px",
            padding: "12px 14px",
            color: "#eef1f6",
            fontFamily: "var(--font-montserrat), system-ui, sans-serif",
            fontSize: "14px",
            outline: "none",
            transition: "border-color 0.15s",
            minHeight: "44px",
          }}
          {...props}
        />
        {hint && !error && (
          <p className="text-xs" style={{ color: "rgba(238,241,246,0.35)" }}>
            {hint}
          </p>
        )}
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

FormField.displayName = "FormField";
