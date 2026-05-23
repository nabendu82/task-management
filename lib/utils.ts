import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getBoardColorStyles(colorClass?: string) {
    switch (colorClass) {
        case "bg-green-500": // Future Plans (User wants very light yellow)
            return {
                bg: "bg-amber-50/80",
                border: "border-amber-200/80",
                text: "text-amber-950",
                accent: "text-amber-700",
                dot: "bg-amber-500",
                badge: "bg-amber-100 text-amber-800"
            };
        case "bg-purple-500": // Daily Plans (User wants very light cyan)
            return {
                bg: "bg-cyan-50/80",
                border: "border-cyan-200/80",
                text: "text-cyan-950",
                accent: "text-cyan-700",
                dot: "bg-cyan-500",
                badge: "bg-cyan-100 text-cyan-800"
            };
        case "bg-blue-500":
            return {
                bg: "bg-blue-50/80",
                border: "border-blue-200/80",
                text: "text-blue-950",
                accent: "text-blue-700",
                dot: "bg-blue-500",
                badge: "bg-blue-100 text-blue-800"
            };
        case "bg-yellow-500":
            return {
                bg: "bg-yellow-50/80",
                border: "border-yellow-200/80",
                text: "text-yellow-950",
                accent: "text-yellow-700",
                dot: "bg-yellow-500",
                badge: "bg-yellow-100 text-yellow-800"
            };
        case "bg-red-500":
            return {
                bg: "bg-rose-50/80",
                border: "border-rose-200/80",
                text: "text-rose-950",
                accent: "text-rose-700",
                dot: "bg-red-500",
                badge: "bg-rose-100 text-rose-800"
            };
        case "bg-pink-500":
            return {
                bg: "bg-pink-50/80",
                border: "border-pink-200/80",
                text: "text-pink-950",
                accent: "text-pink-700",
                dot: "bg-pink-500",
                badge: "bg-pink-100 text-pink-800"
            };
        case "bg-indigo-500":
            return {
                bg: "bg-indigo-50/80",
                border: "border-indigo-200/80",
                text: "text-indigo-950",
                accent: "text-indigo-700",
                dot: "bg-indigo-500",
                badge: "bg-indigo-100 text-indigo-800"
            };
        case "bg-gray-500":
            return {
                bg: "bg-slate-50/80",
                border: "border-slate-200/80",
                text: "text-slate-950",
                accent: "text-slate-700",
                dot: "bg-gray-500",
                badge: "bg-slate-100 text-slate-800"
            };
        case "bg-orange-500":
            return {
                bg: "bg-orange-50/80",
                border: "border-orange-200/80",
                text: "text-orange-950",
                accent: "text-orange-700",
                dot: "bg-orange-500",
                badge: "bg-orange-100 text-orange-800"
            };
        case "bg-teal-500":
            return {
                bg: "bg-teal-50/80",
                border: "border-teal-200/80",
                text: "text-teal-950",
                accent: "text-teal-700",
                dot: "bg-teal-500",
                badge: "bg-teal-100 text-teal-800"
            };
        case "bg-cyan-500":
            return {
                bg: "bg-cyan-50/80",
                border: "border-cyan-200/80",
                text: "text-cyan-950",
                accent: "text-cyan-700",
                dot: "bg-cyan-500",
                badge: "bg-cyan-100 text-cyan-800"
            };
        case "bg-emerald-500":
            return {
                bg: "bg-emerald-50/80",
                border: "border-emerald-200/80",
                text: "text-emerald-950",
                accent: "text-emerald-700",
                dot: "bg-emerald-500",
                badge: "bg-emerald-100 text-emerald-800"
            };
        default:
            return {
                bg: "bg-slate-50/80",
                border: "border-slate-200/80",
                text: "text-slate-950",
                accent: "text-slate-700",
                dot: "bg-slate-500",
                badge: "bg-slate-100 text-slate-800"
            };
    }
}
