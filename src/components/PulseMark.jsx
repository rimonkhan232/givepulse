export default function PulseMark({ size = 40, ring = false, tone = "crimson" }) {
  const fill = tone === "sky" ? "#0284c7" : "#dc1530";
  return (
    <div
      className={`relative flex items-center justify-center rounded-2xl bg-white ${ring ? "animate-pulsering" : ""}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size * 0.56}
        height={size * 0.56}
        viewBox="0 0 24 24"
        fill="none"
        className="animate-heartbeat"
      >
        <path
          d="M12 21s-7.5-4.7-10.2-9.8C.2 8.1 1.6 4.6 4.9 3.7c2.1-.6 4.2.3 5.4 2.1.4.6 1.2.6 1.6 0 1.2-1.8 3.3-2.7 5.4-2.1 3.3.9 4.7 4.4 3.1 7.5C19.5 16.3 12 21 12 21z"
          fill={fill}
        />
      </svg>
    </div>
  );
}
