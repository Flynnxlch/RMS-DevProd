export default function UserIcon({ className = "w-8 h-8", fill = "currentColor" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Head - Circle */}
      <circle
        cx="12"
        cy="8"
        r="4"
        stroke={fill}
        strokeWidth="2"
        fill="none"
      />
      {/* Shoulders - Arc */}
      <path
        d="M 4 20 Q 4 14 12 14 Q 20 14 20 20"
        stroke={fill}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
