import { Church } from "lucide-react";

export function ChurchLogo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Foundation/House Shape */}
      <svg
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-current"
      >
        <path
          d="M100 400V220L256 100L412 220V400H100Z"
          stroke="currentColor"
          strokeWidth="24"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Cross */}
        <path
          d="M256 160V340M190 230H322"
          stroke="currentColor"
          strokeWidth="24"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Text "ATOS" (Simplified Path or Text) */}
        <text
          x="256"
          y="480"
          fill="currentColor"
          fontSize="70"
          fontWeight="800"
          textAnchor="middle"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          ATOS
        </text>
      </svg>
    </div>
  );
}
