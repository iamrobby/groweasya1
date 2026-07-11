import { Step } from "@/types/crm";
import { Check } from "lucide-react";

const STEPS: { key: Step; label: string }[] = [
  { key: "upload", label: "Upload" },
  { key: "preview", label: "Preview" },
  { key: "processing", label: "Processing" },
  { key: "results", label: "Results" },
];

export default function StepIndicator({ current }: { current: Step }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4">
      {STEPS.map((step, i) => {
        const isDone = i < currentIndex;
        const isActive = i === currentIndex;
        return (
          <div key={step.key} className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold
                  ${isDone ? "bg-orange-500 text-white" : isActive ? "bg-orange-100 text-orange-600 border-2 border-orange-500" : "bg-gray-100 text-gray-400"}
                `}
              >
                {isDone ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={`text-sm hidden sm:inline ${isActive ? "font-semibold text-gray-900" : "text-gray-500"}`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="h-px w-6 sm:w-10 bg-gray-200" />
            )}
          </div>
        );
      })}
    </div>
  );
}