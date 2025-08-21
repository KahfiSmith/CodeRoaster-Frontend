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
    description: "Sarkastik tapi membantu",
    color: "bg-coral",
  },
  {
    key: "brutal" as ReviewType,
    label: "💀 Brutal Jujur",
    description: "Tanpa ampun",
    color: "bg-orange-400",
  },
  {
    key: "encouraging" as ReviewType,
    label: "🌟 Mentor Supportif",
    description: "Positif dan mendukung",
    color: "bg-green-300",
  },
  {
    key: "codeQuality" as ReviewType,
    label: "🔍 Profesional",
    description: "Serius dan menyeluruh",
    color: "bg-sky",
  },
  {
    key: "security" as ReviewType,
    label: "🛡️ Fokus Keamanan",
    description: "Khusus keamanan",
    color: "bg-amber",
  },
  {
    key: "bestPractices" as ReviewType,
    label: "⭐ Best Practices",
    description: "Pola desain dan konvensi",
    color: "bg-purple-300",
  },
];
