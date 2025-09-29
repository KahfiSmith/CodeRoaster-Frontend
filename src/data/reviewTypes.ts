import { ReviewType } from "@/types";

export interface ReviewTypeOption {
  key: ReviewType;
  label: string;
  description: string;
  color: string;
}

export const reviewTypes: ReviewTypeOption[] = [
  {
    key: "sarcastic" as ReviewType,
    label: "🔥 Roasting",
    description: "Sarcastic but helpful",
    color: "bg-coral",
  },
  {
    key: "brutal" as ReviewType,
    label: "💀 Brutal Honesty",
    description: "No mercy",
    color: "bg-orange-400",
  },
  {
    key: "encouraging" as ReviewType,
    label: "🌟 Supportive Mentor",
    description: "Positive and encouraging",
    color: "bg-green-300",
  },
  {
    key: "codeQuality" as ReviewType,
    label: "🔍 Professional",
    description: "Serious and thorough",
    color: "bg-sky",
  },
  {
    key: "security" as ReviewType,
    label: "🛡️ Security Focus",
    description: "Security-specific",
    color: "bg-amber",
  },
  {
    key: "bestPractices" as ReviewType,
    label: "⭐ Best Practices",
    description: "Design patterns and conventions",
    color: "bg-purple-300",
  },
];
