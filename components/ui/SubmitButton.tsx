"use client";

interface SubmitButtonProps {
  loading: boolean;
}

export function SubmitButton({ loading }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{
        width: "100%",
        padding: "15px 28px",
        borderRadius: "9px",
        background: loading ? "rgba(47,109,255,0.6)" : "#2f6dff",
        color: "#fff",
        fontFamily: "var(--font-montserrat), system-ui, sans-serif",
        fontSize: "15px",
        fontWeight: "600",
        cursor: loading ? "not-allowed" : "pointer",
        border: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        transition: "background 0.15s, opacity 0.15s",
        minHeight: "50px",
      }}
      aria-live="polite"
      aria-label={loading ? "Submitting application..." : "Submit Application"}
    >
      {loading ? (
        <>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{ animation: "spin 0.8s linear infinite" }}
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </svg>
          Submitting…
        </>
      ) : (
        <>
          Submit Application
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </>
      )}
    </button>
  );
}
