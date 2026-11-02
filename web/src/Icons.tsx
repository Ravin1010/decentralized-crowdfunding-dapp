export function Arrow({
  direction = "up",
}: {
  direction?: "up" | "right" | "left";
}) {
  return (
    <svg
      className={`arrow-icon arrow-${direction}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <path d="M5 19 19 5M5 5h14v14" />
    </svg>
  );
}
export function Spark() {
  return (
    <svg
      className="spark-icon"
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      aria-hidden="true"
    >
      <path d="M16 2v28M2 16h28M6 6l20 20M6 26 26 6" />
    </svg>
  );
}
export function WalletIcon() {
  return (
    <svg
      className="arrow-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="15" rx="3" />
      <path d="M3 9h18M16 13h5v4h-5z" />
    </svg>
  );
}
