"use client";

import { forwardRef, TextareaHTMLAttributes } from "react";

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  ({ label, error, required, hint, id, ...props }, ref) => {
    const fieldId = id || label.toLowerCase().replace(/\s+/g, "-");
    const errorId = `${fieldId}-error`;

    return (
      <div className="flex flex-col gap-2">
        <label
          htmlFor={fieldId}
          className="font-mono text-[10px] tracking-[0.08em] uppercase"
          style={{ color: "rgba(238,241,246,0.5)" }}
        >
          {label}
          {required && <span className="ml-1 text-[#ef4444]">*</span>}
        </label>
        <textarea
          ref={ref}
          id={fieldId}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          style={{
            width: "100%",
            background: "#0c0e14",
            border: `1px solid ${error ? "#ef4444" : "rgba(255,255,255,0.1)"}`,
            borderRadius: "9px",
            padding: "12px 14px",
            color: "#eef1f6",
            fontFamily: "var(--font-montserrat), system-ui, sans-serif",
            fontSize: "14px",
            outline: "none",
            resize: "vertical",
            lineHeight: "1.6",
            transition: "border-color 0.15s",
            minHeight: "80px",
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

TextareaField.displayName = "TextareaField";
