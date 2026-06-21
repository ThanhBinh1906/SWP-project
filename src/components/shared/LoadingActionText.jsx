export default function LoadingActionText({ children, className = "" }) {
  return (
    <span
      className={`inline-flex min-w-0 items-center justify-center ${className}`}
      role="status"
      aria-live="polite"
    >
      <span>{children}</span>
      <span className="inline-flex w-[1.35em] justify-start" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className="animate-[loading-dot_1.2s_infinite] motion-reduce:animate-none"
            style={{ animationDelay: `${index * 0.2}s` }}
          >
            .
          </span>
        ))}
      </span>
      <style>{`
        @keyframes loading-dot {
          0%, 20% { opacity: 0; transform: translateY(1px); }
          40%, 100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </span>
  );
}
